# External Integrations

**Analysis Date:** 2026-08-11

## Architecture Note

All external API calls happen **exclusively inside `pipeline/fetch_and_curate.py`**, run out-of-band by GitHub Actions. The browser-facing frontend (`app.js`) never calls Finnhub, Alpha Vantage, or Anthropic directly — its only network call is `fetch("data.json", { cache: "no-store" })` (`app.js:389`), same-origin, which is also why the CSP in `index.html` can safely restrict `connect-src` to `'self'`. This decouples API keys and rate limits entirely from end-user traffic: no matter how many people load the page, external API usage stays fixed at "N pipeline runs/day."

## APIs & External Services

### Finnhub (news, real-time quotes, fundamentals, earnings actuals)

- **Purpose:** primary data source — general market news, live stock quotes, basic fundamentals, and last-reported-earnings actuals for all 50 tracked tickers.
- **Auth:** `FINNHUB_API_KEY` env var, passed as `token` query param on every request.
- **Client:** no SDK — raw HTTP via `urllib.request.urlopen` in `pipeline/fetch_and_curate.py`.
- **Tier:** free tier, rate limit **60 calls/minute** (no published daily cap).
- **Endpoints used:**
  - `GET /news?category=general` — `fetch_finnhub_news()` (`fetch_and_curate.py:223-235`). 1 request/run. Finnhub has no "technology" news category, so all general-market articles are fetched and filtered locally by ticker/company-name mention (`pre_filter()`, `:238-268`) before spending any LLM tokens.
  - `GET /quote?symbol={ticker}` — `fetch_prices()` (`:301-321`). 50 requests/run (one per ticker in `AI_TICKERS`), returns `price` (`c`) and `changePct` (`dp`).
  - `GET /stock/metric?symbol={ticker}&metric=all` — `fetch_fundamentals()` (`:335-363`). 50 requests/run. P/E (TTM), EPS (TTM), market cap, 52-week high/low, ROE (TTM), net margin (TTM). Finnhub doesn't guarantee a stable field name per metric across plans/versions, so `_first_number()` (`:324-332`) tries a list of known field-name aliases and takes the first present numeric value.
  - `GET /stock/earnings?symbol={ticker}` — `fetch_earnings_actuals()` (`:366-405`). 50 requests/run. Last already-reported quarter's actual EPS vs. consensus estimate ("beat/miss"), used for the stock-detail modal badge. Finnhub returns most-recent-first, and the first entry sometimes has `actual: null` (not yet reported), so the code walks the list for the first entry with a non-null `actual`.
  - **Not used:** `/calendar/earnings` — deliberately dropped in favor of Alpha Vantage's `EARNINGS_CALENDAR` due to a known, unfixed Finnhub bug where near-term earnings dates are missing/incorrect (referenced: `finnhubio/Finnhub-API#528`; discovered in production when NVDA's real upcoming earnings date didn't appear).
- **Pacing:** `FINNHUB_PACING_SECONDS = 1.1` (`:298`) — a `time.sleep()` between each request within `fetch_prices`, `fetch_fundamentals`, and `fetch_earnings_actuals`. With 50 tickers × 3 endpoints = 150 requests + 1 news request = 151 requests/hourly run, paced at ~1.1s apart keeps throughput around ~55 calls/min, safely under the 60/min cap. If more tickers are added (`pipeline/README.md` estimates ~180 tickers as the point pacing needs revisiting), this constant needs to increase.
- **Frequency:** every pipeline run (hourly, since Finnhub has no daily cap that hourly polling would threaten).

### Alpha Vantage (daily OHLC candles + earnings calendar)

- **Purpose:** real daily OHLC (open/high/low/close) candles for candlestick charts, plus the forward-looking earnings calendar.
- **Auth:** `ALPHAVANTAGE_API_KEY` env var, passed as `apikey` query param.
- **Client:** raw HTTP via `urllib.request.urlopen`; `EARNINGS_CALENDAR` response is CSV, parsed with stdlib `csv.DictReader`.
- **Tier:** free tier — **25 requests/day total** (hard cap across all endpoints combined) and **5 requests/minute**.
- **Endpoints used:**
  - `GET ?function=TIME_SERIES_DAILY&symbol={ticker}&outputsize=compact` — `fetch_daily_batch()` (`fetch_and_curate.py:473-560`). One request per ticker in `OHLC_TICKERS` (the **first 23** of the 50 `AI_TICKERS`, `:97`) = 23 requests. Returns ~100 trading days; the code keeps the most recent `OHLC_DAYS_KEPT = 60` (`:161`) as `{date, open, high, low, close}`.
  - `GET ?function=EARNINGS_CALENDAR&horizon=3month` — `fetch_earnings_calendar()` (`:423-467`). **1 single request** covers ALL companies reporting in the next 3 months (CSV), filtered locally against the full 50-ticker `AI_TICKERS` set (not just the 23 OHLC tickers, since the request cost is fixed regardless of how many tickers survive the filter).
  - **Total: 23 + 1 = 24 requests/day**, essentially exhausting the 25/day free-tier budget — this is why the 27 tickers added later (2026-08-11 expansion, comment at `:74-76`) get no real candlestick data and fall back to the price-history sparkline instead.
- **Rate-limit pacing:**
  - Daily budget: enforced by only running this fetch **once per calendar day** via a file-based cache-with-date-marker — `daily_ohlc.json` stores `_fetchedDate` (UTC date); if today's date already matches, the cached data is returned with **zero** new requests, and this happens on 23 of every 24 hourly pipeline runs.
  - Per-minute budget: when the daily fetch *does* run, `time.sleep(13)` between each of the 23 OHLC requests (`:516`) and before the final calendar request (`:547`) — 13s spacing keeps it under 5 req/min. The full daily batch takes ~4-5 minutes to complete (documented as expected, not a hang, in `pipeline/README.md:85-87`).
- **Frequency:** effectively once/day, cached the other 23 hourly runs (see Data Flow below).
- **Migration history:** the earnings calendar previously came from Finnhub `/calendar/earnings`; switched to Alpha Vantage because of the Finnhub date-accuracy bug noted above. Trade-off: Alpha Vantage's calendar doesn't indicate before-open/after-close timing (Finnhub did), so that field was dropped from the data model entirely rather than guessed.

### Anthropic API (Claude — news curation + sector summary)

- **Purpose:** single LLM call per pipeline run that (a) selects/ranks the top 8 most relevant pre-filtered news candidates, rewrites headline+summary in Spanish, classifies each item's sentiment, and (b) generates a ≤60-word Spanish sector narrative summary + overall sentiment (`bullish`/`bearish`/`mixed`) — all in one response.
- **Auth:** `ANTHROPIC_API_KEY` env var. Requires an Anthropic Console account with billing/credits loaded (API is pay-per-use, unlike claude.ai) — noted in `pipeline/README.md:99` and `DEPLOY.md`.
- **Client:** official `anthropic` Python SDK (`anthropic>=0.121.0,<1.0.0`), `client.messages.create(...)` — `curate_with_claude()` (`fetch_and_curate.py:651-694`).
- **Model:** `MODEL = "claude-sonnet-5"` (`:154`).
- **Prompt caching:** the system prompt (`SYSTEM_PROMPT`, `:164-202`, a long Spanish-language financial-editor instruction block with strict JSON-only output format) is sent with `"cache_control": {"type": "ephemeral"}` (`:678`) — this is the primary cost-control mechanism, since the system prompt is large and identical across all hourly runs.
- **Input:** a single JSON user message containing pre-filtered/ranked news candidates (max 15, each trimmed to title/summary(280 chars)/tickers/match_count/url) + current-day price change percentages per ticker — never raw article bodies, never per-article LLM calls.
- **Output cap:** `max_tokens=4000` — documented as intentionally generous headroom (billed only for tokens actually generated), because 8 curated items with full headline+summary+source_url plus the sector summary reliably exceeds ~1500 tokens and was observed truncating mid-JSON in production at lower caps.
- **Output handling:** expects strict JSON; `_strip_markdown_fence()` (`:697-710`) defensively strips a ```` ```json ... ``` ```` wrapper if the model adds one despite instructions not to (observed happening in production). If the response still isn't valid JSON, the whole curation step is caught and the run falls back to an empty/neutral summary rather than failing the entire pipeline (`main()`, `:749-755`).
- **Frequency:** exactly once per pipeline run (hourly) — never per-article, never twice per run.
- **Source/date metadata:** headline source and publish date are **not** requested from the LLM; they're re-attached locally by matching `source_url` back to the raw Finnhub article list (`attach_source_meta()`, `:281-288`) to keep LLM output small.

## Data Storage

**Databases:** None. There is no database of any kind (SQL or NoSQL).

**File Storage:** Local filesystem only, inside the git repo itself:
- `data.json` (repo root) — the single artifact the frontend reads; fully regenerated (not appended) on every run.
- `pipeline/price_history.json` — rolling 12-point (`HISTORY_POINTS`, `:153`) price window per ticker, used as sparkline fallback for tickers without real OHLC data.
- `pipeline/daily_ohlc.json` — cached OHLC candles + `_fetchedDate` + `_earningsCalendar`, the once-a-day cache described above.
- `pipeline/summary_archive.json` — rolling 30-day (`ARCHIVE_DAYS_KEPT`, `:162`) archive of daily sector-summary snapshots; today's UTC-date entry is overwritten on every hourly run rather than appended, so a single day never accumulates 24 entries.

All four files are committed and pushed back to the repo by the GitHub Actions workflow (`git add data.json pipeline/price_history.json pipeline/daily_ohlc.json pipeline/summary_archive.json`), because GitHub Actions runners are ephemeral — persisting state in git is what lets the "once per day" and "rolling window" logic survive between runs.

**Caching:** Browser-side only, via the Service Worker (`service-worker.js`): app-shell assets (HTML/CSS/JS/fonts/manifest/icons) are cache-first with network fallback; `data.json` specifically is network-first with cache fallback (so users always get the latest pipeline snapshot when online, and a stale-but-present snapshot offline) — see `isDataRequest()` special-casing in `service-worker.js:31-51`.

## Authentication & Identity

**Auth Provider:** None. This is a public, read-only site with no user accounts, login, or session management. `localStorage` is used purely for client-side preference persistence (favorites list, manual cost-basis entries for gain/loss display) — explicitly documented as never transmitted anywhere (`app.js:209`, "nunca se manda a ningún servidor").

## Monitoring & Observability

**Error Tracking:** None — no Sentry/Bugsnag/etc. Pipeline failures are surfaced only via `print(..., file=sys.stderr)` warnings and GitHub Actions run logs/status (red ❌ / green ✅ in the Actions tab, per `DEPLOY.md` Part 7).

**Logs:** GitHub Actions run logs (ephemeral, per-run) for the pipeline. Optionally, a local `pipeline.log` file if run via macOS cron (`pipeline/README.md:138`, gitignored). No structured logging or log aggregation.

## CI/CD & Deployment

**Hosting:** GitHub Pages, serving the `main` branch root directly (`DEPLOY.md` Part 6: Settings → Pages → "Deploy from a branch" → `main` / `/ (root)`). No build step in the deploy path — the static files in the repo ARE the deployed site.

**CI Pipeline:** GitHub Actions, single workflow `.github/workflows/refresh-data.yml` ("Refresh sector data"):
- **Trigger:** `schedule: cron: "0 * * * *"` (hourly, top of every hour) + `workflow_dispatch` (manual run from the Actions tab).
- **Concurrency:** `group: refresh-data`, `cancel-in-progress: false` — overlapping runs queue rather than cancel each other, avoiding a run being killed mid-write.
- **Permissions:** `contents: write` (needed so the workflow can commit `data.json` etc. back to the repo).
- **Steps:** checkout (`actions/checkout@v4`) → setup Python 3.12 (`actions/setup-python@v5`) → `pip install -r pipeline/requirements.txt` → `python3 pipeline/fetch_and_curate.py` (with the 3 secrets injected as env vars) → commit + push the 4 generated JSON files as `github-actions[bot]`, skipping the commit if there's no diff (`git diff --cached --quiet || git commit ...`).
- This workflow is effectively both the "backend deploy" and the "backend runtime" — there is no separate app server; each hourly run IS the backend doing its one job.

## Environment Configuration

**Required env vars (pipeline only — frontend has none):**
- `ALPHAVANTAGE_API_KEY`
- `FINNHUB_API_KEY`
- `ANTHROPIC_API_KEY`

**Secrets location:**
- Local development: `pipeline/.env` (copied from `pipeline/.env.example`, git-ignored).
- Production (GitHub Actions): repository-level **Encrypted Secrets** (Settings → Secrets and variables → Actions), referenced in the workflow as `${{ secrets.* }}`.

## Webhooks & Callbacks

**Incoming:** None.

**Outgoing:** None — the pipeline calls out to Finnhub/Alpha Vantage/Anthropic, but nothing calls back into this system. The GitHub Actions commit+push is the only "outbound" side effect, and it targets the same repo.

## Data Flow: External APIs → `data.json` → Browser

1. **GitHub Actions** triggers `pipeline/fetch_and_curate.py` hourly (or on manual dispatch).
2. **Finnhub** is called for general news (1 req), quotes (50 req), fundamentals (50 req), and earnings actuals (50 req) — every run, paced at 1.1s/request (~151 req/run, under 60/min).
3. **Alpha Vantage** is called for OHLC candles (23 req) + earnings calendar (1 req) only if `daily_ohlc.json`'s cached `_fetchedDate` isn't today; otherwise the cached values are reused with zero new requests. When it does run, requests are paced at 13s apart (5 req/min limit), taking ~4-5 minutes.
4. Locally (no LLM cost): raw news is filtered to articles mentioning any of the 50 tracked companies (`pre_filter`), ranked by mention count, and trimmed to the top 15 candidates.
5. **Anthropic (Claude)** receives one request containing the 15 candidate articles + current price changes, with the system prompt cached (`cache_control: ephemeral`), and returns curated top-8 news items (Spanish headline/summary/sentiment) plus a sector-wide narrative summary and sentiment — in a single response, `max_tokens=4000`.
6. Source/publish-date metadata is re-attached to curated items locally by URL lookup (not requested from the LLM).
7. All of the above is assembled into `data.json` (stocks array with price/fundamentals/ohlc/lastEarnings per ticker, curated news array, earnings calendar, sector summary + stats, 30-day archive) and written via `Path.write_text(json.dumps(...))`.
8. The GitHub Actions job commits and pushes `data.json` + the 3 pipeline-local JSON files back to `main`.
9. **GitHub Pages** serves the updated `data.json` as a static asset (no server-side processing).
10. The browser's `app.js` calls `fetch("data.json", { cache: "no-store" })` on page load; the **Service Worker** additionally intercepts this request with a network-first/cache-fallback strategy so the PWA still shows the last-known snapshot offline. If `data.json` is missing/malformed, `app.js` falls back to hardcoded `DEMO_*` data so the page always renders something (`pipeline/README.md:5-6`).

---

*Integration audit: 2026-08-11*
