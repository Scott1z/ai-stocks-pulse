# Pipeline de datos — AI Stocks Pulse

Este script corre por **cron**, nunca en cada visita a la landing. Escribe
`../data.json`, que es el único archivo que lee el frontend (`app.js`). Si
`data.json` no existe o falla al leerse, la página cae automáticamente a
datos de demostración — así que es seguro probar esto sin romper nada.

## Qué hace cada corrida

1. Trae noticias generales de mercado de **Finnhub** (`/news?category=general`) — 1 request.
   Finnhub no tiene una categoría "technology" (solo general/forex/crypto/merger), así que se
   filtra localmente igual que antes: se queda con los artículos que mencionan a alguna de
   nuestras 50 empresas (por nombre o ticker) y descarta el resto antes de gastar tokens de LLM.
2. Trae precios actuales de **Finnhub** (`/quote`) para 50 tickers — 50 requests, pausados
   ~1.1s entre sí (`FINNHUB_PACING_SECONDS`) para no pasarse del límite de 60 calls/min una vez
   que se suman los tres loops de Finnhub de la misma corrida (ver más abajo).
3. Guarda cada precio en `price_history.json` (ventana local de 12 puntos) para poder dibujar
   un sparkline de respaldo si todavía no hay velas diarias reales para un ticker.
4. Trae fundamentales básicos de **Finnhub** (`/stock/metric`, mismo API key) para los mismos
   50 tickers — 50 requests más, mismo pacing: P/E (TTM), EPS (TTM), capitalización de mercado,
   rango de 52 semanas, ROE (TTM) y margen neto (TTM). Todo dentro del plan free (60 calls/min).
4b. Trae el último resultado YA reportado de **Finnhub** (`/stock/earnings`, mismo API key) —
   50 requests más, mismo pacing: EPS real vs. estimado de consenso ("beat/miss") del trimestre
   más reciente que cada empresa ya presentó. A diferencia del calendario (punto 6), que mira para
   adelante, esto mira para atrás — se usa para el badge "superó/no superó estimación" en el
   modal de cada acción. Se descartan las entradas todavía sin reportar (`actual` viene `null`).
5. Trae velas diarias reales (open/high/low/close) de **Alpha Vantage** `TIME_SERIES_DAILY`,
   pero **solo una vez por día**, no en cada corrida horaria, y **solo para `OHLC_TICKERS`**
   (los 23 tickers originales, no los 50) — ver la sección de abajo, es la parte más particular
   de este pipeline. Los 27 tickers agregados después no tienen velas reales: Alpha Vantage
   free da 25 requests/día en total y ya usa 24 (23 velas + 1 calendario), así que no hay margen
   para más sin pasar a un plan pago. El resultado vive en `daily_ohlc.json`.
6. Trae el calendario de resultados de **Alpha Vantage** `EARNINGS_CALENDAR` (horizonte de
   3 meses) — 1 request más, en la misma corrida diaria que el punto 5 (mismo cupo, mismo
   caché con fecha). Trae TODAS las empresas que reportan en la ventana, no solo las
   nuestras, así que se filtra localmente contra los **50** tickers de `AI_TICKERS` (no contra
   `OHLC_TICKERS` — es 1 solo request sin importar cuántos tickers queden después del filtro,
   así que no hay motivo para restringirlo a los 23). Son fechas reales de balance trimestral,
   no "eventos importantes" del sector — eso no tiene una fuente confiable, así que no se inventa.
   Antes esto venía de Finnhub `/calendar/earnings`, pero ese endpoint tiene un bug
   conocido y no corregido: fechas de balance cercanas que directamente no aparecen o
   vienen mal (ver [finnhubio/Finnhub-API#528](https://github.com/finnhubio/Finnhub-API/issues/528)
   — se detectó en producción cuando el próximo balance real de NVDA no salía en la lista).
   Alpha Vantage no informa si el reporte es antes de apertura o después del cierre
   (Finnhub sí lo tenía), así que ese dato ya no se muestra — se prioriza que la fecha sea
   correcta.
7. Ordena los artículos filtrados por cuántas de nuestras empresas mencionan (`match_count`,
   calculado localmente — Finnhub no manda un puntaje de relevancia como Alpha Vantage lo
   hacía), quedándose con los 15 mejores.
8. Una sola llamada a Claude (con **prompt caching** en el system prompt) que devuelve:
   - las 8 noticias curadas, y
   - un resumen narrativo del sector + su sentimiento general,
   en la misma respuesta. Nunca se llama al LLM por artículo ni dos veces por corrida.
8b. Una **segunda** llamada a Claude, separada de la del punto 8 y mucho menos frecuente
   (una vez cada 7 días, no en cada corrida horaria): genera una tesis de inversión corta
   (~30 palabras) más un catalizador (~12 palabras) para cada uno de los 50 tickers, en una
   sola respuesta que cubre el catálogo completo. Se gatea con el mismo patrón de
   caché-con-fecha que las velas OHLC (ver más abajo) — el resultado vive en
   `stock_theses.json`. No tiene sentido regenerar una tesis de inversión cada hora: no cambia
   tan rápido, y hacerlo igual sería pagar tokens de LLM sin ninguna ganancia real.
9. Reasocia localmente la fuente y fecha de cada noticia (por URL) en vez de pedírselo al modelo,
   así el JSON de salida del LLM se mantiene chico.
10. Actualiza `summary_archive.json` (historial de resúmenes del sector, ver más abajo) y lo
    embebe en `data.json` bajo la clave `archive` — el frontend nunca lee ese archivo por
    separado, todo sale de `data.json` como siempre.
11. Escribe `data.json` en la raíz del proyecto.

## Historial de resúmenes (`summary_archive.json`)

Guarda un snapshot por día (sentimiento, texto del resumen, stats de amplitud, mayor
suba/baja) para que el frontend pueda mostrar "cómo estuvo el sector" en días anteriores,
no solo hoy. Como el pipeline corre cada hora, `update_summary_archive()` **pisa** la entrada
del día de HOY (fecha UTC) en cada corrida en vez de agregar una nueva — así un mismo día
nunca termina con 24 entradas, solo la más reciente. Se recorta a los últimos
`ARCHIVE_DAYS_KEPT` (30) días en cada escritura, mismo patrón de archivo-caché-en-disco que
`price_history.json`. Un fallo acá nunca impide que se escriba el resto de `data.json` —
está envuelto en su propio try/except en `main()`, igual que el calendario de resultados.

## Tesis de inversión semanal (`stock_theses.json`)

Igual que `daily_ohlc.json`, es un caché con fecha en disco: `fetch_weekly_theses()` guarda
`_generatedDate` adentro de `stock_theses.json` y, si ya se generó dentro de los últimos
`THESIS_REFRESH_DAYS` (7) días, devuelve el archivo tal cual sin llamar a Claude — así 6 de
cada 7 corridas diarias (y 167 de cada 168 corridas horarias) no gastan tokens extra en esto.
A diferencia de `daily_ohlc.json`, que se resetea a un cupo diario duro de Alpha Vantage, acá
un fallo en la generación (red, JSON inválido del modelo, etc.) **no** pisa el caché existente:
`fetch_weekly_theses()` devuelve la tesis de la semana anterior tal cual estaba, y la próxima
corrida horaria vuelve a intentar generar una nueva — nunca se deja al frontend sin tesis por
un error transitorio de una sola corrida.

Costo aproximado: ~3,000 tokens de salida extra por generación (50 tickers × tesis + catalizador)
con Sonnet, una vez por semana — del orden de centavos de dólar por mes, no por hora.

## Por qué las velas diarias y el calendario de resultados corren aparte, una vez por día

Alpha Vantage free tier da **25 requests/día en total**, compartidos entre TODO lo que le
pidas. `TIME_SERIES_DAILY` trae el historial completo de un ticker en un solo request, así que
`OHLC_TICKERS` (los 23 tickers originales, no los 50 de `AI_TICKERS`) = 23 requests, más
1 request para `EARNINGS_CALENDAR` = 24 — eso ya casi agota el cupo diario, y es exactamente
por qué los 27 tickers agregados después se quedan sin velas reales: no hay margen para más
sin pasar a un plan pago. Pedirlo en cada corrida horaria (24 veces/día) sería imposible.

La solución: `fetch_daily_batch()` guarda la fecha de la última corrida exitosa adentro de
`daily_ohlc.json` (`_fetchedDate`), junto con el calendario de resultados ya resuelto
(`_earningsCalendar`). Si ya corrió hoy, devuelve el archivo tal cual sin gastar ningún
request — así 23 de las 24 corridas horarias no tocan Alpha Vantage para nada. Cuando sí corre
(una vez por día), respeta el límite de **5 requests/minuto** de Alpha Vantage con una pausa de
13 segundos entre requests, así que esa corrida puntual tarda unos 5 minutos en vez de
segundos — completamente normal, no es que el pipeline esté colgado.

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

Si todo sale bien vas a ver algo como `OK — 50 precios, 8 noticias, 6 resultados próximos, 41 últimos resultados reportados, 50 tesis de inversión y 12 días de historial escritos en .../data.json`.
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

Las noticias, precios, fundamentales y los últimos resultados reportados van todos por Finnhub
(60 calls/min, sin límite diario publicado), así que refrescarlos cada hora no es un problema:
151 requests por corrida (50 quotes + 50 metrics + 50 earnings actuals + 1 de noticias),
pausados ~1.1s entre sí (`FINNHUB_PACING_SECONDS`) para quedarse cómodo por debajo del límite
por minuto. Alpha Vantage solo entra en
juego una vez por día, para las velas y el calendario de resultados — ver la sección de arriba.
Correr más seguido que cada hora no rompería el presupuesto de Finnhub, pero tampoco aportaría
mucho: los precios de Finnhub no cambian tan rápido como para justificarlo, y la corrida diaria
de Alpha Vantage de todos modos solo se dispara una vez.

## Ajustar qué empresas sigue

Hay dos listas, a propósito separadas:

- **`AI_TICKERS`** (50 tickers): el catálogo completo. Recibe precio, fundamentales, noticias,
  último resultado reportado y calendario de resultados — todo lo que sale de Finnhub (sin
  límite diario, solo 60 calls/min) más el calendario de Alpha Vantage (que es 1 solo request
  sin importar cuántos tickers tenga esta lista).
- **`OHLC_TICKERS`** (los primeros 23 de `AI_TICKERS`): los únicos que reciben velas diarias
  reales de Alpha Vantage `TIME_SERIES_DAILY` — 1 request/ticker, y el free tier de Alpha
  Vantage da 25 requests/día en total. 23 velas + 1 calendario = 24, ya casi sin margen.

Para agregar un ticker nuevo: sumalo a `AI_TICKERS` y a `TICKER_NAMES`. Va a tener precio,
noticias, fundamentales y calendario automáticamente, pero **no** va a tener velas reales a
menos que también lo agregues antes de la posición 23 en `AI_TICKERS` (o subas
`OHLC_DAYS_KEPT`/repienses `OHLC_TICKERS` — cualquier cambio ahí implica sacar algún otro
ticker del cupo de 23, porque el límite de Alpha Vantage es duro).

Si agregás muchos tickers más a `AI_TICKERS` (decenas), revisá que el pacing de Finnhub
(`FINNHUB_PACING_SECONDS`, 1.1s entre requests) siga alcanzando para quedarse por debajo de
60 calls/min — con 3 requests/ticker (quote + metric + earnings actuals), a partir de ~180
tickers habría que revisar el pacing de nuevo.
