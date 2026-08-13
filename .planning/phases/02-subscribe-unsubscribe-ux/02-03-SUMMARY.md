---
phase: 02-subscribe-unsubscribe-ux
plan: 03
subsystem: ui
tags: [push-api, service-worker, vanilla-js, opt-in-ux]

# Dependency graph
requires:
  - phase: 02-subscribe-unsubscribe-ux
    plan: 01
    provides: "api/subscribe.js and api/unsubscribe.js contracts (POST /api/subscribe {subscription}, POST /api/unsubscribe {endpoint})"
  - phase: 02-subscribe-unsubscribe-ux
    plan: 02
    provides: "#pushSoftAsk / #pushToggle inert DOM shell + CSS, locked element-id contract"
provides:
  - "initPushNotifications() — the full client-side opt-in/opt-out state machine, wired into init()"
  - "getPushState()/renderPushToggle() — single source of truth + single DOM-mutation point for the topbar bell"
  - "subscribeToPush()/unsubscribeFromPush() — the two network flows against 02-01's Functions"
  - "CACHE_NAME bumped v47->v48 covering all three shell files this phase changed"
affects: [02-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Single getPushState() derivation function returning one of five strings (unsupported/ios-not-installed/denied/subscribed/default), evaluated in a fixed load-bearing order; every UI decision reads this instead of re-deriving state"
    - "Notification.requestPermission() call sites are duplicated (not routed through a shared helper) so each remains the first await in its click handler, preserving user-gesture attribution; post-decision logic (subscribe attempt, toast, refresh) is factored into a shared afterPermissionDecision() helper that does NOT itself call requestPermission()"
    - "#pushToggle's current state is read synchronously from its own data-push-state attribute inside the click handler (not via await getPushState()) specifically to avoid losing gesture attribution before the default-state requestPermission() call"

key-files:
  created: []
  modified:
    - app.js
    - service-worker.js

key-decisions:
  - "aisp_push_soft_ask_seen persists in localStorage (not sessionStorage), permanently — once dismissed via x or resolved through either grant gesture, the soft-ask never auto-reappears, not this session and not on any future visit. The only path back to the native prompt is a deliberate #pushToggle click while in the default state."
  - "requestPermission() call sites: exactly two, both direct click handlers — #pushSoftAskAccept and #pushToggle's default-state branch — each independently guarded by a synchronous `Notification.permission !== \"default\"` check immediately before its own `await Notification.requestPermission()`, so no shared async wrapper sits between the click and the permission call."
  - "CACHE_NAME bumped ai-stocks-pulse-v47 -> v48 (service-worker.js only line changed) to cover all three shell files this phase modified (index.html/styles.css from 02-02, app.js from this plan), so returning visitors get the new markup/styles/script instead of the stale v47 shell."

requirements-completed: [OPTIN-01, OPTIN-02, OPTIN-03, OPTIN-04, OPTIN-05, OPTIN-06]

# Metrics
duration: ~12min
completed: 2026-08-13
---

# Phase 2 Plan 3: Push Opt-In/Opt-Out State Machine Summary

**`initPushNotifications()` in `app.js` — the client-side state machine driving the 02-02 shell against the 02-01 Functions: a 5-state derivation (`unsupported`/`ios-not-installed`/`denied`/`subscribed`/`default`), a 6-second dwell-gated soft-ask, exactly two gesture-attributed `requestPermission()` call sites, and the two network flows, wired into `init()` with the service-worker cache bumped v47→v48.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-08-13T23:41:00Z (approx.)
- **Completed:** 2026-08-13T23:53:14Z
- **Tasks:** 3/3 completed
- **Files modified:** 2 (app.js, service-worker.js)

## Accomplishments

- `getPushState()`: single source of truth, five states evaluated in load-bearing order — support check first, then the iOS-tab gate (before permission, since there's nothing to enable there regardless), then `denied`, then `subscribed` (which requires a *live* `getSubscription()` result, not just `Notification.permission === "granted"`), falling through to `default` for everything else including "granted but no live subscription."
- `renderPushToggle(state)`: the only function that ever touches `#pushToggle`'s DOM — hides it entirely for `unsupported`/`ios-not-installed`, otherwise sets `data-push-state` and the matching locked `aria-label`.
- `subscribeToPush()`/`unsubscribeFromPush()`: the two network flows. Subscribe rolls back (`sub.unsubscribe()`) on any non-ok response or thrown error so the browser never holds an orphaned registration; unsubscribe captures `sub.endpoint` before calling `sub.unsubscribe()` (the object is dead afterward) and always POSTs `/api/unsubscribe` inside its own try/catch, so a network failure still leaves the browser locally unsubscribed (Phase 3's 410/404 pruning is the backstop).
- `initPushNotifications()`: wires the soft-ask banner (6s dwell timer via `PUSH_SOFT_ASK_DELAY_MS`, iOS install-first note path, × dismiss that permanently sets `aisp_push_soft_ask_seen`) and the topbar toggle (denied → help toast, subscribed → one-click unsubscribe + toast + refresh, default → gesture-attributed `requestPermission()`). Called from `init()` between `initServiceWorker()` and `initAutoRefresh()`, not awaited, so it never blocks first paint on `navigator.serviceWorker.ready`.
- `service-worker.js`: `CACHE_NAME` bumped from `"ai-stocks-pulse-v47"` to `"ai-stocks-pulse-v48"` — the only line changed in that file — so returning visitors pick up the new `index.html`/`styles.css` (from 02-02) and `app.js` (this plan) instead of the stale cached shell.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add the push state helpers and the toggle renderer** - `b2c98f6` (feat)
2. **Task 2: Add the subscribe and unsubscribe network flows** - `ba19199` (feat)
3. **Task 3: Wire initPushNotifications() into init() and bump the service worker cache** - `8d81177` (feat)

_No plan-metadata commit in this response — worktree mode: the orchestrator commits SUMMARY.md/REQUIREMENTS.md centrally after merge._

## Files Created/Modified

- `app.js` - Added the full push opt-in/opt-out block (`PUSH_SOFT_ASK_SEEN_KEY`, `PUSH_SOFT_ASK_DELAY_MS`, `pushSupported()`, `isIosNonStandalone()`, `urlBase64ToUint8Array()`, `getPushState()`, `renderPushToggle()`, `subscribeToPush()`, `unsubscribeFromPush()`, `initPushNotifications()`) between `initServiceWorker()` and the preloader section; added `initPushNotifications();` to `init()`'s call sequence
- `service-worker.js` - `CACHE_NAME` bumped `"ai-stocks-pulse-v47"` → `"ai-stocks-pulse-v48"`; `CORE_ASSETS` untouched

## Decisions Made

- **`getPushState()`'s five-state evaluation order is load-bearing**: `unsupported` → `ios-not-installed` → `denied` → `subscribed` (requires live `getSubscription()`) → `default`. Documented inline and verified by the plan's automated gate (`getPushState()` returns `"ios-not-installed"` strictly before it ever reads `Notification.permission`).
- **Two independent `requestPermission()` call sites, not one shared async wrapper** — the `#pushSoftAskAccept` handler and the `#pushToggle` default-state branch each do their own synchronous `Notification.permission !== "default"` guard immediately followed by their own `await Notification.requestPermission()`, so the native prompt never loses user-gesture attribution to an intervening `await`. Only the *post-decision* logic (attempt `subscribeToPush()`, pick a toast, call `refresh()`) is shared via `afterPermissionDecision(permission)`, which itself never calls `requestPermission()`.
- **`#pushToggle`'s click handler reads its own `data-push-state` attribute synchronously** rather than `await getPushState()`, specifically so the default-state branch's `requestPermission()` call remains the handler's first `await` and keeps gesture attribution.
- **`aisp_push_soft_ask_seen` is set on every path that resolves the native prompt** (Activar click, toggle default-state click, and the × close) — not just on dismissal — so a visitor who granted or denied permission through either gesture never sees the soft-ask reappear either.

## Deviations from Plan

None - plan executed exactly as written, including the plan's own re-derivation guidance for avoiding gesture-attribution loss (shared post-decision helper without a shared `requestPermission()` call site).

## Issues Encountered

None. All three tasks' automated verification commands (parse checks + Python assertion scripts from the plan) passed on first attempt for Tasks 1 and 2, and after restructuring the permission-request wiring into two independent call sites for Task 3 (the initial single-shared-helper draft failed the plan's `count('Notification.requestPermission()')==2` gate, since a shared helper produces exactly one literal call site in source regardless of how many places invoke it — fixed before committing, not a deviation from the plan's intent, just getting the literal-call-site requirement right on the second pass).

## User Setup Required

None - no external service configuration required. This plan is pure client-side JS; the `/api/subscribe` and `/api/unsubscribe` endpoints it calls were already live from `02-01`, and `/api/*` will 404 in a local static-file-server check per the plan's own verification note (full end-to-end behavioral verification is deferred to `02-04`).

## Next Phase Readiness

- The full opt-in/opt-out state machine is implemented, gated, and reachable only through the two sanctioned gestures (Activar click, toggle default-state click) and nowhere else — no page-load path, no timer path, no other click handler ever reaches `Notification.requestPermission()`.
- `CACHE_NAME` is `ai-stocks-pulse-v48`, covering all three shell files this phase (02-02 + 02-03) changed, so a deployed update reaches returning visitors' service workers.
- Behavioral verification (dwell timer timing, banner dismiss persistence, denied-permission flow, real `/api/subscribe`/`/api/unsubscribe` round-trips against live Vercel Functions) is explicitly out of scope for this plan per its own `<verification>` section and is the subject of `02-04`.
- No blockers identified for `02-04`.

---
*Phase: 02-subscribe-unsubscribe-ux*
*Completed: 2026-08-13*

## Self-Check: PASSED

- FOUND: app.js
- FOUND: service-worker.js
- FOUND: .planning/phases/02-subscribe-unsubscribe-ux/02-03-SUMMARY.md
- FOUND commit: b2c98f6
- FOUND commit: ba19199
- FOUND commit: 8d81177
