# Roadmap: AI QuickCap — v2 (Push Notifications)

## Overview

This milestone adds daily web push notifications to AI QuickCap's existing anonymous, static PWA. The build follows a strict dependency chain: first the technical foundation (VAPID keys, Redis storage, service worker handlers) that nothing else can work without; then the subscribe/unsubscribe UX that makes the feature real for a visitor, getting the highest-risk, unrecoverable browser-permission UX right the first time; then a standalone daily send Function with its safety nets (auth, idempotency, dead-subscription pruning) built in from day one rather than retrofitted; and finally the pipeline trigger integration that wires the existing hourly GitHub Actions run to call that send Function automatically at market close. By the end, an opted-in visitor receives one push per trading day with the same sector narrative shown on the homepage, with no new scheduler and no new hosting platform.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Backend Foundation** - VAPID keys, Redis storage, and service worker push handlers exist and are independently verifiable (completed 2026-08-13)
- [ ] **Phase 2: Subscribe/Unsubscribe UX** - Visitors can safely opt in and out of push notifications from the app
- [ ] **Phase 3: Daily Send Function** - A backend Function reliably delivers the daily digest to all subscribers exactly once, pruning dead subscriptions
- [ ] **Phase 4: Pipeline Trigger Integration** - The existing hourly pipeline automatically triggers the daily send at market close

## Phase Details

### Phase 1: Backend Foundation

**Goal**: The technical foundation for push notifications exists — a VAPID key pair, provisioned Redis storage, and a service worker that can receive and display a push notification and handle clicks on it.
**Depends on**: Nothing (first phase)
**Requirements**: BACK-01, BACK-02, BACK-03, BACK-04
**Success Criteria** (what must be TRUE):

  1. A manually-sent test push (using the VAPID keys and a manually-created subscription) is displayed as a browser notification with title, body, and the app's brand icon.
  2. Clicking that test notification focuses an already-open app tab if one exists, or opens the homepage if not.
  3. A subscription object can be written to and read back from Redis via the Upstash for Redis integration.
  4. The VAPID public key is embedded in client-side code; the private key exists only as a Vercel environment variable, not in the repo.

**Plans**: 4 plans (2 waves), 4/4 complete

Plans:

- [x] 01-01-PLAN.md — Generate the VAPID key pair, store the private half in Vercel env vars only, embed the public half in app.js (BACK-01)
- [x] 01-02-PLAN.md — Lock in the push:subscriptions Redis schema and prove a live write/read round trip with a stdlib-only CLI (BACK-02)
- [x] 01-03-PLAN.md — Extend service-worker.js with push + notificationclick listeners and bump CACHE_NAME to v46 (BACK-03, BACK-04)
- [x] 01-04-PLAN.md — End-to-end manual verification: real browser subscription, Redis round trip, real test push, both click branches (BACK-01..04)

Wave 1 (parallel): 01-01, 01-02, 01-03 — no shared files
Wave 2: 01-04 — depends on all three

### Phase 2: Subscribe/Unsubscribe UX

**Goal**: Visitors can opt in and out of daily push notifications through UI that respects browser-permission and iOS platform constraints, never damaging the visitor's ability to be asked again.
**Depends on**: Phase 1
**Requirements**: OPTIN-01, OPTIN-02, OPTIN-03, OPTIN-04, OPTIN-05, OPTIN-06
**Success Criteria** (what must be TRUE):

  1. Visitors see an in-app soft-ask about notifications driven by their own action/context — never automatically on first page load.
  2. The native browser permission prompt appears only after a visitor explicitly accepts the soft-ask.
  3. iOS visitors who haven't added the app to their home screen see an honest "install first" message instead of a non-functional enable button.
  4. Subscribed visitors see a persistent toggle reflecting live subscription state, and toggling off deletes the subscription from Redis (server-side), not just locally.
  5. Visitors who have denied browser notification permission see a quiet help message and are never shown the soft-ask or native prompt again.

**Plans**: 4 plans (3 waves), 0/4 complete
**UI hint**: yes

Plans:

**Wave 1**

- [ ] 02-01-PLAN.md — Repo's first package.json + the two Vercel Functions (api/subscribe.js, api/unsubscribe.js) proven against live Upstash Redis (OPTIN-02, OPTIN-05)
- [ ] 02-02-PLAN.md — Static shell: #pushSoftAsk banner + #pushToggle topbar button in index.html, styled with zero new design primitives (OPTIN-01, OPTIN-03, OPTIN-04, OPTIN-06)

**Wave 2** *(blocked on Wave 1 completion)*

- [ ] 02-03-PLAN.md — initPushNotifications() state machine in app.js: dwell timer, permission gating, iOS gate, three-state toggle, subscribe/unsubscribe flows; CACHE_NAME v47->v48 (OPTIN-01..06)

**Wave 3** *(blocked on Wave 2 completion)*

- [ ] 02-04-PLAN.md — Deploy + live endpoint probes + full six-behavior verification pass with Redis round-trip evidence (OPTIN-01..06)

Wave 1 (parallel): 02-01, 02-02 — no shared files (backend/config vs. index.html+styles.css)
Wave 2: 02-03 — needs 02-02's element ids and 02-01's endpoints
Wave 3: 02-04 — end-to-end verification on the deployed site

### Phase 3: Daily Send Function

**Goal**: A Vercel Function can reliably deliver the day's sector summary to every stored subscription exactly once per trading day, cleaning up dead subscriptions as it sends.
**Depends on**: Phase 1 (can be developed in parallel with Phase 2 using a manually-inserted test subscription)
**Requirements**: SEND-01, SEND-02, SEND-03
**Success Criteria** (what must be TRUE):

  1. Calling the send Function with a valid payload delivers a push notification to every stored subscription.
  2. Calling the send Function twice on the same trading day results in only one notification being sent per subscriber — the second call is a guarded no-op.
  3. When a stored subscription reports expired/invalid (HTTP 410/404) during a send, it is removed from Redis by the end of that same send pass.

**Plans**: TBD

### Phase 4: Pipeline Trigger Integration

**Goal**: The existing hourly GitHub Actions pipeline automatically calls the daily send Function once it's at or after NYSE/Nasdaq market close, with no new scheduler and no unauthorized access to the send endpoint.
**Depends on**: Phase 3
**Requirements**: TRIG-01, TRIG-02
**Success Criteria** (what must be TRUE):

  1. When the hourly pipeline runs at or after market close (US Eastern, DST-aware), it automatically calls the send Function with that day's already-computed narrative — verified via a manual `workflow_dispatch` test run.
  2. Pipeline runs that occur before market close do not trigger a send.
  3. A request to the send endpoint without the correct shared secret is rejected, verified by a manual unauthenticated test request.
  4. End-to-end: a real pipeline run at market close results in opted-in subscribers receiving the daily push with no manual intervention.

**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Backend Foundation | 4/4 | Complete   | 2026-08-13 |
| 2. Subscribe/Unsubscribe UX | 0/4 | Not started | - |
| 3. Daily Send Function | 0/TBD | Not started | - |
| 4. Pipeline Trigger Integration | 0/TBD | Not started | - |
</content>
