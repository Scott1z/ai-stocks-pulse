# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Anyone who wants a fast daily read on the AI-stocks sector without checking multiple apps or sites — public/shared audience, not a personal-only tool. Comes to the page to get the story ("what moved AI stocks today and why") in under a minute, then leaves.

## Product Purpose

Aggregates live price movement and curated news for the major AI-sector stocks into a single page, refreshed periodically by a background pipeline. Success is a visitor understanding the sector's day — sentiment, biggest movers, the news driving them — in about 30 seconds, without hunting across separate price and news sources.

## Positioning

Two things a copy-paste competitor would have to rebuild, not just restyle:
1. A cost-disciplined curation pipeline — news is pre-filtered by relevance score before it ever reaches an LLM, and one batched, prompt-cached LLM call per refresh cycle produces both the curated headlines and the sector narrative. A second, much lower-frequency LLM call (once every 7 days, not every refresh) generates each ticker's investment thesis, since that content doesn't need hourly freshness. The public page itself never calls an LLM, so serving cost does not scale with traffic.
2. It's installable as a PWA (works like a native app icon on the phone), not just a page to bookmark.

## Operating Context

- Public static page (HTML/CSS/JS, no backend/database) that reads a periodically-regenerated `data.json`.
- A separate Python pipeline (`pipeline/fetch_and_curate.py`) runs on a schedule (cron, recommended hourly) outside of any page view: fetches news, quotes, and fundamentals (Finnhub), curates with Claude, writes `data.json`. Real daily OHLC candles come from Alpha Vantage, fetched once a day (see below), not on every hourly run.
- Requires three API keys the user has not yet provisioned: `ALPHAVANTAGE_API_KEY`, `FINNHUB_API_KEY`, `ANTHROPIC_API_KEY`.
- Until the pipeline has run with real keys, the page runs entirely on built-in demo data.

## Capabilities and Constraints

- Tracked tickers are fixed for now, not user-configurable: 50 total (`AI_TICKERS` in `pipeline/fetch_and_curate.py`). The original 23 (NVDA, MSFT, GOOGL, META, AMZN, AVGO, ORCL, PLTR, AMD, TSM, ARM, SMCI, MRVL, QCOM, MU, SNDK, CRM, NOW, ADBE, SNOW, IBM, AAPL, TSLA) plus 27 added later (INTC, TXN, ASML, LRCX, AMAT, KLAC, ANET, DELL, HPE, CDNS, SNPS, DDOG, PANW, CRWD, MDB, WDAY, INTU, SAP, TEAM, STX, WDC, AI, SOUN, IONQ, CSCO, NFLX, UBER).
- News, quotes, fundamentals, and each stock's last-reported-earnings actuals come from Finnhub's free tier (60 calls/min, no published daily cap) — 151 requests/run (50 quotes + 50 metrics + 50 earnings actuals + 1 general-news), paced ~1.1s apart to stay under the per-minute limit, refreshed every hour.
- Only the original 23 tickers get real OHLC candlestick charts — see the Alpha Vantage line below for why. The other 27 fall back to the line chart built from hourly price snapshots, same honest-degradation path a ticker with no Alpha Vantage coverage would already hit.
- Each stock carries its last already-reported quarter's actual EPS vs. the consensus estimate (Finnhub `/stock/earnings`), shown as a "beat/miss" badge in the Stock Detail Modal — real reported numbers, not a computed guess. Hidden entirely for a ticker until Finnhub has a reported quarter for it.
- Watchlist positions: a user can record a purchase price and share count for any favorited ticker and see a live hypothetical gain/loss, in $ and %, plus the position's current total value (Stock Detail Modal, "Mi posición"). Stored in `localStorage` only — never sent anywhere, no accounts, no backend to lose it.
- The hero composite chart has a range toggle (Hoy / 30 días / 60 días): "Hoy" uses the short hourly price-snapshot window (`spark`), the two longer ranges resample real daily closes (`ohlc`) across whichever tracked tickers have OHLC coverage. No "90 días" option — the pipeline only keeps 60 days of daily candles, so that range would promise history the product doesn't have.
- The earnings calendar shows only real, sourced quarterly-earnings dates for tracked tickers, filtered from Alpha Vantage's `EARNINGS_CALENDAR` (~3 months forward) — deliberately not a broader "important events" calendar, since no reliable API exists for that and the product doesn't fabricate dates. Covers all 50 tickers (this endpoint is 1 request regardless of how many symbols get filtered out of the response afterward, so it isn't limited to the OHLC subset). It used to come from Finnhub's `/calendar/earnings`, but that endpoint has a known, unfixed bug where near-term earnings dates go missing or come back wrong (confirmed in production — see [finnhubio/Finnhub-API#528](https://github.com/finnhubio/Finnhub-API/issues/528)), so the source was switched. The tradeoff: Alpha Vantage doesn't say whether a report is before/after market open, so that detail no longer shows.
- Alpha Vantage's free tier (25 requests/day) is reserved for real daily OHLC candles (`TIME_SERIES_DAILY`, only the original 23 tickers — `OHLC_TICKERS`) plus the earnings calendar (all 50), fetched once per day only — 24 requests total, paced at Alpha Vantage's 5-requests/minute limit (so that one daily run takes ~5 minutes). The other 23 hourly runs read the cached result instead of calling the API again. This 25/day ceiling is the hard limit on how many tickers can ever get real candlesticks on the free tier — going past 24 total (23 OHLC + 1 calendar) needs a paid Alpha Vantage plan.
- Each stock also carries basic fundamentals from Finnhub (`/stock/metric`): P/E (TTM), EPS (TTM), market cap, 52-week range, ROE (TTM), net margin (TTM), shown in the Stock Detail Modal. Coverage varies by ticker on the free tier; missing fields render as an honest "N/D", never a fabricated number.
- Each stock also carries a short LLM-written investment thesis (~30 words) plus a one-line catalyst, shown in the Stock Detail Modal. Generated by Claude in a *separate* call from the hourly news-curation call — gated to once every 7 days per the cache-with-date pattern already used for daily OHLC (`pipeline/fetch_weekly_theses`) — since a thesis doesn't change hour to hour and regenerating it hourly would cost real money for no benefit. Hidden entirely for a ticker until that weekly call has produced one; never fabricated on the frontend.
- The Stock Detail Modal's chart is a real OHLC candlestick once a ticker has daily data cached; until then (no Alpha Vantage coverage attempted for that symbol, or the fetch failed) it falls back to a line chart built from hourly price snapshots, with the caption stating which one is showing.
- Frontend makes zero LLM calls at view time — all curation happens offline in the pipeline; page load cost is flat regardless of visitor traffic.
- News items show the article's real cover image when Finnhub provides one (its `image` field, reasociated by URL in the pipeline same as `source`/`published_at`) — in the news list as a 56px thumbnail and full-width at the top of the News Modal. Never fabricated or substituted: an article with no image from Finnhub, or whose image URL 404s/blocks hotlinking client-side, just renders without one — same honest-degradation pattern as the OHLC chart fallback.
- Per-stock sentiment tags (bullish/bearish/mixed) are derived locally from price-change sign, not from the LLM.
- No user accounts, no login, no personalization (favorites and watchlist positions are per-device, via `localStorage`).
- Dark mode: follows system preference by default (pure CSS, no flash on load), or an explicit toggle in the topbar that overrides it and persists to `localStorage`.
- Comparador: overlay up to 3 tickers' % return on one chart, reusing the hero chart's curve/range logic. Only the original 23 tickers (of 50) have real OHLC coverage for the 30d/60d ranges; comparing a newer ticker on those ranges is handled honestly (excluded with a note, or an explicit "no coverage" message), never silently wrong.
- Share-as-image: a button generates a 1200×630 PNG of the day's sector summary, hand-drawn on `<canvas>` (no CDN library — blocked by the CSP anyway) and theme-aware (reads live CSS colors, so it matches light/dark automatically). Downloads directly, or uses the Web Share API with a file on mobile.
- Heatmap: a "Tabla / Mapa de calor" toggle on the Empresas section switches to a size-by-market-cap, color-by-change grid view of the same tickers — same filters/search/click-through as the table, just a different read of identical data.
- Historial: a rolling 30-day archive of the sector summary (sentiment, text, breadth stats, top mover/loser), one entry per day, upserted by the pipeline on every hourly run so a given day never accumulates duplicates. Section stays hidden until the pipeline has written at least one day — never shown blended with demo data under a "live" badge.
- The page stays live without a manual reload: it polls `data.json` every 5 minutes (paused while the tab isn't visible) and, only when `updated_at` actually changed, re-renders with animated number transitions and a small "Datos actualizados" toast. A failed background check is silent and simply retried next cycle — it never falls back to demo data, since that would replace good live data with placeholders over a transient network hiccup.
- Automatic graceful fallback: if `data.json` is missing or invalid, the page renders built-in demo data instead of breaking.

## Security

- **API keys never reach the client.** All three keys (Finnhub, Alpha Vantage, Anthropic) live only as GitHub Actions secrets, injected as env vars into the pipeline's CI run. The public page only ever fetches the pipeline's output (`data.json`) — no key, token, or credential is ever part of what's shipped to a visitor's browser.
- **Untrusted text is escaped before it touches the DOM.** News headlines, summaries, and the raw `source` field all originate outside our control (Finnhub's feed, lightly rewritten by an LLM) and are inserted via `innerHTML` for layout reasons. `escapeHtml()` (`app.js`) runs on all of them first — confirmed by test with a `<img onerror=...>` payload that it renders as inert text, not markup.
- **`source_url` and news `image` are both scheme-checked before use as a link/`src`.** `isSafeHttpUrl()` only allows `http:`/`https:` before setting `<a href>` or `<img src>`, closing off a `javascript:`-URI vector in externally-sourced data; the URL is also `escapeHtml()`-encoded before going into the `src="..."` attribute, so it can't break out into a second attribute either.
- **A Content-Security-Policy is set via `<meta>`** (`index.html`) since GitHub Pages doesn't support custom HTTP response headers. `script-src 'self'` with no `unsafe-inline`/`unsafe-eval` — the whole page has zero inline `<script>` tags and zero `onclick=""`-style handlers, everything is `addEventListener`, so this is a real constraint, not a formality. `img-src` is the one directive intentionally opened up to `https:` (beyond `'self' data:`) to allow news cover images from whatever domain each article's source happens to be — those `<img>` tags never execute script, and a load failure (404, hotlink-blocked, stale URL) is handled by a capturing `error` listener that removes the element, not an inline `onerror=""` attribute (which the CSP would block anyway).
- **Watchlist data (favorites, purchase price) never leaves the browser.** Both live in `localStorage` only; there is no backend to send them to.
- `pipeline/requirements.txt` pins `anthropic` to a version range instead of floating unpinned, so CI doesn't silently pick up an unvetted new release.
- Not yet done, and worth doing once the project has its own domain: `Strict-Transport-Security` and `X-Frame-Options`/`frame-ancestors` need a real HTTP header (a `<meta>` CSP can't carry `frame-ancestors`), which means fronting the domain with something like Cloudflare — GitHub Pages alone can't set custom headers.

## Brand Commitments

Name: "AI Stocks Pulse" (short name "AI Pulse").

## Evidence on Hand

Currently running entirely on fabricated demo data (hardcoded in `app.js`) — the pipeline has not yet been run with real API keys, so there is no real price or news data yet. No testimonials, customers, or case studies exist; do not invent any.

## Product Principles

1. One page, one glance — the whole sector's story readable in under 30 seconds, no cross-referencing multiple sources.
2. Cost-disciplined by design — pre-filter before the LLM, one batched call per cycle, prompt caching; cost tracks refresh cadence, never traffic.
3. Static and resilient — the public page never depends on a live LLM call or a database at view time, and degrades to demo data rather than breaking.
4. Installable, not just visitable — built and shipped as a PWA.
