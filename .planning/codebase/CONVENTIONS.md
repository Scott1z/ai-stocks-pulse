# Coding Conventions

**Analysis Date:** 2026-08-11

## Scope note

This is a static vanilla HTML/CSS/JS PWA (`index.html`, `app.js`, `styles.css`, `service-worker.js`) with no build step, no bundler, no framework, and no JS/CSS package manager (no `package.json` at the repo root). The only other source is a single Python data pipeline script, `pipeline/fetch_and_curate.py`. There is no `.eslintrc*`, `.prettierrc*`, `eslint.config.*`, `biome.json`, or any other lint/format config anywhere in the repo (verified: `ls`/`find` for those filenames returns nothing). Conventions below are inferred directly from the code as written, not from tooling — treat them as "what this codebase actually does," and follow them by pattern-matching existing code rather than by running a formatter/linter.

## Naming Patterns

**Files (frontend):**
- Flat, lowercase, single-word-ish: `app.js`, `styles.css`, `index.html`, `service-worker.js`, `manifest.json` — everything lives at the repo root, no `src/` tree.

**Files (pipeline):**
- `pipeline/fetch_and_curate.py` — the one script. Output/cache files it writes: `data.json` (repo root), `pipeline/price_history.json`, `pipeline/daily_ohlc.json`, `pipeline/summary_archive.json`.

**JS functions — verb-prefixed, purpose-coded (`app.js`, ~90 top-level functions):**
- `render*()` — DOM-mutating functions that (re)paint a section from current state. Examples: `renderStocks()`, `renderNews()`, `renderHeroMovers()`, `renderSectorSummary()`, `renderEarningsCalendar()`, `renderHistory()`, `renderMarketStatus()`, `renderTickerTape()`, `renderLastEarnings()` (`app.js:1216`, `app.js:1364`, `app.js:1081`, `app.js:1056`, `app.js:1430`, `app.js:1484`, `app.js:1877`, `app.js:1885`, `app.js:1702`).
- `init*()` — one-time setup on page load: wires event listeners, sets initial DOM state. Examples: `initHeroChartInteraction()`, `initCompareSection()`, `initStocksViewToggle()`, `initNewsModal()`, `initStockModal()`, `initThemeManager()`, `initServiceWorker()` (`app.js:752`, `app.js:1017`, `app.js:1335`, `app.js:1594`, `app.js:1784`, `app.js:2167`, `app.js:2216`). All `init*()` calls are collected and invoked in sequence at the bottom of `init()` (`app.js:2255`), which itself is called once at file end (`app.js:2290`).
- `build*()` — pure(ish) functions that construct and return a value (usually an HTML/SVG string or a data structure) without touching the DOM directly. Examples: `buildSparkline()`, `buildFundamentalsGrid()`, `buildCompositeSeries()`, `buildCompositeChart()`, `buildCandlestickChart()`, `buildCompareChart()`, `buildShareCanvas()` (`app.js:484`, `app.js:456`, `app.js:525`, `app.js:571`, `app.js:678`, `app.js:866`, `app.js:2005`).
- `format*()` — pure value-to-string formatters. Examples: `formatMarketCap()`, `formatShortDate()`, `formatEarningsMonth()` (`app.js:449`, `app.js:566`, `app.js:1401`).
- Other verb-prefixed groups worth following: `apply*()` for reconciling state into the DOM in one shot (`applySort()`, `applyTheme()` — `app.js:1174`, `app.js:2150`), `normalize*()` for shaping external/raw data into the internal shape (`normalizeRealData()` — `app.js:320`), `is*()`/`has*()` for boolean predicates (`isSafeHttpUrl()`, `isNyseOpenNow()` — `app.js:287`, `app.js:1860`).
- **When adding a new function, pick the prefix that matches what it does** (paints DOM → `render`, wires listeners once → `init`, returns a constructed value → `build`, returns a formatted string → `format`) rather than inventing a new verb.

**Constants:**
- `SCREAMING_SNAKE_CASE` for module-level constants and config-like values: `DEMO_STOCKS`, `DEMO_NEWS`, `DEMO_SECTOR_SUMMARY`, `DEMO_EARNINGS`, `DEMO_ARCHIVE` (`app.js:8-175`), `FAVORITES_KEY`, `COST_BASIS_KEY`, `THEME_KEY`, `HTML_ESCAPE_MAP`, `NEWS_SENTIMENT_MAP`, `ICON_PATHS`, `HERO_CHART_RANGES`.
- **`DEMO_*` prefix is reserved specifically for the hardcoded fallback dataset** that ships in `app.js` and is used when `data.json` is missing/invalid (see Error Handling below). Do not reuse this prefix for anything that isn't part of that fallback contract.
- Mutable "current state" globals use plain `let` + descriptive names, no Hungarian/type prefixes: `let STOCKS = DEMO_STOCKS;`, `let isLiveData = false;`, `let lastUpdatedIso = null;`, `let favorites = new Set();`, `let costBasis = {};` (`app.js:177-183`, `189-190`, `212`). Uppercase (`STOCKS`, `NEWS`, `SECTOR_SUMMARY`, `EARNINGS`, `ARCHIVE`) is used for the handful of globals that hold the "current dataset" (real or demo), lowercase camelCase for everything else (`isLiveData`, `favorites`, `costBasis`, `currentStocksFilter`).

**Python functions (`pipeline/fetch_and_curate.py`) — snake_case, same verb-prefix discipline:**
- `fetch_*()` — one HTTP call (or a paced loop of them) against an external API, always returns a value, never touches global state. Examples: `fetch_finnhub_news()`, `fetch_prices()`, `fetch_fundamentals()`, `fetch_earnings_actuals()`, `fetch_earnings_calendar()`, `fetch_daily_batch()` (lines 223, 301, 335, 366, 423, 473).
- `build_*()` — assembles the final per-entity shape from already-fetched pieces. Example: `build_stocks()` (line 621), combines `prices`, `history`, `fundamentals`, `ohlc`, `earnings_actuals` into the list written to `data.json`.
- `update_*()` — reads a cache file from disk, merges new data in, writes it back, returns the merged result. Examples: `update_price_history()` (line 563), `update_summary_archive()` (line 584). Both follow the same read-merge-trim-write shape.
- Private/internal helpers get a leading underscore: `_mentions()` (line 215), `_first_number()` (line 324), `_strip_markdown_fence()` (line 697).
- Type hints on every function signature (`from __future__ import annotations`, line 49, enables the `str | None`-style unions used throughout on Python versions that need it).

## Code Style

**Formatting:**
- No Prettier/Black config found; formatting is by-hand but consistent: 2-space indent in JS/CSS, 4-space in Python (PEP 8-ish).
- JS: double-quoted strings throughout (`"aisp_favorites"`, not `'aisp_favorites'`), template literals (`` ` `` ) used liberally for any string with interpolation or embedded markup (150 occurrences in `app.js`). No semicolon omission — every statement is terminated with `;`.
- JS: `const`/`let` only — zero `var` usage (verified: `grep -c "\bvar\b" app.js` → 0).
- Arrow functions (`=>`) are the default for callbacks and short helpers (145 occurrences); `function` declarations are used for the ~90 top-level named functions (`render*`, `init*`, `build*`, etc.) so they're hoisted and easy to grep by name.
- No module system: no `import`/`export` anywhere in `app.js` — it's one flat script loaded via a plain `<script src="app.js">` in `index.html`, everything lives in one global scope by convention (not IIFE-wrapped).

**Linting:**
- None configured. Correctness is enforced by manual browser testing (see `TESTING.md`), not a linter. When editing, match existing style visually rather than relying on autofix.

**Python style:**
- Double-quoted strings, f-strings for all interpolation (`f"Aviso: no se pudo obtener precio de {ticker}: {exc}"`).
- Module-level config constants in `SCREAMING_SNAKE_CASE` at the top of the file (`AI_TICKERS`, `OHLC_TICKERS`, `TICKER_NAMES`, `MAX_CANDIDATES`, `HISTORY_POINTS`, `MODEL`, `FINNHUB_PACING_SECONDS`, `OHLC_DAYS_KEPT`, `ARCHIVE_DAYS_KEPT`) — mirrors the JS `DEMO_*`/`*_KEY` constant-hoisting convention.

## Import Organization

**JS:** none — no modules, no import statements. All functions/constants share one global scope in `app.js`, ordered roughly by concern (watchlist/localStorage → data loading/normalization → rendering → charts → modals → theme/PWA setup), each section marked with a `// ---...--- \n// Section Name \n// ---...---` banner comment (e.g. `app.js:185-187`, `app.js:247-249`, `app.js:419-421`).

**Python:** standard library imports first (`json`, `os`, `re`, `sys`, `time`, `datetime`, `pathlib`, `urllib.request`, `urllib.parse`), then the one third-party import (`import anthropic  # pip install anthropic`, line 61) with an inline comment noting how to install it (there's no `pipeline/requirements.txt` pin beyond the anthropic SDK — see `STACK.md`/`pipeline/requirements.txt`). Local imports (`import csv`, `import io`) are done inline inside the one function that needs them (`fetch_earnings_calendar()`, line 427-428) rather than at module top — follow this pattern for any similarly single-use stdlib import.

**Path Aliases:** none — plain relative paths (`fetch("data.json", ...)` in `app.js:389`; `Path(__file__).resolve().parent.parent` in `pipeline/fetch_and_curate.py:156` for `PROJECT_ROOT`).

## Error Handling

**JS — try/catch with silent, deliberate graceful degradation (11 try blocks in `app.js`):**
- `localStorage` access is always wrapped in try/catch with an empty or comment-only catch body, because it can throw in private browsing / quota-exceeded scenarios. Read pattern:
  ```js
  let favorites = new Set();
  try {
    favorites = new Set(JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]"));
  } catch {
    favorites = new Set();
  }
  ```
  Write pattern (`app.js:200-204`):
  ```js
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites]));
  } catch {
    /* localStorage unavailable (private mode, quota) — favorites just won't persist */
  }
  ```
  Follow this exact shape for any new localStorage-backed feature: default value assigned before the try, try does the risky read/write, catch either resets to the same default or is a no-op with a one-line comment explaining *why* it's safe to ignore.
- The entire real-data path is one try/catch that falls back to the hardcoded `DEMO_*` constants on **any** failure — bad HTTP status, malformed JSON, empty stock list all funnel through the same catch (`loadData()`, `app.js:387-417`):
  ```js
  async function loadData() {
    try {
      const res = await fetch("data.json", { cache: "no-store" });
      if (!res.ok) throw new Error(`data.json respondió ${res.status}`);
      const json = await res.json();
      const normalized = normalizeRealData(json);
      if (!normalized.stocks.length) throw new Error("data.json no tiene precios válidos");
      STOCKS = normalized.stocks; /* ...NEWS, SECTOR_SUMMARY, EARNINGS, ARCHIVE, isLiveData=true */
    } catch (err) {
      STOCKS = DEMO_STOCKS; /* ...NEWS, SECTOR_SUMMARY, EARNINGS, ARCHIVE, isLiveData=false */
    }
  }
  ```
  This is the canonical "external data may not exist yet" pattern: check explicitly for the failure conditions that matter (HTTP status, empty result) by throwing synthetic `Error`s, then let one catch reset every dependent global to its demo equivalent. `isLiveData` (and the "DATOS DE DEMOSTRACIÓN" vs "DATOS EN VIVO" UI pill it drives, `renderDataSourcePill()` at `app.js:1849`) is the single source of truth for which mode the page is in.
- URL/parsing helpers that touch untrusted external strings (`hostnameFromUrl()`, `isSafeHttpUrl()` — `app.js:275-293`) wrap `new URL(url)` in try/catch and return a safe default (`"Fuente"`, `false`) rather than letting a malformed URL from Finnhub's feed throw uncaught.
- User-facing errors are never surfaced as thrown exceptions or `alert()`s — failures degrade silently to a fallback value/state. There is no global error boundary or `window.onerror` handler; don't add one without discussing scope, since the existing pattern is "never let the page go blank."

**Python — try/except around every fragile/optional external call, always resolving to a safe fallback rather than propagating (`pipeline/fetch_and_curate.py`):**
- Per-ticker loops (`fetch_prices()`, `fetch_fundamentals()`, `fetch_earnings_actuals()`) catch `Exception` around each individual request inside the loop, log an `Aviso: ...` line to `stderr`, and store a `None`/empty placeholder for that one ticker so one bad ticker never aborts the other 49:
  ```python
  try:
      with urlopen(url, timeout=10) as resp:
          quote = json.loads(resp.read().decode())
      prices[ticker] = {"price": quote.get("c"), "changePct": quote.get("dp")}
  except Exception as exc:  # red intermitente, ticker inválido, etc.
      print(f"Aviso: no se pudo obtener precio de {ticker}: {exc}", file=sys.stderr)
      prices[ticker] = {"price": None, "changePct": None}
  ```
- Whole-feature calls in `main()` (`fetch_earnings_actuals()`, `fetch_daily_batch()`, `curate_with_claude()`, `update_summary_archive()`) are each wrapped in their own try/except at the call site, so a failure in any one optional feature (OHLC candles, earnings calendar, LLM curation, archive history) still lets `data.json` get written with whatever *did* succeed (`main()`, lines 728-771). This is the fix from commit `06096fb` ("Fix crítico: el pipeline se rompía y dejaba de actualizar todo") — before that fix, an unguarded CSV-parsing exception in the earnings calendar step propagated all the way to `main()` and aborted the entire hourly run (no prices, no news, nothing updated), even though price/news/fundamentals fetching had already succeeded. **When adding a new optional data source to the pipeline, wrap its call site in `main()` in its own try/except with a safe empty fallback — do not let it sit unguarded**, per this precedent.
- `_strip_markdown_fence()` (line 697) exists because the LLM occasionally ignores the "no markdown" instruction in `SYSTEM_PROMPT` and wraps its JSON in a ` ```json ` fence — this broke `json.loads()` in production (commit `4d210a7`) before the strip step was added. `curate_with_claude()`'s caller in `main()` still wraps the whole LLM call in try/except as a second layer of defense (line 749-755).
- **`sys.exit(message)` is reserved exclusively for missing required environment variables** (`ALPHAVANTAGE_API_KEY`, `FINNHUB_API_KEY`, `ANTHROPIC_API_KEY`) — the first line of every function that needs one of those keys checks it and exits immediately, e.g. `if not FINNHUB_API_KEY: sys.exit("Falta FINNHUB_API_KEY en el entorno.")` (`fetch_finnhub_news():225`, `fetch_prices():303`, `fetch_fundamentals():340`, `fetch_earnings_actuals():373`, `fetch_earnings_calendar():431`, `fetch_daily_batch():511`, `curate_with_claude():653`). This is deliberate: **`sys.exit()` raises `SystemExit`, which does not inherit from `Exception`, so it correctly escapes every `except Exception as exc:` in this file** — including the ones in `main()` that wrap `fetch_earnings_actuals()` and `fetch_daily_batch()` (lines 728-737). A missing API key is unrecoverable misconfiguration and should hard-stop the whole run rather than be swallowed as if it were a transient failure; a bad/expired ticker, a flaky network call, or a malformed API response should not. **Never catch `sys.exit()` calls with a bare `except:` or `except BaseException:`** in this file, and never move a `sys.exit()` check inside a function's own try block — both would silently convert a fatal config error into a per-ticker "Aviso" log line, hiding the real problem. This distinction (fail-fast for config, fail-soft with fallback for data) is the core error-handling rule for this file.

## Logging

**JS:** no logging framework; `console.*` is not used in the render/init/build code paths (errors are swallowed into fallback state instead, per Error Handling above).

**Python:** plain `print(..., file=sys.stderr)` for every non-fatal warning, always prefixed `"Aviso: "` (Spanish for "Notice/Warning:") followed by what failed and the exception, e.g. `print(f"Aviso: no se pudo obtener precio de {ticker}: {exc}", file=sys.stderr)`. `main()` prints one final `stdout` summary line on success: `f"OK — {len(stocks)} precios, {len(items)} noticias, ..."` (line 788). Follow this `"Aviso: <what> <why>"` → stderr convention for new warnings, and keep the single `"OK — ..."` stdout summary as the only non-warning output, since GitHub Actions logs (and the local `pipeline.log` file) are the only observability this pipeline has — see `TESTING.md`.

## Comments

**Language:** predominantly Spanish, used sparingly and specifically to explain **why**, not what — API rate-limit math, business/product decisions, historical bugs and their fixes, and non-obvious constraints. Comments do not restate what the following line of code obviously does. A minority of comments (mostly in `app.js`'s CSS-adjacent/visual-design sections and a few `pipeline/fetch_and_curate.py` inline exception comments) are in English — the codebase is bilingual in comments, with Spanish dominant for pipeline/business logic and a mix of both for frontend rationale. Match whichever language the surrounding block already uses rather than introducing a third style.

Representative examples:
- `app.js:207-210` (why localStorage, why no backend):
  ```js
  // Mi posición — precio de compra + cantidad de acciones, opcional por
  // ticker favorito, para calcular una ganancia/pérdida hipotética total.
  // Todo local (localStorage), nunca se manda a ningún servidor — no hay
  // backend que lo reciba.
  ```
- `app.js:219-221` (why a normalization branch exists — backward compatibility):
  ```js
  // getPosition() normaliza el formato viejo (solo precio, sin cantidad) al
  // abrirlo, así una posición cargada antes de sumar "cantidad de acciones"
  // no se rompe — simplemente se ve sin cantidad hasta que se re-guarde.
  ```
- `app.js:283-286` (why a security check exists):
  ```js
  // source_url viaja tal cual desde Finnhub hasta acá — antes de usarlo como
  // href de un link real, confirmamos que sea http(s). Sin esto, un
  // "javascript:" (u otro esquema ejecutable) en esos datos externos se
  // dispararía al hacer click en "Leer artículo original".
  ```
- `pipeline/fetch_and_curate.py:410-420` (why an API was swapped, citing the upstream bug tracker):
  ```python
  # Antes usaba Finnhub /calendar/earnings. Se cambió porque ese endpoint tiene
  # un bug conocido y no corregido de fechas de balance faltantes/incorrectas
  # (finnhubio/Finnhub-API#528 en GitHub) — en producción esto se notó como un
  # balance real e inminente (NVDA, ~fin de agosto) que directamente no
  # aparecía...
  ```
- `styles.css:99-109` (why a color value was chosen, with an audit claim inline):
  ```css
  /* Modo oscuro — recalibrado a pedido del usuario para que se vea como el
     dark mode de finance.yahoo.com... Como cada color del sitio ya pasa por
     estas variables (auditado: cero hex hardcodeado fuera de este bloque,
     ni en styles.css ni en app.js), redefinir el bloque alcanza para que
     absolutamente todo — gráficos, badges, hairlines — herede el tema
     nuevo sin tocar una sola regla más. */
  ```

**Section banners:** both `app.js` and `styles.css` use a consistent ASCII-rule banner to mark major sections:
```js
// ---------------------------------------------------------------------------
// Watchlist — favorite tickers persisted locally, no account needed.
// ---------------------------------------------------------------------------
```
Use this exact 79-char-dash-rule style when adding a new top-level section to either file, not a shorter/differently-styled divider.

**Docstrings (Python):** only the module itself has a full docstring (`pipeline/fetch_and_curate.py:1-47`), documenting the entire pipeline flow step-by-step, required env vars, and usage — treat this as the canonical "what does this script do" reference and keep it in sync when adding/removing a numbered step. Individual functions use short triple-quoted docstrings only when the *why* isn't obvious from the name + a one-line comment would (e.g. `pre_filter()`, `finnhub_time_to_iso()`, `fetch_daily_batch()`); simple functions (`build_stocks()`, `_first_number()`'s caller sites) skip docstrings entirely.

## Function Design

**Size:** functions are scoped to one responsibility matching their name prefix (one render target, one fetch, one build). Several run 40-80 lines when they assemble multi-part HTML (e.g. `buildFundamentalsGrid()`, `openStockModal()`) — length is driven by the amount of markup/logic genuinely needed, not artificially split into smaller pieces purely for line-count reasons.

**Parameters:** plain positional parameters for 1-3 args; object-destructured parameters when a function needs several related named values, e.g. `buildCompositeChart({ series, dates })` (`app.js:571`). Python functions use explicit typed parameters (`tickers: list[str]`) and typed return values (`-> dict[str, dict]`) throughout — every function in `pipeline/fetch_and_curate.py` is type-hinted.

**Return Values:** JS `build*()`/`format*()` functions always return a value (string, number, or `null` for "not available" — never `undefined` on purpose, see `formatMarketCap()` returning `null` when `millions == null`). Python `fetch_*()` functions return a dict keyed by ticker (even on total failure, e.g. `fetch_earnings_calendar()` returns `[]` rather than raising) so callers never have to special-case "the fetch didn't happen."

## Module Design

**Exports:** none — both `app.js` and `pipeline/fetch_and_curate.py` are single-file, single-purpose scripts with no package/module boundary to design around. `app.js` runs top-to-bottom as one `<script>` tag; `pipeline/fetch_and_curate.py` is invoked as `python3 pipeline/fetch_and_curate.py` with a `if __name__ == "__main__": main()` guard (line 795-796) as its only entry-point convention.

**Barrel Files:** not applicable — no directory of modules to re-export.

## CSS Design-Token System (`styles.css`)

**Custom properties are the only source of color** — every color in the entire site (both files, `app.js` included, since it reads tokens via `getComputedStyle` for canvas drawing, see `buildShareCanvas()` at `app.js:2005-2008`) flows through `:root` custom properties defined in three blocks: light theme (`styles.css:47-97`), explicit dark theme (`:root[data-theme="dark"]`, `styles.css:110-134`), and the `prefers-color-scheme: dark` fallback for users who haven't made an explicit choice (`styles.css:136-161`). **Verified: `grep -n "#[0-9a-fA-F]\{3,6\}" styles.css` returns hex values only inside those three blocks (plus one prose mention of `#000`/`#fff` inside a comment at line 105) — zero hardcoded hex colors anywhere else in the stylesheet, and none in `app.js` either.** When adding a new color, add a token to all three blocks (light, dark, prefers-color-scheme dark) rather than hardcoding a hex value at the use site.

**Token names, by role:**
- Surfaces: `--paper` (page background), `--panel` (card/section background), `--panel-raised` (elevated surface).
- Structure: `--line` (hairline borders), `--line-strong` (emphasized borders).
- Text: `--text`, `--text-dim`, `--text-faint` (three-tier hierarchy).
- Brand: `--accent`, `--accent-dim` (the site's single accent color — see the "One-Accent Rule"/"Lila Rule" referenced in comments at `styles.css:6-9`, `62-65`).
- Semantic (stock movement): `--rise`/`--rise-dim`, `--fall`/`--fall-dim`, `--mixed`/`--mixed-dim` — these never borrow the accent hue, by design (`styles.css:7-8`).
- Category icon accents: `--icon-teal`, `--icon-indigo` (used only for the small finance-glyph icon set, deliberately outside the one-accent rule per `styles.css:60-65`).
- Radii/layout: `--radius-pill`, `--radius-sm`, `--maxw`.
- Fonts: `--font-prose`, `--font-data` — both point at the same Montserrat stack on purpose; kept as two variables instead of collapsed into one so call sites don't all need editing if a second typeface is ever reintroduced (`styles.css:88-92`).

**Class naming:** component/feature-scoped, hyphen-separated, not strict BEM (no `__`/`--` separators) but same intent — a base component class followed by increasingly specific descendant/modifier segments, e.g. `.hero-mover`, `.stock-tag`, `.history-card`, `.compare-suggestion-item`, `.compare-suggestion-ticker`, `.fundamentals-help-disclaimer`, `.cal-cell-pad`, `.earnings-surprise-meta` (217 unique classes total; grep sample confirms the pattern holds throughout). State/variant classes are short and unprefixed by component name when they're generic (`.active`, `.closed`, `.has-entry`, `.bullish`/`.bearish`), but component-prefixed when they're specific to one widget (`.chip-favorites`). **When naming a new class, use `<component>-<part>[-<sub-part>]` (e.g. `.watchlist-position-badge`)** rather than introducing new abbreviations or a different separator style.

---

*Convention analysis: 2026-08-11*
