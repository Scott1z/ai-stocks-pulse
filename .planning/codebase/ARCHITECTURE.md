<!-- refreshed: 2026-08-11 -->
# Architecture

**Analysis Date:** 2026-08-11

## System Overview

There is no backend, no server-side rendering, and no database. "AI QuickCap" is two independent halves that only communicate through one file, `data.json`, committed to the repo:

```text
┌───────────────────────────────────────────────────────────────────────┐
│  OFFLINE BATCH PIPELINE (Python, runs hourly via GitHub Actions cron)  │
│  `pipeline/fetch_and_curate.py`                                        │
│                                                                          │
│  Finnhub (news, quotes,      Alpha Vantage (OHLC candles,               │
│  fundamentals, earnings      earnings calendar — once/day,              │
│  actuals — every hour)       23/50 tickers)                             │
│         │                              │                                │
│         ▼                              ▼                                │
│  ┌─────────────────────────────────────────────────────┐               │
│  │  pre_filter() → curate_with_claude() (Anthropic API,  │               │
│  │  1 cached call/run: news curation + sector narrative) │               │
│  └─────────────────────────────────────────────────────┘               │
│         │                                                                │
│         ▼                                                                │
│  build_stocks() + update_price_history() + update_summary_archive()     │
│         │                                                                │
│         ▼                                                                │
│  writes `data.json` (repo root) + `pipeline/price_history.json` +       │
│  `pipeline/daily_ohlc.json` + `pipeline/summary_archive.json`,          │
│  commits + pushes back to the repo (`.github/workflows/refresh-data.yml`)│
└───────────────────────────────────────────────────────────────────────┘
                                    │
                    (GitHub Pages serves the static repo)
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────────────┐
│  STATIC FRONTEND (vanilla HTML/CSS/JS PWA, no build step, no framework) │
│                                                                          │
│  `index.html` (shell + markup)                                         │
│  `app.js` — single file: loadData() → normalizeRealData() →            │
│              render*() functions → DOM                                 │
│  `styles.css` — CSS-custom-property design system, light/dark themes   │
│  `service-worker.js` — offline cache (network-first for data.json,     │
│              cache-first for the app shell)                            │
└───────────────────────────────────────────────────────────────────────┘
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

**Overall:** Static site + offline batch pipeline. No backend, no database, no server-side rendering, no client-side router (single-page document with anchor-scroll sections). The frontend is a "dumb" renderer over one JSON snapshot; all intelligence (fetching, filtering, LLM curation) happens offline in the pipeline, on a schedule, decoupled from any page view.

**Key Characteristics:**
- Zero build step for the frontend — `app.js` is loaded as a single `<script src="app.js">`, no bundler, no npm dependency for the site itself.
- Zero LLM calls at view time — the public page's serving cost never scales with traffic (see `PRODUCT.md` Positioning).
- One-way data flow: pipeline → `data.json` → `fetch()` → normalize → module-level mutable state (`STOCKS`, `NEWS`, etc.) → render functions → DOM. There is no state-management library; render functions read directly from top-level `let` variables.
- Graceful degradation is a first-class design rule, not an afterthought: every optional data feature (OHLC candles, earnings calendar, last-earnings badge, history archive) has an explicit "not available yet" rendering path rather than crashing or hiding silently.

## Layers

**Pipeline layer (`pipeline/fetch_and_curate.py`):**
- Purpose: fetch external market/news data, curate with an LLM, and produce the single artifact the frontend consumes.
- Location: `pipeline/`
- Contains: fetch functions per external API, local caching helpers (`update_price_history`, `fetch_daily_batch`), the LLM curation call, and `main()` orchestration.
- Depends on: Finnhub, Alpha Vantage, and Anthropic APIs (via env vars `FINNHUB_API_KEY`, `ALPHAVANTAGE_API_KEY`, `ANTHROPIC_API_KEY`); local cache files (`price_history.json`, `daily_ohlc.json`, `summary_archive.json`).
- Used by: nothing in-process — it is invoked by GitHub Actions on a cron, or by hand for local testing (`pipeline/README.md`). It has no runtime relationship to the frontend beyond the `data.json` file it writes.

**Data-loading layer (`app.js`, lines 247-417):**
- Purpose: fetch `data.json`, validate/normalize its shape, and populate module-level state; fall back to demo constants on any failure.
- Location: `app.js`
- Contains: `loadData()`, `normalizeRealData()`, small pure helpers (`classifyBySign`, `hostnameFromUrl`, `isSafeHttpUrl`, `escapeHtml`, `relativeTime`, `findBlurbForTicker`).
- Depends on: the `fetch()` API, `data.json`'s documented shape (schema comment at `app.js:250-265`).
- Used by: `init()`, which awaits `loadData()` before calling any `render*()` function.

**Rendering layer (`app.js`, ~lines 420-1900):**
- Purpose: turn in-memory state into markup/SVG/canvas output. No layer below this touches the network; no layer above this owns state.
- Location: `app.js`
- Contains: `render*()` functions (one per page section: hero chart, sector summary, hero movers, breadth bar, stock ledger, heatmap, compare chart, news list, earnings calendar, history archive, ticker tape, market-status pill, data-source pill), and `build*()` helpers that return HTML/SVG strings consumed by the `render*()` functions (`buildSparkline`, `buildCompositeChart`, `buildCandlestickChart`, `buildStockDetailChart`, `buildFundamentalsGrid`, `buildShareCanvas`).
- Depends on: module-level state (`STOCKS`, `NEWS`, `SECTOR_SUMMARY`, `EARNINGS`, `ARCHIVE`, `favorites`, `costBasis`) and DOM element IDs defined in `index.html`.
- Used by: `init()` (initial paint) and the interaction layer (re-render on filter/sort/search/toggle changes).

**Interaction layer (`app.js`, ~lines 1900-2290):**
- Purpose: attach event listeners once per feature area and call the matching `render*()` function on state changes (filter clicks, sort clicks, search input, modal open/close, theme toggle, install prompt, service worker registration).
- Location: `app.js`
- Contains: `init*()` functions, one per feature (`initFilters`, `initLedgerSort`, `initStocksViewToggle`, `initNewsModal`, `initStockModal`, `initPositionSection`, `initHeroChartRange`, `initHeroChartInteraction`, `initCompareSection`, `initShareButton`, `initEarningsCalendar`, `initHistory`, `initSectionNav`, `initThemeManager`, `initInstallPrompt`, `initServiceWorker`).
- Depends on: the rendering layer (calls `render*()` after mutating state) and browser APIs (`localStorage`, `IntersectionObserver`, `matchMedia`, Web Share API, Service Worker API).
- Used by: `init()`, which calls every `init*()` function once, in a fixed order, after the first render pass.

**PWA/offline layer:**
- Purpose: make the static site installable and usable offline.
- Location: `manifest.json` (install metadata), `service-worker.js` (caching), `icons/` (app icons).
- Contains: a `CACHE_NAME`-versioned cache of the app shell (`index.html`, `styles.css`, `app.js`, fonts, icons) and a special network-first rule for `data.json` so live data is preferred whenever the network is reachable, falling back to the last cached copy offline.
- Depends on: nothing else in the app; it is registered defensively (`initServiceWorker()` in `app.js`, only over HTTPS or `localhost`).
- Used by: the browser's Service Worker runtime, transparently to the rest of the app.

## Data Flow

### Primary Request Path (page load)

1. Browser requests `index.html`; the CSP `<meta>` tag (`index.html:12`) restricts scripts to `'self'` — no inline scripts anywhere on the page.
2. `app.js` loads and immediately calls `init()` (`app.js:2291`).
3. `init()` calls `await loadData()` (`app.js:387-417`), which does `fetch("data.json", { cache: "no-store" })`.
4. On success, `normalizeRealData(json)` (`app.js:320-385`) reshapes the pipeline's JSON into the exact fields the render functions expect (news sentiment mapping, relative time strings, sparkline padding, sector-stat formatting) and sets `isLiveData = true`.
5. On any failure (missing file, bad JSON, empty `stocks` array), the `catch` block resets `STOCKS`/`NEWS`/`SECTOR_SUMMARY`/`EARNINGS`/`ARCHIVE` to the `DEMO_*` constants and sets `isLiveData = false` — the page always renders something.
6. `init()` then calls every `render*()` function once (hero chart, sector summary, movers, breadth, stock views, compare section, news, earnings calendar, history, last-updated label, data-source pill, ticker tape, market status).
7. `init()` calls every `init*()` function to wire up interactivity, then `hidePreloader()` removes the loading overlay.

### Data Curation Path (pipeline run, hourly)

1. `fetch_finnhub_news()` pulls general market news (1 request); `pre_filter()` keeps only articles mentioning a tracked ticker/company name, scores by mention count, and truncates to `MAX_CANDIDATES` (15).
2. `fetch_prices()`, `fetch_fundamentals()`, `fetch_earnings_actuals()` each loop over all 50 `AI_TICKERS`, one Finnhub request per ticker, paced by `FINNHUB_PACING_SECONDS` (1.1s) to stay under 60 calls/min.
3. `update_price_history()` appends the latest price per ticker to a rolling window in `pipeline/price_history.json` (used for sparkline fallback and the "Hoy" composite-chart range).
4. `fetch_daily_batch()` — the once-a-day path (see below) — returns real OHLC candles (23 tickers) and the earnings calendar (all 50 tickers), served from `pipeline/daily_ohlc.json`'s cache on the 23 hourly runs that aren't the daily run.
5. `curate_with_claude()` sends the top news candidates + per-ticker `changePct` to Claude in a single prompt-cached call; the model returns curated headlines (in Spanish) plus a sector-wide sentiment + narrative summary in one JSON response.
6. `attach_source_meta()` re-attaches `source`/`published_at` locally by URL lookup (keeps LLM output small).
7. `update_summary_archive()` upserts today's UTC-dated entry in `pipeline/summary_archive.json`, trimmed to the last `ARCHIVE_DAYS_KEPT` (30) days.
8. `main()` assembles the final `data` dict and writes it to `data.json` at the repo root — the only file the frontend ever reads.
9. The GitHub Actions workflow (`.github/workflows/refresh-data.yml`) commits and pushes `data.json` + the three pipeline cache files back to the repo; GitHub Pages then serves the updated static files.

**State Management:**
- Frontend: plain top-level mutable `let`/`const` variables in `app.js` act as the single source of truth (`STOCKS`, `NEWS`, `SECTOR_SUMMARY`, `EARNINGS`, `ARCHIVE`, `favorites`, `costBasis`, `heroChartRange`, `compareTickers`, `sortState`, `calendarView`, `currentModalStock`). There is no framework-level reactivity — every state mutation is followed by an explicit call to the relevant `render*()` function.
- Pipeline: state is entirely file-based — `price_history.json`, `daily_ohlc.json`, and `summary_archive.json` act as on-disk caches/accumulators read and rewritten on every run, since GitHub Actions runners are ephemeral (see `.gitignore` comment).

## Key Abstractions

**`normalizeRealData(json)` (`app.js:320-385`):**
- Purpose: the single seam between the pipeline's on-disk schema and the shape every render function expects. Reshapes `news[].tickers[]` into a single `ticker`, maps pipeline sentiment strings (`positive`/`negative`/`neutral`) to UI sentiment classes (`up`/`down`/`mixed`) via `NEWS_SENTIMENT_MAP`, derives per-stock `sentiment` from `changePct` sign via `classifyBySign()`, and defaults every optional field so downstream render code never has to null-check pipeline output directly.
- Examples: called only from `loadData()`.
- Pattern: pure function, JSON-in/JSON-out, no side effects, no DOM access — makes it easy to reason about (and could be unit-tested in isolation, though no test suite currently exists).

**`DEMO_*` constants (`app.js:8-181`):**
- Purpose: a complete, self-consistent fallback dataset (stocks, news, sector summary, earnings, 5-day archive) hand-authored to look like real pipeline output, so the site is never a blank page — before the pipeline has ever run, or if `data.json` is ever missing/corrupt.
- Examples: `DEMO_STOCKS`, `DEMO_NEWS`, `DEMO_SECTOR_SUMMARY`, `DEMO_EARNINGS`, `DEMO_ARCHIVE`.
- Pattern: module-level constants assigned to the same `STOCKS`/`NEWS`/etc. variables that live data populates — the render layer is unaware of which source is active except via the separate `isLiveData` boolean (used only for the "DATOS EN VIVO" vs "DATOS DE DEMOSTRACIÓN" pill).

**`render*()` functions:**
- Purpose: one function per visual section; each fully owns a `document.getElementById(...)`'s `innerHTML` and is always safe to call repeatedly (idempotent full replace, never incremental DOM patching).
- Examples: `renderHeroChart`, `renderSectorSummary`, `renderHeroMovers`, `renderHeroBreadth`, `renderStocks`, `renderHeatmap`, `renderStocksViews` (calls both table and heatmap renderers to keep them in sync), `renderCompareSection`, `renderNews`, `renderEarningsCalendar`, `renderHistory`, `renderLastUpdated`, `renderDataSourcePill`, `renderMarketStatus`, `renderTickerTape`.
- Pattern: build an HTML string (often via `Array.map().join("")`), assign it to `.innerHTML` in one shot. All untrusted text (news headlines/summaries/source, sourced externally) is passed through `escapeHtml()` first before interpolation.

**`init()` as single entry point (`app.js:2255-2291`):**
- Purpose: the only top-level orchestration function; runs once at script load (`init()` call at the very bottom of the file, `app.js:2291`).
- Pattern: `await loadData()` first, then call every `render*()` function once (initial paint), then call every `init*()` function once (wires event listeners), then `hidePreloader()`. Order matters — render functions must run before init functions that expect DOM content to exist (e.g. `initStockModal` attaches a delegated click listener to `#stockGrid`, whose rows `renderStocksViews()` must have already produced).

**Pipeline resilience pattern (`pipeline/fetch_and_curate.py`, `main()` lines 716-772):**
- Purpose: never let one optional/fragile sub-fetch (the two newest and most format-fragile: `fetch_earnings_actuals`, `fetch_daily_batch`; also the LLM curation call and the archive update) prevent `data.json` from being written with whatever data *did* succeed.
- Pattern: each optional stage is wrapped in its own `try/except`, prints an "Aviso:" (warning) to stderr, and substitutes an empty/default value (`{}`, `[]`, or a `mixed`/empty sector summary) rather than raising. Only the required data (Finnhub prices, which the whole run needs) is allowed to `sys.exit()` on missing API keys.

## Entry Points

**Frontend (`index.html` + `app.js`):**
- Location: `index.html` loads `app.js` via `<script src="app.js">` (single, non-module script, no `defer`/`async` — runs top-to-bottom as the document parses, `init()` call is the last line).
- Triggers: any page load/navigation to the site (GitHub Pages serves `index.html` as the root document).
- Responsibilities: bootstraps data loading, first paint, and all interactivity in one call to `init()`.

**Pipeline (`pipeline/fetch_and_curate.py`):**
- Location: `pipeline/fetch_and_curate.py`, invoked via `python3 fetch_and_curate.py` (its `if __name__ == "__main__": main()` guard).
- Triggers: GitHub Actions cron (`0 * * * *`, hourly) or manual `workflow_dispatch`/local run (see `.github/workflows/refresh-data.yml`, `pipeline/README.md`).
- Responsibilities: the entire external-data lifecycle — fetch, filter, curate, cache, and write `data.json`.

**Service Worker (`service-worker.js`):**
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

**What happens:** `normalizeRealData()` defaults almost every field (`n.summary || ""`, `s.fundamentals || {}`, `Array.isArray(s.ohlc) ? s.ohlc : []`) rather than assuming the pipeline's output is well-formed.
**Why it's wrong:** it isn't actually wrong here — it's the deliberate, correct pattern given the pipeline's own resilience strategy (partial failures write partial data). Listed here as a constraint for future contributors: never assume a field in `data.json` is present just because the pipeline "usually" fills it in; every consumer of pipeline data must degrade honestly (see `DESIGN.md`'s repeated "N/D" pattern) rather than crash.
**Do this instead:** when adding a new pipeline field, add both the default-safe read in `normalizeRealData()` and an explicit "N/D"/hidden-state UI treatment, following the existing fundamentals-grid and last-earnings-badge examples (`app.js:456-482`, `app.js:1699-1723`).

### Reaching for a second accent color or a new UI primitive

**What happens:** `DESIGN.md`'s "One Accent Rule" and "Two-Radius Rule" are enforced by convention, not by tooling (no CSS linter enforces them).
**Why it's wrong:** since there's no build-time check, a new component that introduces a third border-radius or a new hue will pass code review only if a human catches it against `DESIGN.md`.
**Do this instead:** before adding a new visual component, check `DESIGN.md`'s "Components" and "Do's and Don'ts" sections for an existing pattern to reuse (pill vs. 4px radius, hairline vs. shadow, existing `--rise`/`--fall`/`--mixed`/`--accent` tokens) rather than inventing new CSS custom properties.

## Error Handling

**Strategy:** fail into a documented, honest fallback state at every layer rather than throwing an unhandled error to the user — "N/D" for missing fundamentals, hidden sections for empty optional data (earnings calendar, history archive), demo data for a missing/invalid `data.json`, and per-fetch `try/except` in the pipeline so one API's outage never blocks the rest of the run.

**Patterns:**
- Frontend: `try { ... } catch { ... }` around every `localStorage` read/write (private browsing / quota errors are non-fatal, just don't persist) and around the whole `loadData()` fetch/parse (falls back to `DEMO_*`).
- Pipeline: every external-API call is wrapped in `try/except Exception as exc`, logs an `Aviso:` (warning) to `stderr`, and returns a safe default (`None`, `{}`, `[]`) instead of propagating — except the four required Finnhub calls for API keys, which `sys.exit()` if the key env var is missing entirely (a real misconfiguration, not a transient failure).

## Cross-Cutting Concerns

**Logging:** Frontend has no logging framework — errors are silently absorbed (see Error Handling). Pipeline prints `Aviso:`-prefixed warnings to `stderr` for every recoverable failure and a final summary line to `stdout` (`OK — N precios, N noticias, ...`), which GitHub Actions captures in the workflow run log.

**Validation:** No schema validation library on either side. The pipeline shapes its own output by construction (Python dict literals matching the documented shape in `app.js`'s comment block). The frontend validates only loosely — `normalizeRealData()` defaults missing fields, and `loadData()` throws if `stocks` ends up empty after filtering out `null`-price entries, triggering the demo-data fallback.

**Authentication:** None on the frontend (no accounts, no login — see `PRODUCT.md`). The pipeline authenticates to three external APIs via env-var API keys (`ALPHAVANTAGE_API_KEY`, `FINNHUB_API_KEY`, `ANTHROPIC_API_KEY`), injected as GitHub Actions secrets in CI and never present in any file committed to the repo (`pipeline/.env.example` is a template only; `pipeline/.env` is gitignored).

**Security (frontend-specific):** a `<meta>`-based CSP (`index.html:12`) with `script-src 'self'` (no inline scripts anywhere), all externally-sourced text (news headlines/summaries) passed through `escapeHtml()` before `innerHTML` insertion, and `source_url` scheme-checked via `isSafeHttpUrl()` before being used as a link `href` — see `PRODUCT.md`'s Security section for the full rationale.

---

*Architecture analysis: 2026-08-11*
