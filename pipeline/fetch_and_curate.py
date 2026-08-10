#!/usr/bin/env python3
"""
fetch_and_curate.py

Corre en background (cron), NO en cada visita a la landing page.

Flujo:
  1. Trae noticias de Alpha Vantage News & Sentiment (filtradas por tickers de IA).
  2. Trae precios actuales de Finnhub para los mismos tickers (Alpha Vantage News no incluye
     cotizaciones, y su límite free de 25 req/día no alcanza para 9 quotes por corrida).
  3. Actualiza price_history.json (ventana local de los últimos puntos) para poder dibujar
     sparklines reales en el frontend sin depender de un endpoint histórico de pago.
  4. Pre-filtra las noticias localmente por relevance_score (gratis, sin gastar tokens de LLM).
  5. Manda solo los top N candidatos + los cambios de precio a Claude, en una sola llamada,
     con el system prompt cacheado. El modelo devuelve la curación de noticias Y el resumen
     narrativo del sector en la misma respuesta.
  6. Reasocia source/fecha de publicación localmente (por URL) en vez de pedírselo al modelo,
     así el output del LLM se mantiene chico.
  7. Escribe data.json en la raíz del proyecto, que es lo único que la landing page lee.

Variables de entorno requeridas:
  ALPHAVANTAGE_API_KEY
  FINNHUB_API_KEY
  ANTHROPIC_API_KEY

Uso:
  python fetch_and_curate.py
"""

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import urlopen
from urllib.parse import urlencode

import anthropic  # pip install anthropic

# --- Config ---------------------------------------------------------------

AV_API_KEY = os.environ.get("ALPHAVANTAGE_API_KEY")
FINNHUB_API_KEY = os.environ.get("FINNHUB_API_KEY")
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")

# Tickers de referencia del sector IA — ajustá esta lista a lo que te interese.
AI_TICKERS = ["NVDA", "MSFT", "GOOGL", "META", "AMZN", "AVGO", "ORCL", "PLTR", "AMD"]
TICKER_NAMES = {
    "NVDA": "NVIDIA",
    "MSFT": "Microsoft",
    "GOOGL": "Alphabet",
    "META": "Meta Platforms",
    "AMZN": "Amazon",
    "AVGO": "Broadcom",
    "ORCL": "Oracle",
    "PLTR": "Palantir",
    "AMD": "Advanced Micro Devices",
}

MAX_CANDIDATES = 15  # cuántos artículos pre-filtrados se mandan al LLM
HISTORY_POINTS = 12  # puntos que se guardan por ticker para el sparkline
MODEL = "claude-sonnet-5"

PROJECT_ROOT = Path(__file__).resolve().parent.parent
HISTORY_PATH = Path(__file__).parent / "price_history.json"
DATA_PATH = PROJECT_ROOT / "data.json"

SYSTEM_PROMPT = """Sos un editor financiero especializado en inteligencia artificial y mercados bursátiles.

Recibís un JSON con dos listas:
- "articles": candidatos de noticias, cada uno con title, summary, tickers, relevance_score, sentiment_score.
- "stocks": precios del día por ticker, cada uno con ticker y changePct.

Tareas (una sola respuesta, sin explicar tu razonamiento):
1. De "articles", elegí los 8 más relevantes para un inversor que quiere entender cómo el sector de IA
   está moviendo la bolsa hoy. Priorizá relevance_score alto y contenido sobre precio, earnings, guidance,
   anuncios de producto con impacto en cotización o decisiones regulatorias. Si dos artículos cubren la
   misma noticia, quedate con uno solo. Excluí contenido promocional o sin relación directa con IA + mercado.
2. Escribí un resumen del sector en máximo 60 palabras que combine lo que dicen los artículos elegidos con
   los movimientos de precio de "stocks", mencionando 1-2 empresas concretas como ejemplo.
3. Clasificá el sentimiento general del sector como "bullish", "bearish" o "mixed".

Formato de salida — SOLO JSON, sin texto antes ni después, sin markdown dentro del JSON:

{
  "sector_summary": {
    "sentiment": "bullish" | "bearish" | "mixed",
    "text": "<máx 60 palabras>"
  },
  "items": [
    {
      "headline": "<máx 12 palabras, tono neutral>",
      "summary": "<máx 25 palabras, qué pasó y por qué importa>",
      "tickers": ["<símbolo>", ...],
      "sentiment": "positive" | "negative" | "neutral",
      "source_url": "<url original, copiada literal del artículo>"
    }
  ]
}

No incluyas campos extra. Si hay menos de 8 artículos relevantes, devolvé los que haya."""


# --- Noticias (Alpha Vantage) ----------------------------------------------


def fetch_alphavantage_news() -> list[dict]:
    if not AV_API_KEY:
        sys.exit("Falta ALPHAVANTAGE_API_KEY en el entorno.")

    params = {
        "function": "NEWS_SENTIMENT",
        # No "topics" filter: Alpha Vantage ANDs topics with tickers, and that
        # combination reliably returns zero results. The ticker list already
        # scopes this to AI-sector companies, which is enough on its own.
        "tickers": ",".join(AI_TICKERS),
        "apikey": AV_API_KEY,
        "sort": "RELEVANCE",
        "limit": "50",
    }
    url = "https://www.alphavantage.co/query?" + urlencode(params)
    with urlopen(url, timeout=20) as resp:
        data = json.loads(resp.read().decode())

    feed = data.get("feed", [])
    if not feed:
        print(f"Aviso: la API no devolvió artículos. Respuesta cruda: {data}", file=sys.stderr)
    return feed


def pre_filter(articles: list[dict]) -> list[dict]:
    """Ordena por relevancia (ya calculada por la API) y se queda con el top N.
    Esto es lo que evita mandarle al LLM artículos irrelevantes."""

    def best_relevance(article: dict) -> float:
        scores = [
            float(t.get("relevance_score", 0))
            for t in article.get("ticker_sentiment", [])
        ]
        return max(scores, default=0.0)

    ranked = sorted(articles, key=best_relevance, reverse=True)
    top = ranked[:MAX_CANDIDATES]

    # Reducimos cada artículo a lo mínimo indispensable antes de mandarlo al LLM.
    compact = []
    for a in top:
        compact.append({
            "title": a.get("title"),
            "summary": (a.get("summary") or "")[:280],  # cortamos, no mandamos el cuerpo entero
            "tickers": [t.get("ticker") for t in a.get("ticker_sentiment", [])],
            "relevance_score": round(best_relevance(a), 3),
            "sentiment_score": a.get("overall_sentiment_score"),
            "url": a.get("url"),
        })
    return compact


def av_time_to_iso(raw: str | None) -> str | None:
    """Alpha Vantage manda 'time_published' como YYYYMMDDTHHMMSS en UTC."""
    if not raw:
        return None
    try:
        dt = datetime.strptime(raw, "%Y%m%dT%H%M%S").replace(tzinfo=timezone.utc)
        return dt.isoformat()
    except ValueError:
        return None


def attach_source_meta(items: list[dict], raw_articles: list[dict]) -> list[dict]:
    """Reasocia source/fecha por URL en vez de pedírselo al LLM (menos tokens de salida)."""
    lookup = {a.get("url"): a for a in raw_articles}
    for item in items:
        raw = lookup.get(item.get("source_url"))
        item["source"] = raw.get("source") if raw else None
        item["published_at"] = av_time_to_iso(raw.get("time_published")) if raw else None
    return items


# --- Precios (Finnhub) ------------------------------------------------------


def fetch_prices(tickers: list[str]) -> dict[str, dict]:
    if not FINNHUB_API_KEY:
        sys.exit("Falta FINNHUB_API_KEY en el entorno.")

    prices = {}
    for ticker in tickers:
        params = {"symbol": ticker, "token": FINNHUB_API_KEY}
        url = "https://finnhub.io/api/v1/quote?" + urlencode(params)
        try:
            with urlopen(url, timeout=10) as resp:
                quote = json.loads(resp.read().decode())
            prices[ticker] = {
                "price": quote.get("c"),
                "changePct": quote.get("dp"),
            }
        except Exception as exc:  # red intermitente, ticker inválido, etc.
            print(f"Aviso: no se pudo obtener precio de {ticker}: {exc}", file=sys.stderr)
            prices[ticker] = {"price": None, "changePct": None}
    return prices


def update_price_history(prices: dict[str, dict]) -> dict[str, list[float]]:
    """Mantiene una ventana local de precios por ticker para poder graficar un
    sparkline real sin pagar por un endpoint histórico."""
    history: dict[str, list[float]] = {}
    if HISTORY_PATH.exists():
        try:
            history = json.loads(HISTORY_PATH.read_text())
        except json.JSONDecodeError:
            history = {}

    for ticker, info in prices.items():
        if info.get("price") is None:
            continue
        series = history.get(ticker, [])
        series.append(info["price"])
        history[ticker] = series[-HISTORY_POINTS:]

    HISTORY_PATH.write_text(json.dumps(history), encoding="utf-8")
    return history


def build_stocks(prices: dict[str, dict], history: dict[str, list[float]]) -> list[dict]:
    stocks = []
    for ticker in AI_TICKERS:
        info = prices.get(ticker, {})
        price = info.get("price")
        series = history.get(ticker) or ([price, price] if price is not None else [0, 0])
        if len(series) < 2:
            series = series * 2
        stocks.append({
            "ticker": ticker,
            "name": TICKER_NAMES.get(ticker, ticker),
            "price": price,
            "changePct": info.get("changePct"),
            "spark": series,
        })
    return stocks


# --- LLM (curación + resumen del sector, una sola llamada) -----------------


def curate_with_claude(candidates: list[dict], stocks: list[dict]) -> dict:
    if not ANTHROPIC_API_KEY:
        sys.exit("Falta ANTHROPIC_API_KEY en el entorno.")

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    payload = {
        "articles": candidates,
        "stocks": [
            {"ticker": s["ticker"], "changePct": s["changePct"]}
            for s in stocks
            if s["changePct"] is not None
        ],
    }

    response = client.messages.create(
        model=MODEL,
        max_tokens=1500,
        system=[
            {
                "type": "text",
                "text": SYSTEM_PROMPT,
                "cache_control": {"type": "ephemeral"},  # clave para el ahorro de tokens
            }
        ],
        messages=[
            {
                "role": "user",
                "content": json.dumps(payload, ensure_ascii=False),
            }
        ],
    )

    raw_text = "".join(block.text for block in response.content if block.type == "text")

    try:
        return json.loads(raw_text)
    except json.JSONDecodeError:
        sys.exit(f"El modelo no devolvió JSON válido:\n{raw_text}")


# --- Orquestación ------------------------------------------------------------


def main():
    raw_articles = fetch_alphavantage_news()
    candidates = pre_filter(raw_articles)

    prices = fetch_prices(AI_TICKERS)
    history = update_price_history(prices)
    stocks = build_stocks(prices, history)

    valid_changes = [s["changePct"] for s in stocks if s["changePct"] is not None]
    up_count = sum(1 for c in valid_changes if c > 0)
    avg_change = round(sum(valid_changes) / len(valid_changes), 2) if valid_changes else 0.0

    if not candidates:
        print("No hay candidatos de noticias para curar. Se escribe igual con solo precios.", file=sys.stderr)
        curated = {"sector_summary": {"sentiment": "mixed", "text": ""}, "items": []}
    else:
        curated = curate_with_claude(candidates, stocks)

    items = attach_source_meta(curated.get("items", []), raw_articles)
    sector_summary = curated.get("sector_summary", {"sentiment": "mixed", "text": ""})

    data = {
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "sector": {
            "sentiment": sector_summary.get("sentiment", "mixed"),
            "text": sector_summary.get("text", ""),
            "stats": {
                "upCount": up_count,
                "totalCount": len(valid_changes),
                "avgChangePct": avg_change,
                "newsCount": len(items),
            },
        },
        "stocks": stocks,
        "news": items,
    }

    DATA_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"OK — {len(stocks)} precios y {len(items)} noticias escritas en {DATA_PATH}")


if __name__ == "__main__":
    main()
