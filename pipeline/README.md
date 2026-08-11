# Pipeline de datos — AI Stocks Pulse

Este script corre por **cron**, nunca en cada visita a la landing. Escribe
`../data.json`, que es el único archivo que lee el frontend (`app.js`). Si
`data.json` no existe o falla al leerse, la página cae automáticamente a
datos de demostración — así que es seguro probar esto sin romper nada.

## Qué hace cada corrida

1. Trae noticias generales de mercado de **Finnhub** (`/news?category=general`) — 1 request.
   Finnhub no tiene una categoría "technology" (solo general/forex/crypto/merger), así que se
   filtra localmente igual que antes: se queda con los artículos que mencionan a alguna de
   nuestras 23 empresas (por nombre o ticker) y descarta el resto antes de gastar tokens de LLM.
2. Trae precios actuales de **Finnhub** (`/quote`) para 23 tickers — 23 requests.
3. Guarda cada precio en `price_history.json` (ventana local de 12 puntos) para poder dibujar
   un sparkline de respaldo si todavía no hay velas diarias reales para un ticker.
4. Trae fundamentales básicos de **Finnhub** (`/stock/metric`, mismo API key) para los mismos
   23 tickers — 23 requests más: P/E (TTM), EPS (TTM), capitalización de mercado, rango de
   52 semanas, ROE (TTM) y margen neto (TTM). Todo dentro del plan free (60 calls/min).
5. Trae velas diarias reales (open/high/low/close) de **Alpha Vantage** `TIME_SERIES_DAILY`,
   pero **solo una vez por día**, no en cada corrida horaria — ver la sección de abajo, es la
   parte más particular de este pipeline. El resultado vive en `daily_ohlc.json`.
6. Trae el calendario de resultados de **Finnhub** (`/calendar/earnings`, ~100 días hacia
   adelante) — 1 request. Trae TODAS las empresas que reportan en la ventana, no solo las
   nuestras, así que se filtra localmente a nuestros 23 tickers (mismo patrón que las
   noticias). Son fechas reales de balance trimestral, no "eventos importantes" del sector —
   eso no tiene una fuente confiable, así que no se inventa.
7. Ordena los artículos filtrados por cuántas de nuestras empresas mencionan (`match_count`,
   calculado localmente — Finnhub no manda un puntaje de relevancia como Alpha Vantage lo
   hacía), quedándose con los 15 mejores.
8. Una sola llamada a Claude (con **prompt caching** en el system prompt) que devuelve:
   - las 8 noticias curadas, y
   - un resumen narrativo del sector + su sentimiento general,
   en la misma respuesta. Nunca se llama al LLM por artículo ni dos veces por corrida.
9. Reasocia localmente la fuente y fecha de cada noticia (por URL) en vez de pedírselo al modelo,
   así el JSON de salida del LLM se mantiene chico.
10. Escribe `data.json` en la raíz del proyecto.

## Por qué las velas diarias corren aparte, una vez por día

Alpha Vantage free tier da **25 requests/día en total**, compartidos entre TODO lo que le
pidas. `TIME_SERIES_DAILY` trae el historial completo de un ticker en un solo request, así que
23 tickers = 23 requests — pero eso ya casi agota el cupo diario. Pedirlo en cada corrida
horaria (24 veces/día) sería imposible.

La solución: `fetch_daily_ohlc()` guarda la fecha de la última corrida exitosa adentro de
`daily_ohlc.json` (`_fetchedDate`). Si ya corrió hoy, devuelve el archivo tal cual sin gastar
ningún request — así 23 de las 24 corridas horarias no tocan Alpha Vantage para nada. Cuando sí
corre (una vez por día), respeta el límite de **5 requests/minuto** de Alpha Vantage con una
pausa de 13 segundos entre tickers, así que esa corrida puntual tarda unos 4-5 minutos en vez
de segundos — completamente normal, no es que el pipeline esté colgado.

Esto es lo que permite mostrar un gráfico de velas real en el detalle de cada acción en vez de
una línea armada con snapshots de precio: los datos vienen de un histórico diario de verdad,
no de lo que el pipeline fue viendo hora a hora.

## Setup (una sola vez)

### 1. Conseguí las 3 API keys (todas gratis)

- **Alpha Vantage**: https://www.alphavantage.co/support/#api-key — formulario simple, la key llega en pantalla.
- **Finnhub**: https://finnhub.io/register — te registrás y la key está en tu dashboard.
- **Anthropic**: https://console.anthropic.com/settings/keys — necesitás una cuenta con créditos cargados (aunque sea el mínimo) para que la API funcione.

### 2. Instalá dependencias

```bash
cd "pipeline"
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 3. Configurá las variables de entorno

```bash
cp .env.example .env
```

Editá `.env` y pegá tus 3 keys. Después, antes de correr el script a mano, cargalas en la shell:

```bash
export $(grep -v '^#' .env | xargs)
```

### 4. Probalo a mano

```bash
python3 fetch_and_curate.py
```

Si todo sale bien vas a ver algo como `OK — 23 precios, 8 noticias y 6 resultados próximos escritos en .../data.json`.
Abrí `../data.json` para revisar el resultado, y recargá la landing page — el indicador de
arriba debería cambiar de "DATOS DE DEMOSTRACIÓN" a "DATOS EN VIVO".

## Programarlo para que corra solo (macOS, cron)

1. Abrí el crontab: `crontab -e`
2. Agregá una línea que corra el script cada hora, cargando las variables de entorno desde `.env`:

```cron
0 * * * * cd "/ruta/completa/a/ai-stocks-pulse/pipeline" && export $(grep -v '^#' .env | xargs) && .venv/bin/python3 fetch_and_curate.py >> pipeline.log 2>&1
```

3. Guardá y cerrá. Revisá `pipeline.log` para confirmar que corre.

Si el cron no dispara en macOS reciente, es casi siempre un tema de permisos: en
**System Settings → Privacy & Security → Full Disk Access**, agregá `/usr/sbin/cron`
(o la Terminal/iTerm que uses).

### Por qué cada hora

Las noticias, precios y fundamentales van todos por Finnhub (60 calls/min, sin límite diario
publicado), así que refrescarlos cada hora no es un problema: 48 requests por corrida (23
quotes + 23 metrics + 1 de noticias + 1 de calendario de resultados), lejos del límite por
minuto. Alpha Vantage solo entra en
juego una vez por día para las velas — ver la sección de arriba. Correr más seguido que cada
hora no rompería el presupuesto de Finnhub, pero tampoco aportaría mucho: los precios de
Finnhub no cambian tan rápido como para justificarlo, y la corrida diaria de velas de todos
modos solo se dispara una vez.

## Ajustar qué empresas sigue

Editá la lista `AI_TICKERS` (y el diccionario `TICKER_NAMES`) al principio de
`fetch_and_curate.py`. Si agregás muchos tickers más (decenas), revisá dos cosas: que
3 requests/ticker (quote + metric + la porción de velas diarias) siga entrando cómodo en el
límite de 60 calls/min de Finnhub, y que el total de tickers no supere ~25 para que la corrida
diaria de velas (1 request/ticker en Alpha Vantage, con pausa de 13s entre cada uno) siga
entrando en el cupo de 25 requests/día.
