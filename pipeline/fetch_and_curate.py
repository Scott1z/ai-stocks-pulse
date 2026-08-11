#!/usr/bin/env python3
"""
fetch_and_curate.py

Corre en background (cron), NO en cada visita a la landing page.

Flujo:
  1. Trae noticias generales de mercado de Finnhub (/news?category=general) y se queda
     localmente con las que mencionan alguna de nuestras empresas de IA (por nombre o
     ticker) — Finnhub no tiene una categoría "technology", así que filtramos igual que
     antes, un paso más temprano en la cadena.
  2. Trae precios actuales de Finnhub para los 50 tickers de AI_TICKERS (con pausa entre
     requests — ver FINNHUB_PACING_SECONDS — para no pasarse del límite de 60 calls/min).
  3. Actualiza price_history.json (ventana local de los últimos puntos) para poder dibujar
     sparklines reales en el frontend sin depender de un endpoint histórico de pago.
  3b. Trae fundamentales básicos (P/E, EPS, cap. de mercado, rango 52 semanas, ROE, margen
      neto) de Finnhub /stock/metric, mismo API key que las cotizaciones.
  3c. Trae precios diarios reales (OHLC) de Alpha Vantage TIME_SERIES_DAILY, UNA vez por día
      (no en cada corrida horaria), y SOLO para OHLC_TICKERS (los 23 tickers originales, no
      los 50) — Alpha Vantage free da 25 req/día en total y ya usa 24 de esos (23 velas + 1
      calendario), así que no hay margen para más sin plan pago. Los 27 tickers agregados
      después usan el sparkline de respaldo en vez de velas reales.
  3d. Trae el calendario de resultados de Alpha Vantage EARNINGS_CALENDAR (1 request más,
      misma corrida diaria que el OHLC, pero filtrado contra los 50 tickers — es 1 solo
      request sin importar cuántos tickers se filtren después) — antes usaba Finnhub
      /calendar/earnings, pero ese endpoint tiene un bug conocido de fechas de balance
      faltantes/incorrectas.
  3e. Trae el último resultado YA reportado (EPS real vs. estimado, "beat/miss") de Finnhub
      /stock/earnings, un request por ticker de los 50 — a diferencia del calendario (que
      mira para adelante), esto mira para atrás, al trimestre que la empresa ya presentó.
  4. Ordena los candidatos de noticias por cuántas empresas nuestras mencionan (gratis, sin
     gastar tokens de LLM) y recorta al top N.
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

from __future__ import annotations

import json
import os
import re
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.request import urlopen
from urllib.parse import urlencode

import anthropic  # pip install anthropic

# --- Config ---------------------------------------------------------------

AV_API_KEY = os.environ.get("ALPHAVANTAGE_API_KEY")
FINNHUB_API_KEY = os.environ.get("FINNHUB_API_KEY")
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")

# Tickers de referencia del sector IA — ajustá esta lista a lo que te interese.
# Los primeros 23 son el catálogo original: son los únicos que tienen velas
# OHLC reales (ver OHLC_TICKERS más abajo) — Alpha Vantage free da 25
# requests/día en total y ya usamos 24 de esos (23 velas + 1 calendario),
# así que no hay margen para sumar más tickers a las velas reales sin pasar
# a un plan pago. Los 27 agregados después (2026-08-11) solo tienen
# precio/fundamentales/noticias vía Finnhub (sin ese límite) y usan el
# gráfico de línea de respaldo en vez de candlestick.
AI_TICKERS = [
    "NVDA", "MSFT", "GOOGL", "META", "AMZN", "AVGO", "ORCL", "PLTR", "AMD",
    # Semis / infraestructura IA
    "TSM", "ARM", "SMCI", "MRVL", "QCOM", "MU", "SNDK",
    # Software / nube IA
    "CRM", "NOW", "ADBE", "SNOW", "IBM",
    # Otros mega-cap con exposición a IA
    "AAPL", "TSLA",
    # --- Ampliación 2026-08-11 (sin velas OHLC, ver comentario arriba) ---
    # Semis / hardware
    "INTC", "TXN", "ASML", "LRCX", "AMAT", "KLAC", "ANET", "DELL", "HPE", "CDNS", "SNPS",
    # Software / nube / datos IA
    "DDOG", "PANW", "CRWD", "MDB", "WDAY", "INTU", "SAP", "TEAM",
    # Storage
    "STX", "WDC",
    # Puras de IA / temáticas
    "AI", "SOUN", "IONQ", "CSCO",
    # Otros mega-cap con exposición a IA
    "NFLX", "UBER",
]
OHLC_TICKERS = AI_TICKERS[:23]

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
    "TSM": "Taiwan Semiconductor",
    "ARM": "Arm Holdings",
    "SMCI": "Super Micro Computer",
    "MRVL": "Marvell Technology",
    "QCOM": "Qualcomm",
    "MU": "Micron Technology",
    "SNDK": "SanDisk",
    "CRM": "Salesforce",
    "NOW": "ServiceNow",
    "ADBE": "Adobe",
    "SNOW": "Snowflake",
    "IBM": "IBM",
    "AAPL": "Apple",
    "TSLA": "Tesla",
    "INTC": "Intel",
    "TXN": "Texas Instruments",
    "ASML": "ASML Holding",
    "LRCX": "Lam Research",
    "AMAT": "Applied Materials",
    "KLAC": "KLA Corporation",
    "ANET": "Arista Networks",
    "DELL": "Dell Technologies",
    "HPE": "Hewlett Packard Enterprise",
    "CDNS": "Cadence Design Systems",
    "SNPS": "Synopsys",
    "DDOG": "Datadog",
    "PANW": "Palo Alto Networks",
    "CRWD": "CrowdStrike",
    "MDB": "MongoDB",
    "WDAY": "Workday",
    "INTU": "Intuit",
    "SAP": "SAP",
    "TEAM": "Atlassian",
    "STX": "Seagate Technology",
    "WDC": "Western Digital",
    "AI": "C3.ai",
    "SOUN": "SoundHound AI",
    "IONQ": "IonQ",
    "CSCO": "Cisco Systems",
    "NFLX": "Netflix",
    "UBER": "Uber Technologies",
}

MAX_CANDIDATES = 15  # cuántos artículos pre-filtrados se mandan al LLM
HISTORY_POINTS = 12  # puntos que se guardan por ticker para el sparkline
MODEL = "claude-sonnet-5"

PROJECT_ROOT = Path(__file__).resolve().parent.parent
HISTORY_PATH = Path(__file__).parent / "price_history.json"
OHLC_PATH = Path(__file__).parent / "daily_ohlc.json"
ARCHIVE_PATH = Path(__file__).parent / "summary_archive.json"
DATA_PATH = PROJECT_ROOT / "data.json"
OHLC_DAYS_KEPT = 60  # ~3 meses hábiles, suficiente para un candlestick legible
ARCHIVE_DAYS_KEPT = 30  # historial de resúmenes del sector que se muestra en el frontend

SYSTEM_PROMPT = """Sos un editor financiero especializado en inteligencia artificial y mercados bursátiles.

Recibís un JSON con dos listas:
- "articles": candidatos de noticias, cada uno con title, summary, tickers, match_count.
  match_count es cuántas de nuestras empresas de IA se mencionan en el artículo (más alto,
  más relevante). Estos artículos están en inglés (fuente: Finnhub).
- "stocks": precios del día por ticker, cada uno con ticker y changePct.

IMPORTANTE: todo el texto que escribas (headline, summary, sector_summary.text) va en ESPAÑOL,
sin importar el idioma original de los artículos. Traducí y reescribí, no copies frases en inglés.

Tareas (una sola respuesta, sin explicar tu razonamiento):
1. De "articles", elegí los 8 más relevantes para un inversor que quiere entender cómo el sector de IA
   está moviendo la bolsa hoy. Priorizá match_count alto y contenido sobre precio, earnings, guidance,
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


# --- Noticias (Finnhub) -----------------------------------------------------

# Tickers cuyo símbolo colisiona con palabras comunes del inglés (ARM, NOW,
# SNOW, META como adjetivo, AI el término genérico, TEAM) — para esos,
# matcheamos solo por nombre de empresa. Para el resto, el símbolo en
# mayúsculas como palabra completa es una señal confiable (así es como la
# prensa financiera lo escribe).
AMBIGUOUS_TICKERS = {"ARM", "NOW", "SNOW", "META", "AI", "TEAM"}


def _mentions(text: str, ticker: str, name: str) -> bool:
    if name.lower() in text.lower():
        return True
    if ticker not in AMBIGUOUS_TICKERS and re.search(rf"\b{re.escape(ticker)}\b", text):
        return True
    return False


def fetch_finnhub_news() -> list[dict]:
    if not FINNHUB_API_KEY:
        sys.exit("Falta FINNHUB_API_KEY en el entorno.")

    params = {"category": "general", "token": FINNHUB_API_KEY}
    url = "https://finnhub.io/api/v1/news?" + urlencode(params)
    with urlopen(url, timeout=20) as resp:
        feed = json.loads(resp.read().decode())

    if not isinstance(feed, list) or not feed:
        print(f"Aviso: Finnhub no devolvió artículos. Respuesta cruda: {feed}", file=sys.stderr)
        return []
    return feed


def pre_filter(articles: list[dict]) -> list[dict]:
    """Se queda solo con artículos que mencionan alguna de nuestras empresas
    de IA (por nombre o ticker), ordenados por cuántas mencionan (match_count),
    y recorta al top N. Esto es lo que evita mandarle al LLM artículos
    irrelevantes — Finnhub no manda un relevance_score como Alpha Vantage,
    así que lo calculamos nosotros."""

    def matched_tickers(article: dict) -> list[str]:
        text = f"{article.get('headline') or ''} {article.get('summary') or ''}"
        return [t for t in AI_TICKERS if _mentions(text, t, TICKER_NAMES[t])]

    scored = []
    for a in articles:
        matches = matched_tickers(a)
        if matches:
            scored.append((a, matches))

    ranked = sorted(scored, key=lambda pair: len(pair[1]), reverse=True)
    top = ranked[:MAX_CANDIDATES]

    # Reducimos cada artículo a lo mínimo indispensable antes de mandarlo al LLM.
    compact = []
    for a, matches in top:
        compact.append({
            "title": a.get("headline"),
            "summary": (a.get("summary") or "")[:280],  # cortamos, no mandamos el cuerpo entero
            "tickers": matches,
            "match_count": len(matches),
            "url": a.get("url"),
        })
    return compact


def finnhub_time_to_iso(raw) -> str | None:
    """Finnhub manda 'datetime' como epoch Unix en segundos (UTC)."""
    if not raw:
        return None
    try:
        return datetime.fromtimestamp(int(raw), tz=timezone.utc).isoformat()
    except (ValueError, OSError, OverflowError):
        return None


def attach_source_meta(items: list[dict], raw_articles: list[dict]) -> list[dict]:
    """Reasocia source/fecha por URL en vez de pedírselo al LLM (menos tokens de salida)."""
    lookup = {a.get("url"): a for a in raw_articles}
    for item in items:
        raw = lookup.get(item.get("source_url"))
        item["source"] = raw.get("source") if raw else None
        item["published_at"] = finnhub_time_to_iso(raw.get("datetime")) if raw else None
    return items


# --- Precios (Finnhub) ------------------------------------------------------


# Finnhub free tier: 60 calls/min. Con 50 tickers, precios + fundamentales +
# últimos resultados suman 150 requests por corrida — sin pausar, esos tres
# loops corriendo uno atrás del otro pueden pegarle fácil al límite por
# minuto. 1.1s entre requests mantiene el total en ~55/min con margen.
FINNHUB_PACING_SECONDS = 1.1


def fetch_prices(tickers: list[str]) -> dict[str, dict]:
    if not FINNHUB_API_KEY:
        sys.exit("Falta FINNHUB_API_KEY en el entorno.")

    prices = {}
    for i, ticker in enumerate(tickers):
        if i > 0:
            time.sleep(FINNHUB_PACING_SECONDS)
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


def _first_number(metric: dict, *keys: str) -> float | None:
    """Finnhub no documenta un único nombre estable por métrica entre planes/
    versiones (p.ej. peBasicExclExtraTTM vs peExclExtraTTM); probamos una
    cadena de alias y nos quedamos con el primer valor numérico presente."""
    for key in keys:
        value = metric.get(key)
        if isinstance(value, (int, float)):
            return value
    return None


def fetch_fundamentals(tickers: list[str]) -> dict[str, dict]:
    """Fundamentales básicos vía Finnhub /stock/metric (incluido en el plan
    free, mismo API key que las cotizaciones — no consume el cupo de Alpha
    Vantage)."""
    if not FINNHUB_API_KEY:
        sys.exit("Falta FINNHUB_API_KEY en el entorno.")

    fundamentals = {}
    for i, ticker in enumerate(tickers):
        if i > 0:
            time.sleep(FINNHUB_PACING_SECONDS)
        params = {"symbol": ticker, "metric": "all", "token": FINNHUB_API_KEY}
        url = "https://finnhub.io/api/v1/stock/metric?" + urlencode(params)
        try:
            with urlopen(url, timeout=10) as resp:
                metric = json.loads(resp.read().decode()).get("metric", {}) or {}
            fundamentals[ticker] = {
                "peTTM": _first_number(metric, "peBasicExclExtraTTM", "peExclExtraTTM", "peNormalizedAnnual", "peTTM"),
                "epsTTM": _first_number(metric, "epsBasicExclExtraItemsTTM", "epsInclExtraItemsTTM", "epsTTM"),
                "marketCapM": _first_number(metric, "marketCapitalization"),
                "week52High": _first_number(metric, "52WeekHigh"),
                "week52Low": _first_number(metric, "52WeekLow"),
                "roeTTM": _first_number(metric, "roeTTM", "roeRfy"),
                "netMarginTTM": _first_number(metric, "netProfitMarginTTM", "netProfitMarginAnnual"),
            }
        except Exception as exc:  # red intermitente, ticker sin cobertura, etc.
            print(f"Aviso: no se pudieron obtener fundamentales de {ticker}: {exc}", file=sys.stderr)
            fundamentals[ticker] = {}
    return fundamentals


def fetch_earnings_actuals(tickers: list[str]) -> dict[str, dict | None]:
    """Último resultado YA reportado (EPS real vs. estimado de consenso) por
    ticker, vía Finnhub /stock/earnings — mismo patrón que /stock/metric,
    un request por ticker. Se usa para el badge de "superó/no superó
    estimación" en el modal de cada acción; a diferencia del calendario de
    resultados (que mira para adelante), esto mira para atrás."""
    if not FINNHUB_API_KEY:
        sys.exit("Falta FINNHUB_API_KEY en el entorno.")

    actuals: dict[str, dict | None] = {}
    for i, ticker in enumerate(tickers):
        if i > 0:
            time.sleep(FINNHUB_PACING_SECONDS)
        params = {"symbol": ticker, "token": FINNHUB_API_KEY}
        url = "https://finnhub.io/api/v1/stock/earnings?" + urlencode(params)
        try:
            with urlopen(url, timeout=10) as resp:
                entries = json.loads(resp.read().decode())
            # Finnhub ordena del más reciente al más viejo; el primer
            # elemento a veces es el próximo trimestre todavía sin reportar
            # (actual=null), así que nos quedamos con el primero que sí
            # tiene un valor real.
            reported = next(
                (e for e in entries if isinstance(entries, list) and e.get("actual") is not None),
                None,
            )
            actuals[ticker] = (
                {
                    "period": reported.get("period"),
                    "actual": reported.get("actual"),
                    "estimate": reported.get("estimate"),
                    "surprisePercent": reported.get("surprisePercent"),
                }
                if reported
                else None
            )
        except Exception as exc:  # red intermitente, ticker sin cobertura, etc.
            print(f"Aviso: no se pudo obtener el último resultado de {ticker}: {exc}", file=sys.stderr)
            actuals[ticker] = None
    return actuals


# --- Calendario de resultados (Alpha Vantage) --------------------------------

# Antes usaba Finnhub /calendar/earnings. Se cambió porque ese endpoint tiene
# un bug conocido y no corregido de fechas de balance faltantes/incorrectas
# (finnhubio/Finnhub-API#528 en GitHub) — en producción esto se notó como un
# balance real e inminente (NVDA, ~fin de agosto) que directamente no
# aparecía, mientras solo se mostraba una fecha muy posterior. Alpha Vantage
# EARNINGS_CALENDAR es CSV, 1 solo request para TODAS las empresas que
# reportan en el horizonte pedido, así que se suma al mismo cupo diario que
# ya usa el fetch de velas OHLC (ver fetch_daily_batch) en vez de gastar
# cuota de Finnhub. Como contrapartida no trae si el reporte es antes de
# apertura o después del cierre (Finnhub sí lo tenía) — se prioriza que la
# fecha sea correcta por sobre ese dato adicional.


def fetch_earnings_calendar(tickers: list[str]) -> list[dict]:
    """1 solo request cubre TODAS las empresas que reportan en los próximos
    ~3 meses; filtramos localmente a nuestros tickers (mismo patrón que las
    noticias: un endpoint genérico, filtro propio después)."""
    import csv
    import io

    if not AV_API_KEY:
        sys.exit("Falta ALPHAVANTAGE_API_KEY en el entorno.")

    params = {"function": "EARNINGS_CALENDAR", "horizon": "3month", "apikey": AV_API_KEY}
    url = "https://www.alphavantage.co/query?" + urlencode(params)
    try:
        with urlopen(url, timeout=20) as resp:
            raw = resp.read().decode()
    except Exception as exc:  # red intermitente, etc. — no es crítico, seguimos sin calendario
        print(f"Aviso: no se pudo obtener el calendario de resultados: {exc}", file=sys.stderr)
        return []

    tickers_set = set(tickers)
    entries = []
    try:
        for row in csv.DictReader(io.StringIO(raw)):
            symbol = (row.get("symbol") or "").strip()
            if symbol not in tickers_set:
                continue
            estimate = (row.get("estimate") or "").strip()
            try:
                eps_estimate = float(estimate) if estimate else None
            except ValueError:
                eps_estimate = None
            entries.append({
                "ticker": symbol,
                "name": TICKER_NAMES.get(symbol, symbol),
                "date": (row.get("reportDate") or "").strip() or None,
                "epsEstimate": eps_estimate,
            })
    except Exception as exc:  # CSV inesperado (p.ej. AV devuelve un error de
        # rate limit en vez de CSV real cuando se pega justo con otra corrida)
        # — nunca debe tirar abajo toda la corrida por esto.
        print(f"Aviso: no se pudo parsear el calendario de resultados: {exc}", file=sys.stderr)
        return entries  # lo que se haya podido parsear hasta el error, aunque sea vacío

    entries.sort(key=lambda e: (e["date"] or "", e["ticker"]))
    return entries


# --- Precios diarios / OHLC + calendario de resultados (Alpha Vantage, una vez por día) ---


def fetch_daily_batch(
    ohlc_tickers: list[str], calendar_tickers: list[str]
) -> tuple[dict[str, list[dict]], list[dict]]:
    """Trae velas diarias reales (open/high/low/close) de Alpha Vantage
    TIME_SERIES_DAILY, más el calendario de resultados (EARNINGS_CALENDAR,
    1 solo request). Sacar las noticias de Alpha Vantage (ver
    fetch_finnhub_news) deja libre todo el cupo free de 25 req/día para esto,
    pero solo alcanza para UNA corrida diaria (23 tickers + 1 calendario =
    24 requests), no una por hora.

    `ohlc_tickers` (23, el catálogo original) y `calendar_tickers` (los 50)
    son distintos a propósito: el calendario es 1 solo request sin importar
    cuántos tickers se filtren después, así que no hay motivo para no
    ofrecérselo a todo el catálogo — pero las velas sí cuestan 1 request por
    ticker, y ahí el límite diario de Alpha Vantage no da para más de 23-24.

    Por eso esta función es un caché con fecha: si ya se corrió hoy, devuelve
    lo que ya está guardado en disco sin gastar requests. El pipeline sigue
    corriendo cada hora igual (precios/noticias/fundamentales), esto solo se
    salta 23 de cada 24 corridas.

    Alpha Vantage free también limita a 5 requests/minuto, así que cuando SÍ
    corre, hace una pausa entre requests — la corrida diaria tarda unos
    4-5 minutos en vez de segundos. Solo pasa una vez al día."""

    today = datetime.now(timezone.utc).date().isoformat()

    if OHLC_PATH.exists():
        try:
            cached = json.loads(OHLC_PATH.read_text())
        except json.JSONDecodeError:
            cached = {}
        if cached.get("_fetchedDate") == today:
            earnings_cached = cached.pop("_earningsCalendar", [])
            cached.pop("_fetchedDate", None)
            return cached, earnings_cached

    if not AV_API_KEY:
        sys.exit("Falta ALPHAVANTAGE_API_KEY en el entorno.")

    ohlc: dict[str, list[dict]] = {}
    for i, ticker in enumerate(ohlc_tickers):
        if i > 0:
            time.sleep(13)  # AV free: 5 req/min máx
        params = {
            "function": "TIME_SERIES_DAILY",
            "symbol": ticker,
            "outputsize": "compact",  # últimos ~100 días hábiles
            "apikey": AV_API_KEY,
        }
        url = "https://www.alphavantage.co/query?" + urlencode(params)
        try:
            with urlopen(url, timeout=20) as resp:
                payload = json.loads(resp.read().decode())
            series = payload.get("Time Series (Daily)", {})
            if not series:
                print(f"Aviso: sin velas diarias para {ticker}. Respuesta: {payload}", file=sys.stderr)
                ohlc[ticker] = []
                continue
            rows = sorted(series.items())[-OHLC_DAYS_KEPT:]
            ohlc[ticker] = [
                {
                    "date": date,
                    "open": float(day["1. open"]),
                    "high": float(day["2. high"]),
                    "low": float(day["3. low"]),
                    "close": float(day["4. close"]),
                }
                for date, day in rows
            ]
        except Exception as exc:  # red intermitente, símbolo inválido, etc.
            print(f"Aviso: no se pudieron obtener velas diarias de {ticker}: {exc}", file=sys.stderr)
            ohlc[ticker] = []

    time.sleep(13)  # AV free: 5 req/min máx — sigue pausando antes del último request
    try:
        earnings_calendar = fetch_earnings_calendar(calendar_tickers)
    except Exception as exc:  # nunca perder los ~5 minutos de velas ya
        # obtenidas por un fallo en el calendario — se guardan igual, con
        # el calendario vacío por esta corrida.
        print(f"Aviso: calendario de resultados falló, se guardan igual las velas: {exc}", file=sys.stderr)
        earnings_calendar = []

    to_save = dict(ohlc)
    to_save["_fetchedDate"] = today
    to_save["_earningsCalendar"] = earnings_calendar
    OHLC_PATH.write_text(json.dumps(to_save, ensure_ascii=False), encoding="utf-8")
    return ohlc, earnings_calendar


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


def update_summary_archive(sector_summary: dict, stats: dict, stocks: list[dict]) -> list[dict]:
    """Guarda un snapshot del resumen del día para poder navegar el historial
    en el frontend. El pipeline corre cada hora, así que un mismo día
    produce varias corridas: en vez de acumular hasta 24 entradas por día,
    cada corrida pisa la entrada de HOY (fecha UTC) con el snapshot más
    reciente, y se recorta a los últimos ARCHIVE_DAYS_KEPT días — mismo
    patrón de archivo-caché-en-disco que price_history.json."""
    archive: list[dict] = []
    if ARCHIVE_PATH.exists():
        try:
            archive = json.loads(ARCHIVE_PATH.read_text())
        except json.JSONDecodeError:
            archive = []

    today = datetime.now(timezone.utc).date().isoformat()
    archive = [entry for entry in archive if entry.get("date") != today]

    valid = [s for s in stocks if s.get("changePct") is not None]
    top_mover = max(valid, key=lambda s: s["changePct"], default=None)
    top_loser = min(valid, key=lambda s: s["changePct"], default=None)

    archive.append({
        "date": today,
        "sentiment": sector_summary.get("sentiment", "mixed"),
        "text": sector_summary.get("text", ""),
        "stats": stats,
        "topMover": {"ticker": top_mover["ticker"], "changePct": top_mover["changePct"]} if top_mover else None,
        "topLoser": {"ticker": top_loser["ticker"], "changePct": top_loser["changePct"]} if top_loser else None,
    })

    archive.sort(key=lambda entry: entry["date"])
    archive = archive[-ARCHIVE_DAYS_KEPT:]

    ARCHIVE_PATH.write_text(json.dumps(archive, ensure_ascii=False), encoding="utf-8")
    return archive


def build_stocks(
    prices: dict[str, dict],
    history: dict[str, list[float]],
    fundamentals: dict[str, dict],
    ohlc: dict[str, list[dict]],
    earnings_actuals: dict[str, dict | None],
) -> list[dict]:
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
            "fundamentals": fundamentals.get(ticker, {}),
            "ohlc": ohlc.get(ticker, []),
            "lastEarnings": earnings_actuals.get(ticker),
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
        # 8 items with full headline+summary+source_url (some URLs are long)
        # plus the sector summary reliably runs past 1500 tokens and gets
        # truncated mid-JSON. This is just a ceiling — we're billed for
        # tokens actually generated, not this cap — so it's generous on
        # purpose.
        max_tokens=4000,
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
        return json.loads(_strip_markdown_fence(raw_text))
    except json.JSONDecodeError:
        raise ValueError(f"El modelo no devolvió JSON válido:\n{raw_text}")


def _strip_markdown_fence(text: str) -> str:
    """A pesar de que el system prompt pide 'SOLO JSON, sin markdown', el
    modelo a veces igual envuelve la respuesta en un bloque ```json ... ```
    — pasó en producción y tiró abajo toda la corrida. Se lo sacamos antes
    de parsear en vez de confiar en que nunca vuelva a pasar."""
    text = text.strip()
    if not text.startswith("```"):
        return text
    first_newline = text.find("\n")
    if first_newline != -1:
        text = text[first_newline + 1 :]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()


# --- Orquestación ------------------------------------------------------------


def main():
    raw_articles = fetch_finnhub_news()
    candidates = pre_filter(raw_articles)

    prices = fetch_prices(AI_TICKERS)
    history = update_price_history(prices)
    fundamentals = fetch_fundamentals(AI_TICKERS)

    # Estas dos son las más nuevas y las que más dependen de APIs externas
    # con formatos menos predecibles (CSV de Alpha Vantage, historial de
    # Finnhub) — un fallo inesperado acá no debe impedir que se escriba
    # data.json con precios/noticias/fundamentales, que ya están listos.
    try:
        earnings_actuals = fetch_earnings_actuals(AI_TICKERS)
    except Exception as exc:
        print(f"Aviso: últimos resultados reportados falló, sigo sin eso: {exc}", file=sys.stderr)
        earnings_actuals = {}
    try:
        ohlc, earnings_calendar = fetch_daily_batch(OHLC_TICKERS, AI_TICKERS)
    except Exception as exc:
        print(f"Aviso: velas OHLC / calendario falló, sigo sin eso: {exc}", file=sys.stderr)
        ohlc, earnings_calendar = {}, []

    stocks = build_stocks(prices, history, fundamentals, ohlc, earnings_actuals)

    valid_changes = [s["changePct"] for s in stocks if s["changePct"] is not None]
    up_count = sum(1 for c in valid_changes if c > 0)
    avg_change = round(sum(valid_changes) / len(valid_changes), 2) if valid_changes else 0.0

    if not candidates:
        print("No hay candidatos de noticias para curar. Se escribe igual con solo precios.", file=sys.stderr)
        curated = {"sector_summary": {"sentiment": "mixed", "text": ""}, "items": []}
    else:
        try:
            curated = curate_with_claude(candidates, stocks)
        except Exception as exc:  # el modelo devolvió algo no parseable, etc. — no
            # perder precios/fundamentales/OHLC (que ya costaron requests reales)
            # por un fallo en la curación de noticias. Pasó en producción.
            print(f"Aviso: curación con Claude falló, se escribe igual sin noticias curadas: {exc}", file=sys.stderr)
            curated = {"sector_summary": {"sentiment": "mixed", "text": ""}, "items": []}

    items = attach_source_meta(curated.get("items", []), raw_articles)
    sector_summary = curated.get("sector_summary", {"sentiment": "mixed", "text": ""})
    sector_stats = {
        "upCount": up_count,
        "totalCount": len(valid_changes),
        "avgChangePct": avg_change,
        "newsCount": len(items),
    }

    try:
        archive = update_summary_archive(sector_summary, sector_stats, stocks)
    except Exception as exc:  # el historial es un extra — nunca debe impedir
        # que se escriba data.json con todo lo demás ya obtenido.
        print(f"Aviso: no se pudo actualizar el historial de resúmenes: {exc}", file=sys.stderr)
        archive = []

    data = {
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "sector": {
            "sentiment": sector_summary.get("sentiment", "mixed"),
            "text": sector_summary.get("text", ""),
            "stats": sector_stats,
        },
        "stocks": stocks,
        "news": items,
        "earningsCalendar": earnings_calendar,
        "archive": archive,
    }

    DATA_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    reported_count = sum(1 for s in stocks if s["lastEarnings"] is not None)
    print(
        f"OK — {len(stocks)} precios, {len(items)} noticias, "
        f"{len(earnings_calendar)} resultados próximos, {reported_count} últimos "
        f"resultados reportados y {len(archive)} días de historial escritos en {DATA_PATH}"
    )


if __name__ == "__main__":
    main()
