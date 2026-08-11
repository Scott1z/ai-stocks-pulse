# Codebase Structure

**Analysis Date:** 2026-08-11

## Directory Layout

```
ai-stocks-pulse/
├── index.html                    # Page shell: markup for every section + both modals, CSP meta tag
├── app.js                        # Entire frontend logic — single file, ~2290 lines, no modules
├── styles.css                    # Design system — CSS custom properties, ~1900 lines
├── service-worker.js             # PWA offline cache (app shell + data.json)
├── manifest.json                 # PWA install manifest (name, icons, theme color)
├── data.json                     # Generated output of the pipeline — the only file app.js fetches
├── DESIGN.md                     # Design system spec (colors, typography, components, named rules)
├── PRODUCT.md                    # Product spec (platform, users, capabilities, security)
├── DEPLOY.md                     # Step-by-step GitHub Pages + Actions setup guide (Spanish)
├── COLOR-MIGRATION.md            # Historical note on a palette migration
├── .gitignore                    # Excludes pipeline/.env, Python venv/cache; explicitly KEEPS
│                                  #   price_history.json / daily_ohlc.json (see comment inside)
├── fonts/                        # Self-hosted Montserrat (Regular/Medium/SemiBold/Bold, .woff2)
├── icons/                        # PWA icons (icon.svg, icon-maskable.svg)
├── images/                       # Static images (og-image.png for social previews)
├── pipeline/                     # Python data pipeline — everything backend-adjacent lives here
│   ├── fetch_and_curate.py       #   The entire pipeline: fetch, curate, write data.json (~750 lines)
│   ├── README.md                 #   Pipeline-specific docs (Spanish) — schedule, rate limits, setup
│   ├── requirements.txt          #   Python deps (anthropic, pinned range)
│   ├── .env.example              #   Template for local API keys (never commit the real .env)
│   ├── price_history.json        #   Rolling per-ticker price window (state, committed to repo)
│   ├── daily_ohlc.json           #   Once-a-day OHLC cache + _fetchedDate/_earningsCalendar markers
│   └── summary_archive.json      #   Rolling 30-day sector-summary archive (state, committed to repo)
├── .github/
│   └── workflows/
│       └── refresh-data.yml      # Hourly cron: runs the pipeline, commits+pushes data files
├── .impeccable/
│   └── design.json               # Machine-readable design-token sidecar (colors/typography/components)
│                                  #   mirrors the frontmatter block at the top of DESIGN.md
└── .claude/
    └── launch.json                # Local dev-server launch config (python3 -m http.server 8123)
```

## Directory Purposes

**Repo root:**
- Purpose: the entire deployable static site — everything GitHub Pages serves lives at the root (no `dist/`, `public/`, or `src/` subdirectory; the repo root *is* the web root).
- Contains: `index.html`, `app.js`, `styles.css`, `service-worker.js`, `manifest.json`, `data.json`, plus the project's Markdown docs.
- Key files: `index.html` (entry document), `app.js` (all logic), `data.json` (all content).

**`pipeline/`:**
- Purpose: everything that talks to external APIs or an LLM lives here, fully isolated from the frontend. Nothing in this directory is served to visitors — only its output (`../data.json`) is.
- Contains: the one Python script, its `requirements.txt`, its own README, an `.env.example` template, and three JSON files that act as the pipeline's *own* persistent state (not consumed by the frontend directly except via `data.json`, which embeds `daily_ohlc.json`'s candle data and `summary_archive.json`'s history into its `stocks[].ohlc` and `archive` fields).
- Key files: `pipeline/fetch_and_curate.py` (everything), `pipeline/README.md` (rate-limit rationale, setup, ticker-list guidance).

**`fonts/`:**
- Purpose: self-hosted Montserrat so the PWA works fully offline and doesn't depend on a third-party font CDN at runtime.
- Contains: four `.woff2` weights (Regular, Medium, SemiBold, Bold) + the license file. Preloaded in `index.html`'s `<head>` and listed in `service-worker.js`'s `CORE_ASSETS` cache list.

**`icons/`:**
- Purpose: PWA/app icons.
- Contains: `icon.svg` (standard, referenced by `manifest.json` and `<link rel="icon">`), `icon-maskable.svg` (Android adaptive-icon safe zone, `purpose: "maskable"` in `manifest.json`).

**`images/`:**
- Purpose: static assets not needed for the app shell itself (not in the service worker's cache list).
- Contains: `og-image.png`, referenced by Open Graph/Twitter card `<meta>` tags in `index.html` for social link previews.

**`.github/workflows/`:**
- Purpose: the only "backend" the project has — a scheduled CI job that IS the pipeline's runtime.
- Contains: `refresh-data.yml` — hourly cron (`0 * * * *`) + manual `workflow_dispatch`, installs `pipeline/requirements.txt`, runs `python3 pipeline/fetch_and_curate.py` with the three API keys as env vars from GitHub Actions secrets, then commits and pushes `data.json` + the three pipeline JSON cache files.

**`.impeccable/`:**
- Purpose: a machine-readable sidecar mirroring `DESIGN.md`'s frontmatter (colors/typography/rounded/components) — a design-token source of truth alongside the human-readable spec. Not consumed by the running app (nothing in `app.js` or `index.html` references it); treat `DESIGN.md` as authoritative for design decisions and keep this file in sync if colors/components change there.

**`.claude/`:**
- Purpose: local Claude Code tooling config, not part of the shipped app.
- Contains: `launch.json` — a local dev-server launch config (`python3 -m http.server 8123`), used because the site has no build step and can be served as plain static files.

## Key File Locations

**Entry Points:**
- `index.html`: the document GitHub Pages serves at `/`. Loads `styles.css`, then the body/sections/modals, then `app.js` as the last element before `</body>`.
- `pipeline/fetch_and_curate.py`: pipeline entry point, `main()` at the bottom (`if __name__ == "__main__": main()`).

**Configuration:**
- `manifest.json`: PWA identity (name, icons, colors, `start_url`).
- `.github/workflows/refresh-data.yml`: the pipeline's schedule and CI environment.
- `pipeline/.env.example` / `pipeline/README.md`: local pipeline setup (API keys, cron).
- `index.html` `<meta http-equiv="Content-Security-Policy">` (line 12): the site's only security-header mechanism (GitHub Pages can't set custom HTTP headers, so CSP lives in a `<meta>` tag).

**Core Logic:**
- `app.js`: 100% of frontend behavior — data loading (`loadData`/`normalizeRealData`), rendering (`render*()`/`build*()`), and interaction wiring (`init*()`).
- `pipeline/fetch_and_curate.py`: 100% of backend/data behavior — external fetches, LLM curation, cache management, `data.json` assembly.

**Testing:**
- None present. No test framework, test files, or CI test step exist in this repo (see TESTING.md if generated separately, or note the gap in CONCERNS.md).

## Naming Conventions

**Files:**
- Root-level docs use UPPERCASE.md (`DESIGN.md`, `PRODUCT.md`, `DEPLOY.md`, `COLOR-MIGRATION.md`) — project-level specs, not code.
- Pipeline state/cache files are `snake_case.json` (`price_history.json`, `daily_ohlc.json`, `summary_archive.json`), matching Python convention; the frontend-facing output is `data.json` (flat, no prefix) since it's a public, generic artifact name.
- No file-per-component convention exists — both `app.js` and `styles.css` are monoliths by design (no build step to bundle multiple files).

**JavaScript (`app.js`) function naming — enforced by convention, not tooling:**
- `render*()` — always fully replaces one DOM subtree's `innerHTML`; safe to call repeatedly; named after the section it owns (`renderStocks`, `renderNews`, `renderHeroChart`, `renderHistory`, `renderTickerTape`, `renderMarketStatus`, `renderDataSourcePill`). When adding a new page section, add a `render<SectionName>()` function following this pattern and call it once from `init()`.
- `init*()` — always attaches event listeners exactly once; never re-run; named after the feature area it wires up (`initFilters`, `initLedgerSort`, `initStockModal`, `initThemeManager`, `initServiceWorker`). When adding new interactivity, add an `init<FeatureName>()` function and call it once from `init()`, after the corresponding `render*()` call if it depends on rendered DOM existing.
- `build*()` — pure functions that return an HTML/SVG string but do NOT touch the DOM directly; called from inside a `render*()` function (`buildSparkline`, `buildCompositeChart`, `buildCandlestickChart`, `buildFundamentalsGrid`, `buildShareCanvas`). Use this pattern for any new chart/markup fragment that's reused across more than one `render*()` call site.
- `DEMO_*` — SCREAMING_SNAKE_CASE constants holding hardcoded fallback content, one per data category (`DEMO_STOCKS`, `DEMO_NEWS`, `DEMO_SECTOR_SUMMARY`, `DEMO_EARNINGS`, `DEMO_ARCHIVE`). Any new data category loaded from `data.json` should get a matching `DEMO_<CATEGORY>` fallback constant plus a branch in `normalizeRealData()` and the `loadData()` catch block.
- `*_KEY` — SCREAMING_SNAKE_CASE constants naming a `localStorage` key (`FAVORITES_KEY`, `COST_BASIS_KEY`, `THEME_KEY`), always prefixed `aisp_` in the actual string value (e.g. `"aisp_favorites"`) to namespace against other sites sharing the same origin/browser profile.
- Plain camelCase for everything else — helper functions (`escapeHtml`, `classifyBySign`, `formatMarketCap`, `hostnameFromUrl`), event handlers, and local variables.

**Python (`pipeline/fetch_and_curate.py`) naming:**
- `snake_case` functions grouped by external source, one `fetch_*()` per API endpoint (`fetch_finnhub_news`, `fetch_prices`, `fetch_fundamentals`, `fetch_earnings_actuals`, `fetch_earnings_calendar`, `fetch_daily_batch`).
- `update_*()` for functions that read-modify-write a local cache file (`update_price_history`, `update_summary_archive`).
- `SCREAMING_SNAKE_CASE` for module-level config constants (`AI_TICKERS`, `OHLC_TICKERS`, `TICKER_NAMES`, `MAX_CANDIDATES`, `HISTORY_POINTS`, `FINNHUB_PACING_SECONDS`, `OHLC_DAYS_KEPT`, `ARCHIVE_DAYS_KEPT`, `SYSTEM_PROMPT`).
- Comments are written in Spanish throughout the pipeline and in large parts of `app.js` (the site's own UI copy is Spanish/`es-AR`); keep new comments in the same language as the surrounding block rather than mixing.

**CSS custom properties (`styles.css`, `:root` block, lines 47-94, overridden in `:root[data-theme="dark"]`, lines 110-131):**
- Surface tokens: `--paper` (page background), `--panel` (card/panel surface), `--panel-raised` (hover tint).
- Border tokens: `--line` (default hairline), `--line-strong` (structural border).
- Text tokens: `--text`, `--text-dim`, `--text-faint` (3-step hierarchy, darkest to lightest importance).
- Brand token: `--accent` (the single navy accent — see `DESIGN.md`'s "One Accent Rule"), `--accent-dim` (its ~8-10% opacity tint for badges/highlights).
- Semantic triad (never reuses `--accent`): `--rise` / `--rise-dim` (price up, bullish), `--fall` / `--fall-dim` (price down, bearish), `--mixed` / `--mixed-dim` (neutral/mixed sentiment).
- Icon-only tertiary tokens (deliberate One-Accent-Rule exception, icons only, never text/badges/borders): `--icon-teal`, `--icon-indigo`.
- Shape tokens: `--radius-pill` (999px, anything clickable/status), `--radius-sm` (4px, anything structural/content-holding) — see `DESIGN.md`'s "Two-Radius Rule": no third radius value should be introduced.
- Layout tokens: `--maxw` (1180px content width), `--ledger-cols` (the stock table's shared 5-column grid template, defined in a second `:root` block near the ledger styles at line 1150).
- Font tokens: `--font-prose`, `--font-data` — both resolve to the same Montserrat stack (kept as two variables only so existing rules referencing either name don't need touching; do not diverge them without reading `DESIGN.md`'s "One-Font Rule").
- Pattern for adding a new token: add it to both the light `:root` block and the dark `:root[data-theme="dark"]` override block, even if the value doesn't change between themes, so the dark-mode block stays a complete, self-contained palette (per `DESIGN.md`'s "Dark Mode" section, every color already routes through a custom property — there is no hardcoded hex outside the `:root` blocks).

**HTML `id`/section naming (`index.html`):**
- Section anchors match the Spanish nav labels (`#inicio`, `#empresas`, `#comparar`, `#noticias`, `#calendario`, `#historial`), each with a matching `id="...List"` / `id="...Grid"` container that the corresponding `render*()` function targets via `document.getElementById(...)` (e.g. `#stockGrid` ↔ `renderStocks()`, `#newsList` ↔ `renderNews()`, `#earningsList` ↔ `renderEarningsCalendar()`).

## Where to Add New Code

**New page section (e.g. a new data category from the pipeline):**
- Markup: add a new `<section>` in `index.html` with an `id`, matching containers for its content, and a nav link if it should appear in the topbar.
- Pipeline: add a new `fetch_*()`/`update_*()` function in `pipeline/fetch_and_curate.py`, wire it into `main()` (wrapped in `try/except` if it's optional/fragile, following the existing pattern at lines 728-737), and add the new field to the `data` dict written at the end of `main()`.
- Frontend data layer: add a `DEMO_<CATEGORY>` fallback constant near the top of `app.js`, a corresponding branch inside `normalizeRealData()`, and reset logic in `loadData()`'s `catch` block.
- Frontend rendering: add a `render<CATEGORY>()` function, call it once from `init()` (after `loadData()`), and follow the existing "hide the section if empty, never fall back to demo data under a live badge" pattern documented in `DESIGN.md` for optional sections (Historial, Calendario).
- Design: check `DESIGN.md`'s Components section first for an existing pattern (Stat Block, Ledger Row, hairline-row list, etc.) to reuse before styling anything new.

**New chart/visualization:**
- Add a `build<ChartName>Chart()` pure function near the existing chart builders (`buildSparkline`, `buildCompositeChart`, `buildCandlestickChart`, `buildStockDetailChart`, `buildCompareChart` — all colocated around `app.js:484-940`), reusing `smoothPath()` for any curved line and the existing `--rise`/`--fall` color tokens rather than introducing new hues.

**New localStorage-backed feature:**
- Add a `*_KEY` constant (`"aisp_<name>"` string value), a `try/catch`-wrapped read on load and write on mutation (follow `toggleFavorite`/`setPosition`/`applyTheme` as templates), and never assume `localStorage` is available — always degrade to "doesn't persist this session" rather than throwing.

**New external API integration in the pipeline:**
- Add a `fetch_<source>_<data>()` function near the other fetchers, respect that function's API's rate limit explicitly (pacing constant + `time.sleep()`, following `FINNHUB_PACING_SECONDS`/Alpha Vantage's 13s pacing as examples), wrap the call site in `main()` with `try/except` if it's not critical-path, and document the new API key requirement in `pipeline/.env.example`, `pipeline/README.md`, and `.github/workflows/refresh-data.yml`'s `env:` block.

**Utilities:**
- Shared small pure helpers live inline near their first use in `app.js` (e.g. `escapeHtml`, `isSafeHttpUrl`, `hostnameFromUrl` near the data-loading section; `formatShortDate`, `formatEarningsMonth` near the chart/calendar code) — there is no separate `utils.js`; given the no-build-step, single-file constraint, keep new helpers colocated with their primary caller rather than extracting a new file.

## Special Directories

**`pipeline/`:**
- Purpose: isolates all external-API/LLM/secret-key logic from the publicly served frontend.
- Generated: partially — `price_history.json`, `daily_ohlc.json`, `summary_archive.json` are regenerated every pipeline run.
- Committed: yes, all three JSON state files are intentionally committed (see `.gitignore`'s explanatory comment) because GitHub Actions runners are ephemeral and need the accumulated history on the next checkout.

**`.impeccable/`:**
- Purpose: machine-readable design-token mirror of `DESIGN.md`'s frontmatter.
- Generated: appears hand-maintained alongside `DESIGN.md`, not build-generated.
- Committed: yes.

**`.claude/`:**
- Purpose: local Claude Code tooling (dev server launch config).
- Generated: no.
- Committed: yes (small, no secrets).

**`data.json` (repo root):**
- Purpose: the pipeline's sole output artifact and the frontend's sole input artifact.
- Generated: yes, entirely — overwritten on every pipeline run (hourly).
- Committed: yes, by the GitHub Actions workflow (`git add data.json ...` in `refresh-data.yml`) — this is the mechanism by which GitHub Pages serves fresh data without any server.

---

*Structure analysis: 2026-08-11*
