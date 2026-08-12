# Requirements: AI QuickCap — v2 (Push Notifications)

**Defined:** 2026-08-12
**Core Value:** A visitor understands what moved AI-sector stocks today, and why, in under 30 seconds — now delivered proactively via a daily push notification, not just to whoever happens to open the tab.

## v1 Requirements

Requirements for this milestone. Each maps to a roadmap phase.

### Backend Foundation (BACK)

- [ ] **BACK-01**: A VAPID key pair exists — public key embedded client-side, private key stored as a Vercel environment variable
- [ ] **BACK-02**: Push subscriptions are stored in Redis via the Upstash for Redis integration (Vercel Marketplace)
- [ ] **BACK-03**: The existing service worker handles `push` events and displays a notification with title, body (the day's sector narrative), and the app's brand icon
- [ ] **BACK-04**: The existing service worker handles `notificationclick` by focusing an already-open tab if one exists, otherwise opening the homepage

### Opt-in / Opt-out UX (OPTIN)

- [ ] **OPTIN-01**: Visitor sees an in-app soft-ask about enabling notifications before any native browser prompt appears — never triggered on first page load
- [ ] **OPTIN-02**: Native browser permission prompt only fires after the visitor explicitly accepts the soft-ask
- [ ] **OPTIN-03**: iOS visitors who haven't added the app to their home screen see an honest "install first" message instead of a non-functional enable button
- [ ] **OPTIN-04**: Visitor sees a persistent toggle reflecting live subscription state (subscribed / not subscribed)
- [ ] **OPTIN-05**: Visitor can unsubscribe in one action; the subscription is deleted server-side (Redis), not just locally
- [ ] **OPTIN-06**: Visitor who has denied browser notification permission sees a quiet help message and is never re-prompted (browser-level denial is permanent)

### Daily Send (SEND)

- [ ] **SEND-01**: A Vercel Function sends the day's sector summary as a push notification to every stored subscription
- [ ] **SEND-02**: The send function guards against sending more than once per trading day, even if triggered multiple times
- [ ] **SEND-03**: The send function removes subscriptions that report as expired/invalid (HTTP 410/404) during sending, in the same send pass

### Pipeline Trigger (TRIG)

- [ ] **TRIG-01**: The existing hourly pipeline detects when it's at or after NYSE/Nasdaq market close (US Eastern time, DST-aware) and calls the send function with that day's already-computed sector narrative
- [ ] **TRIG-02**: The pipeline's call to the send function is authenticated with a shared secret, so it cannot be triggered by unauthorized requests

## v2 Requirements

Deferred to a future release. Tracked but not in this milestone's roadmap.

### Notifications (NOTIF)

- **NOTIF-01**: Push notification uses `tag: "daily-digest"` + `renotify: true`, so a missed day's notification replaces rather than stacks with the previous one
- **NOTIF-02**: The send function logs sent/pruned/failed counts per run, for validating whether the feature is worth its complexity

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| More asset classes / user-added custom tickers | Deferred — not part of this v2, confirmed with user |
| User accounts / cross-device sync | Deferred — watchlist and push subscriptions both stay device-local for now |
| Deeper technical analysis (indicators, screener) | Deferred — confirmed with user, out of this milestone's focus |
| Additional push triggers (per-favorite price alerts, earnings, breaking news) | Deferred — each would need its own opt-in and cadence, not bundled into the daily-digest subscription |
| Native iOS/Android app | Deferred — this milestone only improves the existing PWA |
| Personalized/favorites-aware digest content | Architecturally blocked — the send Function has no access to a given browser's `localStorage` watchlist under the anonymous, no-accounts design |
| Action buttons on the notification | Unsupported on Safari/iOS (the most fragile platform here already); low marginal value over click-anywhere for a single-CTA digest |
| Rich notification image | Real effort (image generation + public hosting), partial platform support; could reuse the existing share-as-image code later if ever pursued |
| Open-rate click tracking | Not needed to validate the base feature; defer until there's a reason to optimize send copy/timing |
| Third-party push SaaS (OneSignal, Firebase, etc.) | Explicitly rejected — user chose an all-Vercel stack (Functions + Redis) to avoid a second platform/account |
| In-app notification inbox/history UI | The homepage already is the "inbox" — there's only ever one digest per day and it's the same content already shown there |
| Prompting for permission on first page load | Anti-pattern — permanently damages the browser's willingness to show future native prompts on this origin |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| BACK-01 | TBD | Pending |
| BACK-02 | TBD | Pending |
| BACK-03 | TBD | Pending |
| BACK-04 | TBD | Pending |
| OPTIN-01 | TBD | Pending |
| OPTIN-02 | TBD | Pending |
| OPTIN-03 | TBD | Pending |
| OPTIN-04 | TBD | Pending |
| OPTIN-05 | TBD | Pending |
| OPTIN-06 | TBD | Pending |
| SEND-01 | TBD | Pending |
| SEND-02 | TBD | Pending |
| SEND-03 | TBD | Pending |
| TRIG-01 | TBD | Pending |
| TRIG-02 | TBD | Pending |

**Coverage:**
- v1 requirements: 15 total
- Mapped to phases: 0 (pending roadmap creation)
- Unmapped: 15 ⚠️ (expected — roadmap not yet created)

---
*Requirements defined: 2026-08-12*
*Last updated: 2026-08-12 after initial definition*
