# Pipeline de datos — AI Stocks Pulse

Este script corre por **cron**, nunca en cada visita a la landing. Escribe
`../data.json`, que es el único archivo que lee el frontend (`app.js`). Si
`data.json` no existe o falla al leerse, la página cae automáticamente a
datos de demostración — así que es seguro probar esto sin romper nada.

## Qué hace cada corrida

1. Trae noticias de **Alpha Vantage** (`NEWS_SENTIMENT`, topic=technology + tickers de IA) — 1 request.
2. Trae precios actuales de **Finnhub** (`/quote`) para 9 tickers — 9 requests.
3. Guarda cada precio en `price_history.json` (ventana local de 12 puntos) para poder dibujar
   un sparkline real sin pagar por un endpoint histórico.
4. Pre-filtra las noticias por `relevance_score` (ya calculado por Alpha Vantage) y se queda con
   las 15 mejores — esto es lo que evita mandarle al LLM artículos irrelevantes.
5. Una sola llamada a Claude (con **prompt caching** en el system prompt) que devuelve:
   - las 8 noticias curadas, y
   - un resumen narrativo del sector + su sentimiento general,
   en la misma respuesta. Nunca se llama al LLM por artículo ni dos veces por corrida.
6. Reasocia localmente la fuente y fecha de cada noticia (por URL) en vez de pedírselo al modelo,
   así el JSON de salida del LLM se mantiene chico.
7. Escribe `data.json` en la raíz del proyecto.

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

Si todo sale bien vas a ver algo como `OK — 9 precios y 8 noticias escritas en .../data.json`.
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

Alpha Vantage free tier permite **25 requests/día en total**. Esta pipeline gasta 1 request
de Alpha Vantage por corrida (las cotizaciones van por Finnhub, que tiene un límite mucho más
generoso — 60 calls/min). Corriendo una vez por hora usás 24 de esos 25 requests/día, con margen.
Si más adelante querés refrescar más seguido, hay que separar el fetch de precios (Finnhub, barato)
del de noticias (Alpha Vantage, limitado) en corridas independientes.

## Ajustar qué empresas sigue

Editá la lista `AI_TICKERS` (y el diccionario `TICKER_NAMES`) al principio de
`fetch_and_curate.py`.
