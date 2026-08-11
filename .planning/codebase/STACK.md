# Technology Stack

**Analysis Date:** 2026-08-11

## Overview

This repository is really **two separate stacks glued together by one file**: `data.json`.

1. **Frontend** — a static, vanilla HTML/CSS/JS Progressive Web App with **zero JS dependencies, zero bundler, and no `package.json` at all**. It is served as-is by GitHub Pages.
2. **Pipeline** — a single Python script (`pipeline/fetch_and_curate.py`) with one third-party dependency (the `anthropic` SDK), run on a schedule by GitHub Actions, that fetches market data, curates it with Claude, and writes `data.json` to the repo root.

The frontend never talks to Finnhub, Alpha Vantage, or Anthropic directly — it only ever does `fetch("data.json")` (`app.js:389`). All external API calls live exclusively in the Python pipeline.

## Languages

**Frontend:**
- HTML5 — `index.html` (245 lines), single page, Spanish (`lang="es"`)
- CSS3 — `styles.css` (1905 lines), no preprocessor (no Sass/Less/PostCSS), hand-written custom properties for the design system
- JavaScript (ES2020+, vanilla, no TypeScript) — `app.js` (2290 lines) + `service-worker.js` (67 lines)

**Pipeline:**
- Python 3.12 (pinned in `.github/workflows/refresh-data.yml:36` via `actions/setup-python@v5`) — `pipeline/fetch_and_curate.py` (797 lines)
- Script comments/docstrings are written in Spanish; the Claude system prompt is in Spanish and instructs the model to always output Spanish text regardless of source article language

## Runtime

**Frontend:**
- No runtime — plain static files interpreted directly by the browser. No Node.js is involved in building or serving the frontend.
- No `package.json`, no `node_modules`, no npm/yarn/pnpm lockfile anywhere in the repo. This is a deliberate architectural choice, not an oversight: there is no JS build step, no transpilation, no bundling, and no dependency-management surface for the frontend. Any new frontend code must run as-is in the browser (no import of npm packages, no JSX, no framework runtime).
- Browser APIs used directly: `fetch`, `localStorage` (`app.js:192-243`, favorites and cost-basis tracking — explicitly local-only, "nunca se manda a ningún servidor"), Service Worker / Cache API (`service-worker.js`), inline SVG generation for charts (candlestick/sparkline/composite charts built by hand in `app.js`, no charting library).

**Pipeline:**
- CPython 3.12, executed either by GitHub Actions runners (`ubuntu-latest`) or manually via a local virtualenv (`pipeline/README.md`).
- Package manager: `pip`, dependency pinned in `pipeline/requirements.txt`. No lockfile (`requirements.txt` uses a version range, not a pinned/hashed lock).
- Uses only Python stdlib for HTTP (`urllib.request.urlopen`, `urllib.parse.urlencode`) plus `csv`/`io` for parsing Alpha Vantage's CSV response — no `requests` library.

## Frameworks

**Core (frontend):** None. No React/Vue/Svelte/Angular, no CSS framework (no Tailwind/Bootstrap). All DOM manipulation is vanilla (`document.getElementById`, template-literal HTML injection, `addEventListener`).

**Core (pipeline):** None (not a web framework) — a single-purpose, single-file cron script (`pipeline/fetch_and_curate.py`), structured as one linear `main()` orchestration function calling discrete fetch/build functions.

**Testing:** Not detected. No test runner, no test files, no CI test step in `.github/workflows/refresh-data.yml`.

**Build/Dev tooling:** None. No bundler (Webpack/Vite/esbuild/Rollup), no transpiler (Babel/TSC), no linter/formatter config (no `.eslintrc*`, `.prettierrc*`, `biome.json`) detected in the repo root.

## Key Dependencies

**Pipeline (from `pipeline/requirements.txt`):**
- `anthropic>=0.121.0,<1.0.0` — official Anthropic Python SDK; the only third-party dependency in the entire repository (frontend included).

**Frontend:** None (zero npm packages, zero CDN-loaded third-party JS). Fonts are self-hosted, not loaded from Google Fonts or any CDN (`fonts/Montserrat-*.woff2`, licensed under `fonts/MONTSERRAT-LICENSE.txt`).

## Configuration

**Environment (pipeline):**
- Three required env vars, read via `os.environ.get(...)` in `pipeline/fetch_and_curate.py:65-67`: `ALPHAVANTAGE_API_KEY`, `FINNHUB_API_KEY`, `ANTHROPIC_API_KEY`.
- Local dev: copy `pipeline/.env.example` to `pipeline/.env`, fill in keys, then `export $(grep -v '^#' .env | xargs)` before running (`pipeline/README.md:110-120`). `.env` existence noted only — never read its contents; it is git-ignored (`.gitignore`: `pipeline/.env`).
- CI: same three vars injected as GitHub Actions **encrypted secrets** (`ALPHAVANTAGE_API_KEY`, `FINNHUB_API_KEY`, `ANTHROPIC_API_KEY`) in `.github/workflows/refresh-data.yml:42-45`.
- The pipeline hard-exits (`sys.exit(...)`) if a required key is missing at the point it's needed, rather than failing fast up front — e.g. `fetch_finnhub_news()` (`fetch_and_curate.py:224-225`), `fetch_prices()` (`:302-303`), `curate_with_claude()` (`:652-653`).

**Frontend config:**
- No env vars, no config files. Behavior constants (ticker lists, chart ranges, etc.) are hard-coded directly in `app.js`.
- `manifest.json` — PWA manifest (name, icons, standalone display, theme color).
- Content-Security-Policy is delivered via `<meta http-equiv>` in `index.html:12` (not an HTTP header) — a deliberate workaround because "GitHub Pages no permite headers HTTP custom" (index.html comment). Policy: `default-src 'self'; script-src 'self'` (no inline/eval scripts anywhere — all listeners are `addEventListener`-based), `style-src 'self' 'unsafe-inline'` (needed for a few inline styles app.js sets directly, e.g. breadth-bar widths), `img-src 'self' data:`, `connect-src 'self'` (frontend only ever fetches same-origin `data.json`, never calls external APIs directly).

**Build config:** None — no build config files exist. Deployment is literally "serve the repo root as static files."

## Platform Requirements

**Development:**
- Frontend: any static file server or even `file://` access (no dev server required, though one may be used for convenience — not configured in-repo).
- Pipeline: Python 3.x with `venv`, `pip install -r pipeline/requirements.txt`; can be scheduled locally via macOS `cron` for manual/local operation (`pipeline/README.md:132-145`) in addition to (or instead of) GitHub Actions.

**Production:**
- Static hosting: **GitHub Pages**, serving from the `main` branch root (`DEPLOY.md`, Part 6).
- Scheduled data refresh: **GitHub Actions**, hourly cron (`0 * * * *`), `ubuntu-latest` runner, Python 3.12 (`.github/workflows/refresh-data.yml`).
- No server-side runtime in production at all — the "backend" is a scheduled batch job that commits a JSON file to the repo, which GitHub Pages then serves statically.

## Data Artifacts Committed to the Repo

The pipeline writes and the workflow commits these generated files back to the repository (not build outputs — they are the runtime database):
- `data.json` (repo root) — the only file the frontend reads.
- `pipeline/price_history.json` — rolling window of recent prices per ticker (sparkline fallback source).
- `pipeline/daily_ohlc.json` — cached daily OHLC candles + `_fetchedDate` marker + `_earningsCalendar`, refreshed at most once/day.
- `pipeline/summary_archive.json` — rolling 30-day archive of daily sector summaries.

These are intentionally **not** gitignored (see comment in `.gitignore`) because GitHub Actions runners are ephemeral and need the accumulated history restored via `git checkout` on each run.

---

*Stack analysis: 2026-08-11*
