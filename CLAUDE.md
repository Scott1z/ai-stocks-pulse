<!-- GSD:project-start source:PROJECT.md -->

## Project

**AI QuickCap — v2**

AI QuickCap is a public, static web app that summarizes the AI-sector stock market — 50 tracked tickers, prices, curated news, sentiment, and a daily narrative — refreshed hourly by an automated Python pipeline, with a personal watchlist stored entirely in the visitor's browser (no accounts). This v2 milestone adds web push notifications so visitors get the day's sector summary even when they haven't opened the app.

**Core Value:** A visitor understands what moved AI-sector stocks today, and why, in under 30 seconds — now delivered proactively via a daily push notification, not just to whoever happens to open the tab.

### Constraints

- **Tech stack**: Frontend stays vanilla JS/CSS/HTML — the Push API and Service Worker are native browser APIs, no framework needed for the client side.
- **Backend**: Vercel Functions + Upstash for Redis (Vercel Marketplace) only — explicitly chosen over a third-party push SaaS (OneSignal/Firebase) now that the site is already on Vercel, to avoid a second account/platform for a single feature.
- **No accounts**: Push subscriptions must work anonymously, tied to the browser's push subscription object, consistent with the existing no-login watchlist.
- **Budget**: User wants "lo más simple posible" — stay within Vercel's free Hobby tier; avoid paid third-party notification services.
- **Trigger source**: Must reuse the existing hourly GitHub Actions pipeline run that lands at/after market close — no new scheduler.

<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->

## Technology Stack

## Overview

## Languages

- HTML5 — `index.html` (245 lines), single page, Spanish (`lang="es"`)
- CSS3 — `styles.css` (1905 lines), no preprocessor (no Sass/Less/PostCSS), hand-written custom properties for the design system
- JavaScript (ES2020+, vanilla, no TypeScript) — `app.js` (2290 lines) + `service-worker.js` (67 lines)
- Python 3.12 (pinned in `.github/workflows/refresh-data.yml:36` via `actions/setup-python@v5`) — `pipeline/fetch_and_curate.py` (797 lines)
- Script comments/docstrings are written in Spanish; the Claude system prompt is in Spanish and instructs the model to always output Spanish text regardless of source article language

## Runtime

- No runtime — plain static files interpreted directly by the browser. No Node.js is involved in building or serving the frontend.
- No `package.json`, no `node_modules`, no npm/yarn/pnpm lockfile anywhere in the repo. This is a deliberate architectural choice, not an oversight: there is no JS build step, no transpilation, no bundling, and no dependency-management surface for the frontend. Any new frontend code must run as-is in the browser (no import of npm packages, no JSX, no framework runtime).
- Browser APIs used directly: `fetch`, `localStorage` (`app.js:192-243`, favorites and cost-basis tracking — explicitly local-only, "nunca se manda a ningún servidor"), Service Worker / Cache API (`service-worker.js`), inline SVG generation for charts (candlestick/sparkline/composite charts built by hand in `app.js`, no charting library).
- CPython 3.12, executed either by GitHub Actions runners (`ubuntu-latest`) or manually via a local virtualenv (`pipeline/README.md`).
- Package manager: `pip`, dependency pinned in `pipeline/requirements.txt`. No lockfile (`requirements.txt` uses a version range, not a pinned/hashed lock).
- Uses only Python stdlib for HTTP (`urllib.request.urlopen`, `urllib.parse.urlencode`) plus `csv`/`io` for parsing Alpha Vantage's CSV response — no `requests` library.

## Frameworks

## Key Dependencies

- `anthropic>=0.121.0,<1.0.0` — official Anthropic Python SDK; the only third-party dependency in the entire repository (frontend included).

## Configuration

- Three required env vars, read via `os.environ.get(...)` in `pipeline/fetch_and_curate.py:65-67`: `ALPHAVANTAGE_API_KEY`, `FINNHUB_API_KEY`, `ANTHROPIC_API_KEY`.
- Local dev: copy `pipeline/.env.example` to `pipeline/.env`, fill in keys, then `export $(grep -v '^#' .env | xargs)` before running (`pipeline/README.md:110-120`). `.env` existence noted only — never read its contents; it is git-ignored (`.gitignore`: `pipeline/.env`).
- CI: same three vars injected as GitHub Actions **encrypted secrets** (`ALPHAVANTAGE_API_KEY`, `FINNHUB_API_KEY`, `ANTHROPIC_API_KEY`) in `.github/workflows/refresh-data.yml:42-45`.
- The pipeline hard-exits (`sys.exit(...)`) if a required key is missing at the point it's needed, rather than failing fast up front — e.g. `fetch_finnhub_news()` (`fetch_and_curate.py:224-225`), `fetch_prices()` (`:302-303`), `curate_with_claude()` (`:652-653`).
- No env vars, no config files. Behavior constants (ticker lists, chart ranges, etc.) are hard-coded directly in `app.js`.
- `manifest.json` — PWA manifest (name, icons, standalone display, theme color).
- Content-Security-Policy is delivered via `<meta http-equiv>` in `index.html:12` (not an HTTP header) — a deliberate workaround because "GitHub Pages no permite headers HTTP custom" (index.html comment). Policy: `default-src 'self'; script-src 'self'` (no inline/eval scripts anywhere — all listeners are `addEventListener`-based), `style-src 'self' 'unsafe-inline'` (needed for a few inline styles app.js sets directly, e.g. breadth-bar widths), `img-src 'self' data:`, `connect-src 'self'` (frontend only ever fetches same-origin `data.json`, never calls external APIs directly).

## Platform Requirements

- Frontend: any static file server or even `file://` access (no dev server required, though one may be used for convenience — not configured in-repo).
- Pipeline: Python 3.x with `venv`, `pip install -r pipeline/requirements.txt`; can be scheduled locally via macOS `cron` for manual/local operation (`pipeline/README.md:132-145`) in addition to (or instead of) GitHub Actions.
- Static hosting: **GitHub Pages**, serving from the `main` branch root (`DEPLOY.md`, Part 6).
- Scheduled data refresh: **GitHub Actions**, hourly cron (`0 * * * *`), `ubuntu-latest` runner, Python 3.12 (`.github/workflows/refresh-data.yml`).
- No server-side runtime in production at all — the "backend" is a scheduled batch job that commits a JSON file to the repo, which GitHub Pages then serves statically.

## Data Artifacts Committed to the Repo

- `data.json` (repo root) — the only file the frontend reads.
- `pipeline/price_history.json` — rolling window of recent prices per ticker (sparkline fallback source).
- `pipeline/daily_ohlc.json` — cached daily OHLC candles + `_fetchedDate` marker + `_earningsCalendar`, refreshed at most once/day.
- `pipeline/summary_archive.json` — rolling 30-day archive of daily sector summaries.

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

## Scope note

## Naming Patterns

- Flat, lowercase, single-word-ish: `app.js`, `styles.css`, `index.html`, `service-worker.js`, `manifest.json` — everything lives at the repo root, no `src/` tree.
- `pipeline/fetch_and_curate.py` — the one script. Output/cache files it writes: `data.json` (repo root), `pipeline/price_history.json`, `pipeline/daily_ohlc.json`, `pipeline/summary_archive.json`.
- `render*()` — DOM-mutating functions that (re)paint a section from current state. Examples: `renderStocks()`, `renderNews()`, `renderHeroMovers()`, `renderSectorSummary()`, `renderEarningsCalendar()`, `renderHistory()`, `renderMarketStatus()`, `renderTickerTape()`, `renderLastEarnings()` (`app.js:1216`, `app.js:1364`, `app.js:1081`, `app.js:1056`, `app.js:1430`, `app.js:1484`, `app.js:1877`, `app.js:1885`, `app.js:1702`).
- `init*()` — one-time setup on page load: wires event listeners, sets initial DOM state. Examples: `initHeroChartInteraction()`, `initCompareSection()`, `initStocksViewToggle()`, `initNewsModal()`, `initStockModal()`, `initThemeManager()`, `initServiceWorker()` (`app.js:752`, `app.js:1017`, `app.js:1335`, `app.js:1594`, `app.js:1784`, `app.js:2167`, `app.js:2216`). All `init*()` calls are collected and invoked in sequence at the bottom of `init()` (`app.js:2255`), which itself is called once at file end (`app.js:2290`).
- `build*()` — pure(ish) functions that construct and return a value (usually an HTML/SVG string or a data structure) without touching the DOM directly. Examples: `buildSparkline()`, `buildFundamentalsGrid()`, `buildCompositeSeries()`, `buildCompositeChart()`, `buildCandlestickChart()`, `buildCompareChart()`, `buildShareCanvas()` (`app.js:484`, `app.js:456`, `app.js:525`, `app.js:571`, `app.js:678`, `app.js:866`, `app.js:2005`).
- `format*()` — pure value-to-string formatters. Examples: `formatMarketCap()`, `formatShortDate()`, `formatEarningsMonth()` (`app.js:449`, `app.js:566`, `app.js:1401`).
- Other verb-prefixed groups worth following: `apply*()` for reconciling state into the DOM in one shot (`applySort()`, `applyTheme()` — `app.js:1174`, `app.js:2150`), `normalize*()` for shaping external/raw data into the internal shape (`normalizeRealData()` — `app.js:320`), `is*()`/`has*()` for boolean predicates (`isSafeHttpUrl()`, `isNyseOpenNow()` — `app.js:287`, `app.js:1860`).
- **When adding a new function, pick the prefix that matches what it does** (paints DOM → `render`, wires listeners once → `init`, returns a constructed value → `build`, returns a formatted string → `format`) rather than inventing a new verb.
- `SCREAMING_SNAKE_CASE` for module-level constants and config-like values: `DEMO_STOCKS`, `DEMO_NEWS`, `DEMO_SECTOR_SUMMARY`, `DEMO_EARNINGS`, `DEMO_ARCHIVE` (`app.js:8-175`), `FAVORITES_KEY`, `COST_BASIS_KEY`, `THEME_KEY`, `HTML_ESCAPE_MAP`, `NEWS_SENTIMENT_MAP`, `ICON_PATHS`, `HERO_CHART_RANGES`.
- **`DEMO_*` prefix is reserved specifically for the hardcoded fallback dataset** that ships in `app.js` and is used when `data.json` is missing/invalid (see Error Handling below). Do not reuse this prefix for anything that isn't part of that fallback contract.
- Mutable "current state" globals use plain `let` + descriptive names, no Hungarian/type prefixes: `let STOCKS = DEMO_STOCKS;`, `let isLiveData = false;`, `let lastUpdatedIso = null;`, `let favorites = new Set();`, `let costBasis = {};` (`app.js:177-183`, `189-190`, `212`). Uppercase (`STOCKS`, `NEWS`, `SECTOR_SUMMARY`, `EARNINGS`, `ARCHIVE`) is used for the handful of globals that hold the "current dataset" (real or demo), lowercase camelCase for everything else (`isLiveData`, `favorites`, `costBasis`, `currentStocksFilter`).
- `fetch_*()` — one HTTP call (or a paced loop of them) against an external API, always returns a value, never touches global state. Examples: `fetch_finnhub_news()`, `fetch_prices()`, `fetch_fundamentals()`, `fetch_earnings_actuals()`, `fetch_earnings_calendar()`, `fetch_daily_batch()` (lines 223, 301, 335, 366, 423, 473).
- `build_*()` — assembles the final per-entity shape from already-fetched pieces. Example: `build_stocks()` (line 621), combines `prices`, `history`, `fundamentals`, `ohlc`, `earnings_actuals` into the list written to `data.json`.
- `update_*()` — reads a cache file from disk, merges new data in, writes it back, returns the merged result. Examples: `update_price_history()` (line 563), `update_summary_archive()` (line 584). Both follow the same read-merge-trim-write shape.
- Private/internal helpers get a leading underscore: `_mentions()` (line 215), `_first_number()` (line 324), `_strip_markdown_fence()` (line 697).
- Type hints on every function signature (`from __future__ import annotations`, line 49, enables the `str | None`-style unions used throughout on Python versions that need it).

## Code Style

- No Prettier/Black config found; formatting is by-hand but consistent: 2-space indent in JS/CSS, 4-space in Python (PEP 8-ish).
- JS: double-quoted strings throughout (`"aisp_favorites"`, not `'aisp_favorites'`), template literals (`` ` `` ) used liberally for any string with interpolation or embedded markup (150 occurrences in `app.js`). No semicolon omission — every statement is terminated with `;`.
- JS: `const`/`let` only — zero `var` usage (verified: `grep -c "\bvar\b" app.js` → 0).
- Arrow functions (`=>`) are the default for callbacks and short helpers (145 occurrences); `function` declarations are used for the ~90 top-level named functions (`render*`, `init*`, `build*`, etc.) so they're hoisted and easy to grep by name.
- No module system: no `import`/`export` anywhere in `app.js` — it's one flat script loaded via a plain `<script src="app.js">` in `index.html`, everything lives in one global scope by convention (not IIFE-wrapped).
- None configured. Correctness is enforced by manual browser testing (see `TESTING.md`), not a linter. When editing, match existing style visually rather than relying on autofix.
- Double-quoted strings, f-strings for all interpolation (`f"Aviso: no se pudo obtener precio de {ticker}: {exc}"`).
- Module-level config constants in `SCREAMING_SNAKE_CASE` at the top of the file (`AI_TICKERS`, `OHLC_TICKERS`, `TICKER_NAMES`, `MAX_CANDIDATES`, `HISTORY_POINTS`, `MODEL`, `FINNHUB_PACING_SECONDS`, `OHLC_DAYS_KEPT`, `ARCHIVE_DAYS_KEPT`) — mirrors the JS `DEMO_*`/`*_KEY` constant-hoisting convention.

## Import Organization

## Error Handling

- `localStorage` access is always wrapped in try/catch with an empty or comment-only catch body, because it can throw in private browsing / quota-exceeded scenarios. Read pattern:
- The entire real-data path is one try/catch that falls back to the hardcoded `DEMO_*` constants on **any** failure — bad HTTP status, malformed JSON, empty stock list all funnel through the same catch (`loadData()`, `app.js:387-417`):
- URL/parsing helpers that touch untrusted external strings (`hostnameFromUrl()`, `isSafeHttpUrl()` — `app.js:275-293`) wrap `new URL(url)` in try/catch and return a safe default (`"Fuente"`, `false`) rather than letting a malformed URL from Finnhub's feed throw uncaught.
- User-facing errors are never surfaced as thrown exceptions or `alert()`s — failures degrade silently to a fallback value/state. There is no global error boundary or `window.onerror` handler; don't add one without discussing scope, since the existing pattern is "never let the page go blank."
- Per-ticker loops (`fetch_prices()`, `fetch_fundamentals()`, `fetch_earnings_actuals()`) catch `Exception` around each individual request inside the loop, log an `Aviso: ...` line to `stderr`, and store a `None`/empty placeholder for that one ticker so one bad ticker never aborts the other 49:
- Whole-feature calls in `main()` (`fetch_earnings_actuals()`, `fetch_daily_batch()`, `curate_with_claude()`, `update_summary_archive()`) are each wrapped in their own try/except at the call site, so a failure in any one optional feature (OHLC candles, earnings calendar, LLM curation, archive history) still lets `data.json` get written with whatever *did* succeed (`main()`, lines 728-771). This is the fix from commit `06096fb` ("Fix crítico: el pipeline se rompía y dejaba de actualizar todo") — before that fix, an unguarded CSV-parsing exception in the earnings calendar step propagated all the way to `main()` and aborted the entire hourly run (no prices, no news, nothing updated), even though price/news/fundamentals fetching had already succeeded. **When adding a new optional data source to the pipeline, wrap its call site in `main()` in its own try/except with a safe empty fallback — do not let it sit unguarded**, per this precedent.
- `_strip_markdown_fence()` (line 697) exists because the LLM occasionally ignores the "no markdown" instruction in `SYSTEM_PROMPT` and wraps its JSON in a ` ```json ` fence — this broke `json.loads()` in production (commit `4d210a7`) before the strip step was added. `curate_with_claude()`'s caller in `main()` still wraps the whole LLM call in try/except as a second layer of defense (line 749-755).
- **`sys.exit(message)` is reserved exclusively for missing required environment variables** (`ALPHAVANTAGE_API_KEY`, `FINNHUB_API_KEY`, `ANTHROPIC_API_KEY`) — the first line of every function that needs one of those keys checks it and exits immediately, e.g. `if not FINNHUB_API_KEY: sys.exit("Falta FINNHUB_API_KEY en el entorno.")` (`fetch_finnhub_news():225`, `fetch_prices():303`, `fetch_fundamentals():340`, `fetch_earnings_actuals():373`, `fetch_earnings_calendar():431`, `fetch_daily_batch():511`, `curate_with_claude():653`). This is deliberate: **`sys.exit()` raises `SystemExit`, which does not inherit from `Exception`, so it correctly escapes every `except Exception as exc:` in this file** — including the ones in `main()` that wrap `fetch_earnings_actuals()` and `fetch_daily_batch()` (lines 728-737). A missing API key is unrecoverable misconfiguration and should hard-stop the whole run rather than be swallowed as if it were a transient failure; a bad/expired ticker, a flaky network call, or a malformed API response should not. **Never catch `sys.exit()` calls with a bare `except:` or `except BaseException:`** in this file, and never move a `sys.exit()` check inside a function's own try block — both would silently convert a fatal config error into a per-ticker "Aviso" log line, hiding the real problem. This distinction (fail-fast for config, fail-soft with fallback for data) is the core error-handling rule for this file.

## Logging

## Comments

- `app.js:207-210` (why localStorage, why no backend):
- `app.js:219-221` (why a normalization branch exists — backward compatibility):
- `app.js:283-286` (why a security check exists):
- `pipeline/fetch_and_curate.py:410-420` (why an API was swapped, citing the upstream bug tracker):
- `styles.css:99-109` (why a color value was chosen, with an audit claim inline):

## Function Design

## Module Design

## CSS Design-Token System (`styles.css`)

- Surfaces: `--paper` (page background), `--panel` (card/section background), `--panel-raised` (elevated surface).
- Structure: `--line` (hairline borders), `--line-strong` (emphasized borders).
- Text: `--text`, `--text-dim`, `--text-faint` (three-tier hierarchy).
- Brand: `--accent`, `--accent-dim` (the site's single accent color — see the "One-Accent Rule"/"Lila Rule" referenced in comments at `styles.css:6-9`, `62-65`).
- Semantic (stock movement): `--rise`/`--rise-dim`, `--fall`/`--fall-dim`, `--mixed`/`--mixed-dim` — these never borrow the accent hue, by design (`styles.css:7-8`).
- Category icon accents: `--icon-teal`, `--icon-indigo` (used only for the small finance-glyph icon set, deliberately outside the one-accent rule per `styles.css:60-65`).
- Radii/layout: `--radius-pill`, `--radius-sm`, `--maxw`.
- Fonts: `--font-prose`, `--font-data` — both point at the same Montserrat stack on purpose; kept as two variables instead of collapsed into one so call sites don't all need editing if a second typeface is ever reintroduced (`styles.css:88-92`).

<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

## System Overview

```text

```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Pipeline orchestrator | Fetches all sources, curates with an LLM, writes `data.json` | `pipeline/fetch_and_curate.py` (`main()`, lines 716-796) |
| GitHub Actions workflow | Runs the pipeline hourly, commits/pushes the data files | `.github/workflows/refresh-data.yml` |
| Data layer / loader | Fetches `data.json`, normalizes it, falls back to demo data | `app.js` (`loadData()`, `normalizeRealData()`, lines 320-417) |
| Demo data | Hardcoded fallback content shown when `data.json` is absent/invalid | `app.js` (`DEMO_STOCKS`, `DEMO_NEWS`, `DEMO_SECTOR_SUMMARY`, `DEMO_EARNINGS`, `DEMO_ARCHIVE`, lines 8-181) |
| Rendering layer | Builds DOM/SVG/canvas markup from in-memory state (`STOCKS`, `NEWS`, `SECTOR_SUMMARY`, `EARNINGS`, `ARCHIVE`) | `app.js` (all `render*()`/`build*()` functions) |
| Interaction layer | Wires event listeners, one `init*()` function per feature area | `app.js` (all `init*()` functions) |
| Local persistence | Favorites, cost-basis positions, theme choice — `localStorage` only, never sent anywhere | `app.js` (`FAVORITES_KEY`, `COST_BASIS_KEY`, `THEME_KEY`) |
| Design system | CSS custom properties (light + `[data-theme="dark"]` override block), component classes | `styles.css` |
| PWA shell/manifest | Installability metadata, icons | `manifest.json`, `icons/` |
| Offline cache | Service worker: app-shell cache-first, `data.json` network-first | `service-worker.js` |
| Page shell + CSP | Single HTML document, all sections as `<section>` anchors, two `<dialog>`-like overlay modals | `index.html` |

## Pattern Overview

- Zero build step for the frontend — `app.js` is loaded as a single `<script src="app.js">`, no bundler, no npm dependency for the site itself.
- Zero LLM calls at view time — the public page's serving cost never scales with traffic (see `PRODUCT.md` Positioning).
- One-way data flow: pipeline → `data.json` → `fetch()` → normalize → module-level mutable state (`STOCKS`, `NEWS`, etc.) → render functions → DOM. There is no state-management library; render functions read directly from top-level `let` variables.
- Graceful degradation is a first-class design rule, not an afterthought: every optional data feature (OHLC candles, earnings calendar, last-earnings badge, history archive) has an explicit "not available yet" rendering path rather than crashing or hiding silently.

## Layers

- Purpose: fetch external market/news data, curate with an LLM, and produce the single artifact the frontend consumes.
- Location: `pipeline/`
- Contains: fetch functions per external API, local caching helpers (`update_price_history`, `fetch_daily_batch`), the LLM curation call, and `main()` orchestration.
- Depends on: Finnhub, Alpha Vantage, and Anthropic APIs (via env vars `FINNHUB_API_KEY`, `ALPHAVANTAGE_API_KEY`, `ANTHROPIC_API_KEY`); local cache files (`price_history.json`, `daily_ohlc.json`, `summary_archive.json`).
- Used by: nothing in-process — it is invoked by GitHub Actions on a cron, or by hand for local testing (`pipeline/README.md`). It has no runtime relationship to the frontend beyond the `data.json` file it writes.
- Purpose: fetch `data.json`, validate/normalize its shape, and populate module-level state; fall back to demo constants on any failure.
- Location: `app.js`
- Contains: `loadData()`, `normalizeRealData()`, small pure helpers (`classifyBySign`, `hostnameFromUrl`, `isSafeHttpUrl`, `escapeHtml`, `relativeTime`, `findBlurbForTicker`).
- Depends on: the `fetch()` API, `data.json`'s documented shape (schema comment at `app.js:250-265`).
- Used by: `init()`, which awaits `loadData()` before calling any `render*()` function.
- Purpose: turn in-memory state into markup/SVG/canvas output. No layer below this touches the network; no layer above this owns state.
- Location: `app.js`
- Contains: `render*()` functions (one per page section: hero chart, sector summary, hero movers, breadth bar, stock ledger, heatmap, compare chart, news list, earnings calendar, history archive, ticker tape, market-status pill, data-source pill), and `build*()` helpers that return HTML/SVG strings consumed by the `render*()` functions (`buildSparkline`, `buildCompositeChart`, `buildCandlestickChart`, `buildStockDetailChart`, `buildFundamentalsGrid`, `buildShareCanvas`).
- Depends on: module-level state (`STOCKS`, `NEWS`, `SECTOR_SUMMARY`, `EARNINGS`, `ARCHIVE`, `favorites`, `costBasis`) and DOM element IDs defined in `index.html`.
- Used by: `init()` (initial paint) and the interaction layer (re-render on filter/sort/search/toggle changes).
- Purpose: attach event listeners once per feature area and call the matching `render*()` function on state changes (filter clicks, sort clicks, search input, modal open/close, theme toggle, install prompt, service worker registration).
- Location: `app.js`
- Contains: `init*()` functions, one per feature (`initFilters`, `initLedgerSort`, `initStocksViewToggle`, `initNewsModal`, `initStockModal`, `initPositionSection`, `initHeroChartRange`, `initHeroChartInteraction`, `initCompareSection`, `initShareButton`, `initEarningsCalendar`, `initHistory`, `initSectionNav`, `initThemeManager`, `initInstallPrompt`, `initServiceWorker`).
- Depends on: the rendering layer (calls `render*()` after mutating state) and browser APIs (`localStorage`, `IntersectionObserver`, `matchMedia`, Web Share API, Service Worker API).
- Used by: `init()`, which calls every `init*()` function once, in a fixed order, after the first render pass.
- Purpose: make the static site installable and usable offline.
- Location: `manifest.json` (install metadata), `service-worker.js` (caching), `icons/` (app icons).
- Contains: a `CACHE_NAME`-versioned cache of the app shell (`index.html`, `styles.css`, `app.js`, fonts, icons) and a special network-first rule for `data.json` so live data is preferred whenever the network is reachable, falling back to the last cached copy offline.
- Depends on: nothing else in the app; it is registered defensively (`initServiceWorker()` in `app.js`, only over HTTPS or `localhost`).
- Used by: the browser's Service Worker runtime, transparently to the rest of the app.

## Data Flow

### Primary Request Path (page load)

### Data Curation Path (pipeline run, hourly)

- Frontend: plain top-level mutable `let`/`const` variables in `app.js` act as the single source of truth (`STOCKS`, `NEWS`, `SECTOR_SUMMARY`, `EARNINGS`, `ARCHIVE`, `favorites`, `costBasis`, `heroChartRange`, `compareTickers`, `sortState`, `calendarView`, `currentModalStock`). There is no framework-level reactivity — every state mutation is followed by an explicit call to the relevant `render*()` function.
- Pipeline: state is entirely file-based — `price_history.json`, `daily_ohlc.json`, and `summary_archive.json` act as on-disk caches/accumulators read and rewritten on every run, since GitHub Actions runners are ephemeral (see `.gitignore` comment).

## Key Abstractions

- Purpose: the single seam between the pipeline's on-disk schema and the shape every render function expects. Reshapes `news[].tickers[]` into a single `ticker`, maps pipeline sentiment strings (`positive`/`negative`/`neutral`) to UI sentiment classes (`up`/`down`/`mixed`) via `NEWS_SENTIMENT_MAP`, derives per-stock `sentiment` from `changePct` sign via `classifyBySign()`, and defaults every optional field so downstream render code never has to null-check pipeline output directly.
- Examples: called only from `loadData()`.
- Pattern: pure function, JSON-in/JSON-out, no side effects, no DOM access — makes it easy to reason about (and could be unit-tested in isolation, though no test suite currently exists).
- Purpose: a complete, self-consistent fallback dataset (stocks, news, sector summary, earnings, 5-day archive) hand-authored to look like real pipeline output, so the site is never a blank page — before the pipeline has ever run, or if `data.json` is ever missing/corrupt.
- Examples: `DEMO_STOCKS`, `DEMO_NEWS`, `DEMO_SECTOR_SUMMARY`, `DEMO_EARNINGS`, `DEMO_ARCHIVE`.
- Pattern: module-level constants assigned to the same `STOCKS`/`NEWS`/etc. variables that live data populates — the render layer is unaware of which source is active except via the separate `isLiveData` boolean (used only for the "DATOS EN VIVO" vs "DATOS DE DEMOSTRACIÓN" pill).
- Purpose: one function per visual section; each fully owns a `document.getElementById(...)`'s `innerHTML` and is always safe to call repeatedly (idempotent full replace, never incremental DOM patching).
- Examples: `renderHeroChart`, `renderSectorSummary`, `renderHeroMovers`, `renderHeroBreadth`, `renderStocks`, `renderHeatmap`, `renderStocksViews` (calls both table and heatmap renderers to keep them in sync), `renderCompareSection`, `renderNews`, `renderEarningsCalendar`, `renderHistory`, `renderLastUpdated`, `renderDataSourcePill`, `renderMarketStatus`, `renderTickerTape`.
- Pattern: build an HTML string (often via `Array.map().join("")`), assign it to `.innerHTML` in one shot. All untrusted text (news headlines/summaries/source, sourced externally) is passed through `escapeHtml()` first before interpolation.
- Purpose: the only top-level orchestration function; runs once at script load (`init()` call at the very bottom of the file, `app.js:2291`).
- Pattern: `await loadData()` first, then call every `render*()` function once (initial paint), then call every `init*()` function once (wires event listeners), then `hidePreloader()`. Order matters — render functions must run before init functions that expect DOM content to exist (e.g. `initStockModal` attaches a delegated click listener to `#stockGrid`, whose rows `renderStocksViews()` must have already produced).
- Purpose: never let one optional/fragile sub-fetch (the two newest and most format-fragile: `fetch_earnings_actuals`, `fetch_daily_batch`; also the LLM curation call and the archive update) prevent `data.json` from being written with whatever data *did* succeed.
- Pattern: each optional stage is wrapped in its own `try/except`, prints an "Aviso:" (warning) to stderr, and substitutes an empty/default value (`{}`, `[]`, or a `mixed`/empty sector summary) rather than raising. Only the required data (Finnhub prices, which the whole run needs) is allowed to `sys.exit()` on missing API keys.

## Entry Points

- Location: `index.html` loads `app.js` via `<script src="app.js">` (single, non-module script, no `defer`/`async` — runs top-to-bottom as the document parses, `init()` call is the last line).
- Triggers: any page load/navigation to the site (GitHub Pages serves `index.html` as the root document).
- Responsibilities: bootstraps data loading, first paint, and all interactivity in one call to `init()`.
- Location: `pipeline/fetch_and_curate.py`, invoked via `python3 fetch_and_curate.py` (its `if __name__ == "__main__": main()` guard).
- Triggers: GitHub Actions cron (`0 * * * *`, hourly) or manual `workflow_dispatch`/local run (see `.github/workflows/refresh-data.yml`, `pipeline/README.md`).
- Responsibilities: the entire external-data lifecycle — fetch, filter, curate, cache, and write `data.json`.
- Location: registered from `app.js` (`initServiceWorker()`), file lives at repo root so its scope covers the whole site.
- Triggers: `window.addEventListener("load", ...)` in `initServiceWorker()`, only when served over HTTPS or `localhost`.
- Responsibilities: caches the app shell on `install`, evicts stale cache versions on `activate` (cache name `ai-stocks-pulse-v36`, bumped manually on shell changes), and intercepts `fetch` events to serve `data.json` network-first / everything else cache-first.

## Architectural Constraints

- **Threading:** N/A for the frontend (single-threaded browser event loop, no Web Workers). The pipeline is single-threaded Python; parallelism is deliberately avoided in favor of simple, rate-limit-safe sequential loops with explicit `time.sleep()` pacing (`FINNHUB_PACING_SECONDS` = 1.1s; Alpha Vantage's daily batch sleeps 13s between requests to respect its 5 req/min cap).
- **Global state:** `app.js` is a single global scope (no ES modules, no IIFE wrapper) — every function and top-level `let`/`const` (`STOCKS`, `NEWS`, `favorites`, `costBasis`, `sortState`, `heroChartRange`, `compareTickers`, `calendarView`, `currentModalStock`, etc.) is a de facto global on `window`. This is deliberate given the no-build-step constraint, but means any new top-level identifier can silently collide with an existing one — grep `app.js` for a name before introducing it.
- **Rate limits as architecture:** the pipeline's fetch strategy is directly shaped by two hard external quotas — Finnhub free tier (60 calls/min, no daily cap) and Alpha Vantage free tier (25 requests/day, 5 requests/min). This is why OHLC candles and the earnings calendar are fetched once per day (`fetch_daily_batch()`, cached via a `_fetchedDate` marker in `daily_ohlc.json`) while everything else (prices, fundamentals, news, earnings actuals) runs every hour. Any change to which tickers get real OHLC data must respect the 23-ticker (`OHLC_TICKERS`) budget documented at `pipeline/fetch_and_curate.py:69-97`.
- **No circular imports:** the frontend has a single file with no imports at all; the pipeline is a single script with only third-party (`anthropic`) and stdlib imports — no internal module graph to go circular.
- **Ephemeral CI runners:** GitHub Actions checkouts are fresh every run, so `pipeline/price_history.json` and `pipeline/daily_ohlc.json` must be committed back to the repo (explicitly *not* gitignored — see `.gitignore` comment) or the rolling history/once-a-day cache would reset every hour.

## Anti-Patterns

### Treating `data.json`'s shape as optional to validate

### Reaching for a second accent color or a new UI primitive

## Error Handling

- Frontend: `try { ... } catch { ... }` around every `localStorage` read/write (private browsing / quota errors are non-fatal, just don't persist) and around the whole `loadData()` fetch/parse (falls back to `DEMO_*`).
- Pipeline: every external-API call is wrapped in `try/except Exception as exc`, logs an `Aviso:` (warning) to `stderr`, and returns a safe default (`None`, `{}`, `[]`) instead of propagating — except the four required Finnhub calls for API keys, which `sys.exit()` if the key env var is missing entirely (a real misconfiguration, not a transient failure).

## Cross-Cutting Concerns

<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
