# AI QuickCap — v2

## What This Is

AI QuickCap is a public, static web app that summarizes the AI-sector stock market — 50 tracked tickers, prices, curated news, sentiment, and a daily narrative — refreshed hourly by an automated Python pipeline, with a personal watchlist stored entirely in the visitor's browser (no accounts). This v2 milestone adds web push notifications so visitors get the day's sector summary even when they haven't opened the app.

## Core Value

A visitor understands what moved AI-sector stocks today, and why, in under 30 seconds — now delivered proactively via a daily push notification, not just to whoever happens to open the tab.

## Requirements

### Validated

- ✓ Real-time sector dashboard for 50 AI-sector tickers (price, sentiment, sub-sector tags) — existing
- ✓ Hourly-refreshed data pipeline (Finnhub + Alpha Vantage + Claude curation) writing `data.json`, no LLM calls at view time — existing
- ✓ Sub-sector filter (Semis / Software y nube / Mega-cap) — existing
- ✓ Stock Detail Modal: fundamentals, real OHLC candlesticks (23/50 tickers), weekly LLM investment thesis, last-earnings beat/miss — existing
- ✓ Comparador: overlay up to 3 tickers' % return — existing
- ✓ Watchlist (favorites) + "Tu selección" landing section + hypothetical position P/L, all `localStorage`-only, no accounts — existing
- ✓ Client-side favorite price-move alert (in-page toast, once per visit) — existing
- ✓ Earnings calendar, 30-day sector history archive, share-as-image, heatmap view — existing
- ✓ Installable PWA with offline app-shell (service worker) — existing
- ✓ Dark mode (system-aware + manual toggle) — existing
- ✓ Hosting on Vercel, connected to GitHub for auto-deploy on push — this milestone, done

### Active

- [ ] Visitor can opt in to browser push notifications from the site
- [ ] Opted-in visitors receive one push per day, at NYSE/Nasdaq market close, with the day's sector summary (same narrative as the hero card)
- [ ] Push subscriptions are stored server-side (Redis via Upstash for Redis, provisioned through the Vercel Marketplace — the successor to the now-discontinued "Vercel KV") — no user accounts, subscription tied to browser/device
- [ ] A Vercel serverless Function sends the push; triggered from the existing hourly pipeline's market-close run (no new schedule/infra)
- [ ] Visitor can unsubscribe from push notifications as easily as they subscribed

### Out of Scope

- More asset classes / user-added custom tickers — deferred, not part of this v2
- User accounts / cross-device sync — deferred, watchlist and push subscriptions both stay device-local for now
- Deeper technical analysis (indicators, screener/filters beyond sub-sector) — deferred
- Push notifications for other triggers (per-favorite price-move alerts, earnings, breaking news) — deferred; v2 ships only the daily sector-summary push, other triggers can follow as a later milestone
- Native iOS/Android app — deferred, this milestone only improves the existing PWA

## Context

- Brownfield project: AI QuickCap (formerly "AI Stocks Pulse") already has 48 shipped features from prior ad-hoc work in this same session, all documented in `PRODUCT.md` and `DESIGN.md`.
- Frontend is vanilla HTML/CSS/JS — no framework, no bundler, no `package.json`. `pipeline/fetch_and_curate.py` runs hourly via GitHub Actions, commits `data.json` + cache files back to the repo.
- Hosting just migrated from GitHub Pages to Vercel (this session) specifically to unlock serverless Functions + KV for this v2's push-notification backend, and to allow real HTTP headers (CSP currently still delivered via `<meta>`, migration to `vercel.json` headers not yet done).
- Standing product principles (from `PRODUCT.md`): never fabricate data, honest degradation when a data source is missing, cost-disciplined LLM usage (one batched, cached call per hourly pipeline run, zero LLM calls at view time).
- Design language (from `DESIGN.md`): flat/hairline surfaces, single accent color, pill-shaped interactive elements, restrained motion — any new push opt-in UI should reuse existing components (buttons, toast) rather than invent new ones.

## Constraints

- **Tech stack**: Frontend stays vanilla JS/CSS/HTML — the Push API and Service Worker are native browser APIs, no framework needed for the client side.
- **Backend**: Vercel Functions + Upstash for Redis (Vercel Marketplace) only — explicitly chosen over a third-party push SaaS (OneSignal/Firebase) now that the site is already on Vercel, to avoid a second account/platform for a single feature.
- **No accounts**: Push subscriptions must work anonymously, tied to the browser's push subscription object, consistent with the existing no-login watchlist.
- **Budget**: User wants "lo más simple posible" — stay within Vercel's free Hobby tier; avoid paid third-party notification services.
- **Trigger source**: Must reuse the existing hourly GitHub Actions pipeline run that lands at/after market close — no new scheduler.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Hosting moved from GitHub Pages to Vercel | Needed for serverless Functions + KV (push backend) and real HTTP headers; GitHub Pages can't do either | ✓ Good — migrated and verified live this session |
| Push trigger = daily sector summary at market close, not per-favorite price alerts | User explicitly chose this as the v2 focus over other candidate triggers (favorites moves, earnings, news) | — Pending |
| Push backend = Vercel Functions + KV, not a third-party SaaS | Site already lives on Vercel; avoids a second platform/account for one feature, still "lo más simple posible" | — Pending |
| v2 scope = push notifications only; other "más opciones" ideas (accounts, more assets, deeper analysis) deferred | User confirmed this is the sole focus for this milestone | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-08-12 after initialization*
