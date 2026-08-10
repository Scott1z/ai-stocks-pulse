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
- A separate Python pipeline (`pipeline/fetch_and_curate.py`) runs on a schedule (cron, recommended hourly) outside of any page view: fetches news (Alpha Vantage) and quotes (Finnhub), curates with Claude, writes `data.json`.
- Requires three API keys the user has not yet provisioned: `ALPHAVANTAGE_API_KEY`, `FINNHUB_API_KEY`, `ANTHROPIC_API_KEY`.
- Until the pipeline has run with real keys, the page runs entirely on built-in demo data.

## Capabilities and Constraints

- Tracked tickers are fixed for now, not user-configurable: NVDA, MSFT, GOOGL, META, AMZN, AVGO, ORCL, PLTR, AMD, TSM, ARM, SMCI, MRVL, QCOM, CRM, NOW, ADBE, SNOW, IBM, AAPL, TSLA (21 total).
- Alpha Vantage's free tier caps at 25 requests/day, which is the hard constraint on pipeline refresh cadence (hourly uses 24 of 25) — unaffected by ticker count, since news is fetched as one general-topic request and filtered locally.
- Finnhub free tier (60 calls/min) covers per-ticker price quotes and fundamentals (2 requests/ticker/run — 42 total), well within budget.
- Each stock also carries basic fundamentals from Finnhub (`/stock/metric`): P/E (TTM), EPS (TTM), market cap, 52-week range, ROE (TTM), net margin (TTM), shown in the Stock Detail Modal. Coverage varies by ticker on the free tier; missing fields render as an honest "N/D", never a fabricated number.
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
