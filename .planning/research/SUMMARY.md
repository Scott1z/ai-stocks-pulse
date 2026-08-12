# Project Research Summary

**Project:** AI QuickCap — Web Push Notifications (daily market-close digest)
**Domain:** Web Push notifications bolted onto an existing static, anonymous PWA (Vercel-hosted frontend + Vercel Functions + Redis) triggered by an existing Python/GitHub Actions hourly pipeline
**Researched:** 2026-08-12
**Confidence:** HIGH

## Executive Summary

This is a well-trodden problem — standard W3C Web Push (VAPID + Push API + Service Worker) layered onto an already-shipping static PWA, with delivery orchestrated by a Vercel Function and triggered from the site's existing hourly GitHub Actions pipeline rather than any new scheduling infrastructure. All four research passes converge on the same architecture: `web-push` (npm) + Redis via the Vercel Marketplace "Upstash for Redis" integration (the modern successor to the now-discontinued "Vercel KV") + three small Vercel Functions (`subscribe`, `unsubscribe`, `send-push`) + two new listeners added to the existing service worker. No third-party push SaaS, no new dependencies beyond two npm packages scoped to `api/`, and zero changes to the frontend's build-free architecture.

The recommended approach: the Python pipeline POSTs the day's already-computed narrative text directly to a shared-secret-protected `api/send-push` endpoint (never re-fetching `data.json`, which would race the Vercel auto-deploy) once it detects it's inside a widened market-close window; the Function's job is entirely delegated to a Redis `SET ... NX EX` idempotency key so that "exactly once per trading day" is guaranteed server-side regardless of how sloppy or redundant GitHub Actions' cron timing is. This single pattern — idempotency in the Function, not in the trigger — is the answer to nearly every reliability question raised across the research (DST transitions, missed/late cron runs, accidental pipeline re-runs, replayed requests).

The dominant risks are not technical-implementation risk but UX/trust and platform-limitation risk: a cold, page-load permission prompt permanently poisons a visitor's ability to ever be asked again (browser-level, unrecoverable), and iOS Safari categorically cannot receive push at all unless the site has been explicitly "Added to Home Screen" — a hard Apple platform wall with no workaround. Both must be designed for from the first UI pass, not patched in later. Secondary risks (unauthenticated send endpoint, dead-subscription accumulation, VAPID key mismatches, sequential-send timeouts) are all cheap to prevent up front and expensive/embarrassing to retrofit, so research strongly recommends building the "unglamorous" safety nets (auth, pruning-on-410, idempotency) in the same phase as the first working send rather than deferring them as polish.

## Key Findings

### Recommended Stack

The stack is intentionally minimal: `web-push` (v3.6.7, npm) does VAPID JWT signing and RFC 8291 payload encryption server-side; `@upstash/redis` (v1.38.2, npm) is a REST-based client for what used to be called "Vercel KV" (that product line was discontinued in Dec 2024 — it's now provisioned as the "Upstash for Redis" integration from the Vercel Marketplace, functionally identical but requires updating any roadmap language that still says "Vercel KV"). The browser side needs zero packages — the Push API and Service Worker API are native to all target browsers (Chrome/Firefox/Edge/Safari 16.4+, including installed iOS PWAs). Adding these two server dependencies forces the repo's first-ever root `package.json`, but this is scoped entirely to `api/` — the frontend stays build-free and unbundled. Functions handling push MUST run on Vercel's Node.js runtime, not Edge — `web-push` depends on Node's `crypto` module internally, which Edge doesn't support.

**Core technologies:**
- `web-push` (npm, 3.6.7) — VAPID signing + payload encryption for sending pushes — the de facto standard Node library, avoids hand-rolling RFC 8291
- `@upstash/redis` (npm, 1.38.2) — REST client for subscription storage — works natively from Vercel serverless without connection pooling
- Vercel Functions (Node.js runtime) — hosts `subscribe`/`unsubscribe`/`send-push` endpoints — required runtime, not Edge-compatible
- Upstash for Redis (Vercel Marketplace) — replaces deprecated "Vercel KV" — same free tier, same DX, different provisioning path
- Native Push API / Service Worker API (browser) — no client-side package needed — matches the zero-framework frontend constraint exactly

### Expected Features

Feature research frames this almost entirely around UX-safety table stakes, not competitive differentiation — a daily digest push has a low feature ceiling, and most of the polish items (rich images, action buttons) are explicitly not worth their cost given partial platform support and the project's "lo más simple posible" constraint.

**Must have (table stakes):**
- Soft-ask UI before the native permission prompt — never call `Notification.requestPermission()` on page load
- iOS standalone-mode detection with an honest "install to Home Screen first" message, gating the CTA before it's shown
- Persistent, visible subscribe/unsubscribe toggle reflecting live `PushSubscription` state
- Graceful handling of `Notification.permission === "denied"` — quiet help link, never a re-prompt (impossible anyway)
- Symmetric one-tap unsubscribe that deletes server-side, not just client-side
- Exactly-once-per-day send with an "already sent today" guard
- Basic title+body notification reusing the existing sector narrative and brand icon; `notificationclick` focuses/opens the app

**Should have (competitive, cheap to add after v1):**
- `tag: "daily-digest"` + `renotify: true` so a missed day's notification replaces rather than stacks
- 410/404 dead-subscription pruning inline in the send loop
- Lightweight delivery logging (sent/pruned/failed counts) for feature validation

**Defer (v2+):**
- Action buttons (unsupported on Safari/iOS, low marginal value for a single-CTA digest)
- Rich notification images (real effort, partial platform support)
- Open-rate click-tracking via URL param
- Personalized/favorites-aware digest content — architecturally blocked by the no-accounts, localStorage-only design (server has no access to a browser's watchlist)
- Additional push triggers (price alerts, earnings, breaking news) — explicitly out of scope, would need separate opt-in/cadence

### Architecture Approach

Push notifications are a third, thin slice connecting two already-independent systems (Python pipeline and static frontend) via exactly one new network edge: the pipeline POSTs a shared-secret-authenticated request to `api/send-push` after its normal `data.json` commit, carrying the day's narrative text directly in the payload (never re-fetched from the deployed site, to avoid racing the Vercel auto-deploy). `send-push` is the sole owner of the idempotency guarantee, enforced via an atomic Redis `SET key NX EX` keyed on the US Eastern calendar date — this is what makes "exactly once per day, triggered from a sloppy hourly cron" actually work, rather than any precision in the trigger timing itself.

**Major components:**
1. `service-worker.js` (extended, not replaced) — owns only `push` and `notificationclick` browser events; no business logic
2. `app.js` — `initPushNotifications()` — owns all subscribe/unsubscribe UI, permission state, and POST/DELETE calls to the new Functions
3. `api/subscribe.js` / `api/unsubscribe.js` — anonymous, same-origin endpoints that upsert/delete one subscription in Redis (hash keyed by SHA-256 of `endpoint`)
4. `api/send-push.js` — the only component holding the shared secret, the idempotency gate, and the `web-push` send loop with inline 410/404 pruning
5. `pipeline/fetch_and_curate.py` — `maybe_trigger_push()` — decides "is it inside the market-close trigger window" and fire-and-forgets a signed POST, wrapped in the pipeline's existing non-fatal try/except pattern

Suggested build order (also a natural phase split): (A) VAPID keys + Redis integration + SW handlers → (B) subscribe/unsubscribe UI + storage endpoints, testable end-to-end → (C) `send-push` + idempotency, testable standalone with a manually-inserted subscription → (D) pipeline trigger wiring + market-close/DST/holiday detection + secrets, validated first via manual `workflow_dispatch` before trusting the real cron.

### Critical Pitfalls

1. **Unauthenticated send endpoint** — the workflow YAML calling it lives in a public repo, so the URL is discoverable; without a shared-secret header (constant-time compared) plus an idempotency guard, anyone can trigger a spam blast or burn through the Hobby-tier quota. Must ship in the same phase as the first working send, not retrofitted.
2. **Page-load / no-context permission prompts** — denial is permanent at the browser level with zero re-prompt path; the only fix is a soft-ask gating the real `requestPermission()` call, plus a persistent findable toggle for later opt-in. This is the single highest-leverage UX decision in the whole feature.
3. **iOS Safari's Home-Screen-install requirement** — a hard platform wall since iOS 16.4 with no workaround; a generic "enable notifications" button shown to a non-installed iOS visitor either throws or silently does nothing, reading as a broken feature. Must be detected (`display-mode: standalone` / `navigator.standalone`) and messaged explicitly before the CTA renders.
4. **Stale/dead subscriptions never pruned** — the only signal is a 404/410 at send time; skipping cleanup wastes quota and inflates send-function duration as churn accumulates. Delete inline in the same send pass, don't defer to "a cleanup job."
5. **Timezone/DST-naive "is it market close" logic and duplicate sends** — hardcoded UTC-hour checks drift twice a year and, if checked loosely, can fire on every post-close hourly run instead of once. Use `zoneinfo`-based ET comparison for correctness and Redis idempotency as the actual safety net regardless.

## Implications for Roadmap

Based on research, suggested phase structure (this mirrors the architecture research's "Suggested Build Order," which is a strong, dependency-driven default):

### Phase 1: Backend Foundation (VAPID + Redis + SW plumbing)
**Rationale:** Nothing else is testable without a VAPID keypair and a provisioned Redis store; the SW must have working `push`/`notificationclick` listeners deployed *before* any subscribe UI is meaningful, or subscriptions silently drop notifications.
**Delivers:** VAPID keypair generated and stored in Vercel env vars; Upstash for Redis Marketplace integration added; `service-worker.js` extended with `push`/`notificationclick` listeners and `CACHE_NAME` bumped.
**Addresses:** Table-stakes "click-to-open behavior" and "basic text notification" from FEATURES.md.
**Avoids:** Pitfall 1 (VAPID mismatch/leakage) and Pitfall 7 (inefficient KV access patterns) — get the Redis schema (single hash + index set, not `KEYS` scans) right before building on top of it.

### Phase 2: Subscribe / Unsubscribe UX
**Rationale:** This is the first point at which the feature is testable by a real user in a real browser, and it's where the highest-leverage UX risk (permission-prompt UX, iOS platform gap) must be solved correctly the first time since browser-level denial is unrecoverable.
**Delivers:** Soft-ask UI, iOS standalone-mode detection with honest install messaging, topbar subscribe/unsubscribe toggle reflecting live state, `api/subscribe.js` + `api/unsubscribe.js` with validated Redis writes/deletes.
**Uses:** Native Push API, `registration.pushManager.subscribe()`, `@upstash/redis`.
**Implements:** `app.js`'s `initPushNotifications()`, `api/subscribe.js`, `api/unsubscribe.js` components from ARCHITECTURE.md.

### Phase 3: Daily Send Function
**Rationale:** Can be developed and tested against a manually-inserted test subscription even before Phase 2 fully ships (per ARCHITECTURE.md, these can partially parallelize) — but must land before Phase 4 has anything to trigger.
**Delivers:** `api/send-push.js` with shared-secret auth, Redis `SET NX EX` idempotency gate, batched `Promise.allSettled` send loop, inline 410/404 pruning.
**Addresses:** "Respect the promised cadence exactly" and "prune dead subscriptions" table-stakes features.
**Avoids:** Pitfall 5 (unauthenticated endpoint), Pitfall 2 (stale subscriptions), Pitfall 6 (sequential-send timeout risk) — all three must ship together here, not as later polish.

### Phase 4: Pipeline Trigger Integration
**Rationale:** Must come last — there's nothing to trigger until Phase 3 is deployed. This is also the phase most exposed to timing/DST edge cases, so it benefits from having the idempotency safety net (Phase 3) already proven.
**Delivers:** `maybe_trigger_push()` added to `fetch_and_curate.py`, ET-timezone-aware market-close + NYSE-holiday detection, widened trigger window (not a single-hour check), `PUSH_TRIGGER_SECRET` added to both GitHub Actions secrets and Vercel env vars, validated first via manual `workflow_dispatch` before trusting the live hourly cron.
**Delivers:** End-to-end daily push, matching the PROJECT.md "Active" requirement.
**Avoids:** Pitfall 8 (DST/timezone bugs) and the "single-hour check" anti-pattern — widen the window and rely on Phase 3's idempotency to absorb redundant calls safely.

### Phase Ordering Rationale

- Strict dependency chain: VAPID public key and a live SW handler are prerequisites for *any* subscription to be meaningful (Phase 1 before 2); stored subscriptions are a prerequisite for sending (2 before 3); a working send endpoint is a prerequisite for having anything to trigger (3 before 4).
- The architecture and pitfalls research both independently converge on this exact ordering — "backend foundation → subscribe/unsubscribe → send function → trigger integration" — which is a strong signal it's the right default rather than an artifact of one research pass.
- This ordering front-loads the two hardest-to-recover-from risks (VAPID key discipline in Phase 1, permission-prompt/iOS UX in Phase 2) instead of leaving them for a rushed final phase.
- Security and reliability safety nets (auth, idempotency, pruning) are baked into the phase that first introduces the send capability (Phase 3), not deferred — matching PITFALLS.md's explicit "never ship without this" guidance for all of them.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 4 (Pipeline Trigger Integration):** DST/timezone handling and NYSE holiday/early-close detection have MEDIUM-confidence specifics (exact behavior of the `holidays` package's financial calendar, interaction with the pipeline's existing market-close detection logic which wasn't fully re-read during research) — worth a `--research-phase` pass to confirm the exact integration point in the existing pipeline code.
- **Phase 3 (Daily Send Function):** exact Upstash free-tier command budget numbers are MEDIUM confidence and should be re-verified against the live dashboard once real subscriber counts exist, though this isn't blocking for initial implementation.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Backend Foundation):** VAPID generation and Redis provisioning are HIGH-confidence, extensively documented, mechanical steps.
- **Phase 2 (Subscribe/Unsubscribe UX):** permission-prompt UX and iOS detection patterns are HIGH-confidence, well-corroborated by MDN/web.dev/Chrome DevRel sources with concrete code patterns already available.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified against npm registry metadata, Vercel's own docs/changelog, and MDN; only the exact Upstash free-tier numbers are MEDIUM (pricing pages drift) |
| Features | HIGH | Permission-UX and iOS restriction claims corroborated by MDN/web.dev/Chrome DevRel plus multiple independent push-vendor docs; only specific opt-in-rate percentages are MEDIUM (vendor marketing claims) |
| Architecture | HIGH | Component boundaries, data flow, and the idempotency pattern verified against current Vercel/web-push docs; NYSE holiday-detection library choice and exact Hobby-tier Function timeout are MEDIUM |
| Pitfalls | HIGH | Vercel platform limits, W3C Push API/VAPID spec, and iOS Safari requirements verified against current official docs; KV free-tier exact numbers are MEDIUM given the Vercel KV → Upstash Marketplace migration and inconsistent pricing pages |

**Overall confidence:** HIGH

### Gaps to Address

- **Exact NYSE early-close handling:** the `holidays` package's financial calendar doesn't distinguish full closures from 1pm early closes (day after Thanksgiving, sometimes Christmas Eve). Impact is cosmetic (push arrives correct but not as early as possible on those days) — acceptable to defer, but should be a known, documented limitation rather than a silent surprise.
- **Existing pipeline's market-close detection logic:** ARCHITECTURE.md and STACK.md both flag that the exact gating logic already in `fetch_and_curate.py` wasn't fully re-read during research — confirm during Phase 4 planning exactly how `maybe_trigger_push()` should hook into the existing hourly run's control flow.
- **Real-world Upstash free-tier sufficiency:** current estimates (256MB storage, ~500K commands/month, or ~30K/day depending on source) comfortably cover this project's expected scale, but should be sanity-checked against the live dashboard once real subscriber numbers exist rather than assumed indefinitely.
- **Vercel Hobby-tier Function duration limits:** research notes this has relaxed significantly with Fluid Compute (up to 300s) but "is not guaranteed forever" — worth confirming current limits at implementation time rather than trusting a point-in-time research snapshot.

## Sources

### Primary (HIGH confidence)
- [Redis on Vercel — official docs](https://vercel.com/docs/redis) — Vercel KV deprecation, Upstash Marketplace replacement
- [Vercel Functions Limitations](https://vercel.com/docs/functions/limitations) — Function duration/runtime constraints
- [web-push-libs/web-push GitHub repo](https://github.com/web-push-libs/web-push) — canonical library API shape, 410/404 handling
- [Push API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Push_API) — `userVisibleOnly`, general Push API mechanics
- [MDN: Notification.tag / Notification.renotify](https://developer.mozilla.org/en-US/docs/Web/API/Notification/tag) — replace-notification behavior
- [web.dev: Permission UX](https://web.dev/articles/push-notifications-permissions-ux) — official Chrome guidance on soft-ask timing
- [Chrome for Developers / Lighthouse — notification-on-start best-practice audit](https://developer.chrome.com/docs/lighthouse/best-practices/notification-on-start) — official confirmation that page-load prompts are an anti-pattern
- [GitHub Docs — Validating webhook deliveries](https://developer.github.com/webhooks/securing/) — HMAC-signature template for pipeline→Vercel auth
- npm registry metadata for `web-push` (3.6.7) and `@upstash/redis` (1.38.2) — direct registry verification

### Secondary (MEDIUM confidence)
- [Upstash for Redis – Vercel Marketplace](https://vercel.com/marketplace/upstash/upstash-kv) and [Vercel Community threads](https://community.vercel.com/t/alternatives-to-vercel-kv/43233) — corroborate the Vercel KV → Marketplace migration
- [OneSignal — Get your audience to Add to Home Screen](https://documentation.onesignal.com/docs/en/getting-your-audience-to-add-to-home-screen) and [Notificare — Web Push in iOS](https://notificare.com/blog/2024/09/16/web-push-in-ios-add-to-home-screen/) — iOS 16.4+ standalone requirement, cross-corroborated
- [Pushpad — Web Push Error 410](https://pushpad.xyz/blog/web-push-error-410-the-push-subscription-has-expired-or-the-user-has-unsubscribed) — 410/404 pruning pattern
- [holidays (PyPI)](https://pypi.org/project/holidays/) — NYSE financial holiday detection, not hands-on tested against this repo
- [Upstash Redis pricing](https://upstash.com/pricing/redis) and [Vercel Community — KV daily request limit thread](https://community.vercel.com/t/kv-daily-request-limit/1512) — free-tier numbers, should be re-verified at implementation time

### Tertiary (LOW confidence)
- Vendor opt-in-rate percentages cited in FEATURES.md (e.g., "85-95% denial on cold prompts") — directionally consistent across sources but ultimately marketing-adjacent claims, not independently measured

---
*Research completed: 2026-08-12*
*Ready for roadmap: yes*
