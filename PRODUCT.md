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
1. A cost-disciplined curation pipeline — news is pre-filtered by relevance score before it ever reaches an LLM, and one batched, prompt-cached LLM call per refresh cycle produces both the curated headlines and the sector narrative. The public page itself never calls an LLM, so serving cost does not scale with traffic.
2. It's installable as a PWA (works like a native app icon on the phone), not just a page to bookmark.

## Operating Context

- Public static page (HTML/CSS/JS, no backend/database) that reads a periodically-regenerated `data.json`.
- A separate Python pipeline (`pipeline/fetch_and_curate.py`) runs on a schedule (cron, recommended hourly) outside of any page view: fetches news, quotes, and fundamentals (Finnhub), curates with Claude, writes `data.json`. Real daily OHLC candles come from Alpha Vantage, fetched once a day (see below), not on every hourly run.
- Requires three API keys the user has not yet provisioned: `ALPHAVANTAGE_API_KEY`, `FINNHUB_API_KEY`, `ANTHROPIC_API_KEY`.
- Until the pipeline has run with real keys, the page runs entirely on built-in demo data.

## Capabilities and Constraints

- Tracked tickers are fixed for now, not user-configurable: NVDA, MSFT, GOOGL, META, AMZN, AVGO, ORCL, PLTR, AMD, TSM, ARM, SMCI, MRVL, QCOM, MU, SNDK, CRM, NOW, ADBE, SNOW, IBM, AAPL, TSLA (23 total).
- News, quotes, and fundamentals come from Finnhub's free tier (60 calls/min, no published daily cap) — 47 requests/run (23 quotes + 23 metrics + 1 general-news), refreshed every hour with plenty of headroom.
- The earnings calendar shows only real, sourced quarterly-earnings dates for tracked tickers, filtered from Alpha Vantage's `EARNINGS_CALENDAR` (~3 months forward) — deliberately not a broader "important events" calendar, since no reliable API exists for that and the product doesn't fabricate dates. It used to come from Finnhub's `/calendar/earnings`, but that endpoint has a known, unfixed bug where near-term earnings dates go missing or come back wrong (confirmed in production — see [finnhubio/Finnhub-API#528](https://github.com/finnhubio/Finnhub-API/issues/528)), so the source was switched. The tradeoff: Alpha Vantage doesn't say whether a report is before/after market open, so that detail no longer shows.
- Alpha Vantage's free tier (25 requests/day) is reserved for real daily OHLC candles (`TIME_SERIES_DAILY`) plus the earnings calendar, fetched once per day only — 24 requests (23 tickers + 1 calendar), paced at Alpha Vantage's 5-requests/minute limit (so that one daily run takes ~5 minutes). The other 23 hourly runs read the cached result instead of calling the API again.
- Each stock also carries basic fundamentals from Finnhub (`/stock/metric`): P/E (TTM), EPS (TTM), market cap, 52-week range, ROE (TTM), net margin (TTM), shown in the Stock Detail Modal. Coverage varies by ticker on the free tier; missing fields render as an honest "N/D", never a fabricated number.
- The Stock Detail Modal's chart is a real OHLC candlestick once a ticker has daily data cached; until then (or if Alpha Vantage has no coverage for that symbol) it falls back to a line chart built from hourly price snapshots, with the caption stating which one is showing.
- Frontend makes zero LLM calls at view time — all curation happens offline in the pipeline; page load cost is flat regardless of visitor traffic.
- Per-stock sentiment tags (bullish/bearish/mixed) are derived locally from price-change sign, not from the LLM.
- No user accounts, no login, no personalization.
- Automatic graceful fallback: if `data.json` is missing or invalid, the page renders built-in demo data instead of breaking.

## Brand Commitments

Name: "AI Stocks Pulse" (short name "AI Pulse").

## Evidence on Hand

Currently running entirely on fabricated demo data (hardcoded in `app.js`) — the pipeline has not yet been run with real API keys, so there is no real price or news data yet. No testimonials, customers, or case studies exist; do not invent any.

## Product Principles

1. One page, one glance — the whole sector's story readable in under 30 seconds, no cross-referencing multiple sources.
2. Cost-disciplined by design — pre-filter before the LLM, one batched call per cycle, prompt caching; cost tracks refresh cadence, never traffic.
3. Static and resilient — the public page never depends on a live LLM call or a database at view time, and degrades to demo data rather than breaking.
4. Installable, not just visitable — built and shipped as a PWA.
