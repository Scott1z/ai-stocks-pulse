---
phase: 02-subscribe-unsubscribe-ux
verified: 2026-08-14T00:05:49Z
status: human_needed
score: 11/11 must-haves verified (code + live-API level); 8 behavioral checks require human/device observation
overrides_applied: 0
human_verification:
  - test: "A — OPTIN-01: soft-ask never appears on first paint, appears at ~6s dwell, non-blocking"
    expected: "No banner/bell/native prompt at t=0..5s; banner slides up at t≈6s; page interactive behind it"
    why_human: "Requires a live timed browser session; dwell-timer visual behavior cannot be observed via static source inspection"
  - test: "B — OPTIN-02: native permission prompt fires only after clicking Activar"
    expected: "No native prompt until explicit click; prompt appears immediately on click"
    why_human: "Native browser permission UI cannot be triggered or observed outside an interactive browser session"
  - test: "C — OPTIN-04: toggle reflects live subscription state across reload"
    expected: "After reload while subscribed, bell renders filled/accent immediately, no banner"
    why_human: "Requires a real granted+subscribed browser profile and a reload"
  - test: "D — OPTIN-05: unsubscribe deletes the Redis row created by a real browser subscription"
    expected: "push_redis.py get <endpoint> returns data before, empty after one toggle click"
    why_human: "Requires a real PushSubscription created through the actual browser Push API (not a synthetic fixture) — the api-selftest.mjs harness and curl probes already prove the endpoint logic and idempotency, but not the real front-end round trip"
  - test: "E — OPTIN-06: denied state is quiet and permanent, no native re-prompt"
    expected: "Blocking notifications in browser settings + reload never shows the banner; toggle shows faint slashed bell; click shows help toast with no native prompt"
    why_human: "Requires changing OS/browser-level notification permission, which cannot be scripted from source inspection"
  - test: "F — OPTIN-03: iOS Safari (non-standalone) install-first message on a real iPhone"
    expected: "Banner shows iOS note only, no Activar button, no bell icon; functional flow works after Add to Home Screen"
    why_human: "navigator.standalone cannot be reliably simulated via DevTools UA override per the plan's own instruction; a real iPhone is required"
  - test: "G — dismissal via × never re-shows the banner on subsequent visits"
    expected: "After closing the banner, reloading repeatedly never re-triggers it"
    why_human: "Requires multiple real page loads in a persistent browser profile to confirm localStorage-gated behavior end-to-end"
  - test: "H — dark mode and sub-640px layout render correctly with no hardcoded light-mode colors"
    expected: "Banner/bell states render correctly in dark mode; banate spans full width with side insets under 640px, no horizontal scroll"
    why_human: "Visual rendering verification requires an actual browser viewport, not source inspection alone"
---

# Phase 2: Subscribe/Unsubscribe UX Verification Report

**Phase Goal:** Visitors can opt in and out of daily push notifications through UI that respects browser-permission and iOS platform constraints, never damaging the visitor's ability to be asked again.
**Verified:** 2026-08-14T00:05:49Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

All truths below were checked **directly against the current codebase and the live deployment** — not accepted from SUMMARY.md prose. Where a truth requires interactive browser/device behavior to fully confirm, that is called out separately in Human Verification below (per this project's documented `workflow.human_verify_mode: end-of-phase` and the 02-04-SUMMARY.md deferral, which records DEFERRED rather than fabricated PASS for checks A–H).

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Nothing notification-related renders on first paint; soft-ask appears only after a dwell timer (OPTIN-01) | ✓ VERIFIED (code) | `app.js:2655` `PUSH_SOFT_ASK_DELAY_MS = 6000`; the only automatic trigger of `showSoftAsk()` is `setTimeout(showSoftAsk, PUSH_SOFT_ASK_DELAY_MS)` at `app.js:2891`, inside the `"default"` branch of the async IIFE, never called synchronously or at page load. Live behavioral confirmation deferred — see Human Verification A/G. |
| 2 | Native browser prompt fires only after explicit accept, never automatically (OPTIN-02) | ✓ VERIFIED (code) | `grep -c "Notification.requestPermission()" app.js` = exactly 2, both inside click handlers (`#pushSoftAskAccept` at `app.js:2841`, `#pushToggle` default branch at `app.js:2864`), each immediately preceded by a synchronous `if (Notification.permission !== "default") return;` guard and each is the first `await` in its handler (gesture-attribution preserved). Live confirmation deferred — see Human Verification B. |
| 3 | iOS visitors without home-screen install see an honest message, never a non-functional button (OPTIN-03) | ✓ VERIFIED (code) | `isIosNonStandalone()` (`app.js:2661`) checks UA + BOTH `navigator.standalone` and `matchMedia("(display-mode: standalone)")`; `getPushState()` evaluates `"ios-not-installed"` before ever reading `Notification.permission` (`app.js:2690`); `initPushNotifications()`'s iOS branch (`app.js:2874-2884`) hides `#pushSoftAskText`/`#pushSoftAskAccept`, shows `#pushIosNote`, and returns without ever wiring the Activar handler — `#pushToggle` stays hidden via `renderPushToggle()`. Real-device confirmation deferred — see Human Verification F. |
| 4 | Persistent toggle reflects live state, derived from both `Notification.permission` and `getSubscription()` (OPTIN-04) | ✓ VERIFIED (code) | `getPushState()` (`app.js:2688-2702`) returns `"subscribed"` only if `Notification.permission === "granted"` AND `await reg.pushManager.getSubscription()` is non-null — a bare `granted` check alone is insufficient by construction. `renderPushToggle()` is the sole DOM mutator for `#pushToggle` and is called on load and after every state-changing action via `refresh()`. Live reload confirmation deferred — see Human Verification C. |
| 5 | One toggle click unsubscribes the browser AND deletes the Redis row server-side (OPTIN-05) | ✓ VERIFIED (code + live) | `unsubscribeFromPush()` (`app.js:2748`) captures `sub.endpoint` before `sub.unsubscribe()`, then unconditionally POSTs to `/api/unsubscribe`. Independently re-ran `scripts/api-selftest.mjs` against live Upstash Redis in this verification session (after `npm install`): **10/10 PASS**, including "unsubscribe known endpoint -> 200, then hget is empty" and the idempotent-delete case. Independently curl-probed the deployed `/api/unsubscribe` and confirmed 200 for an unknown endpoint. `push_redis.py list` confirmed empty (no pollution) before and after. Full real-browser round trip (real Push subscription, not a synthetic fixture) deferred — see Human Verification D. |
| 6 | Denied visitors see a quiet help message, never re-prompted, never see the soft-ask (OPTIN-06) | ✓ VERIFIED (code) | `getPushState()` returns `"denied"` before any subscription check; `initPushNotifications()`'s denied branch (`app.js:2886`) returns immediately — never starts the dwell timer, never shows the banner; the toggle click handler's `"denied"` branch (`app.js:2850-2855`) shows the locked help toast and never calls `requestPermission()`. Live confirmation (native re-prompt truly never fires) deferred — see Human Verification E. |
| 7 | The soft-ask, once dismissed via ×, never auto-reappears on any future visit | ✓ VERIFIED (code) | `#pushSoftAskClose` handler calls `hideSoftAsk(); markSoftAskSeen();` and never touches the Notification API (`app.js:2831-2834`); `markSoftAskSeen()` writes `aisp_push_soft_ask_seen` to `localStorage` (persistent, not session-scoped); the dwell-timer `setTimeout` is only armed when `!softAskSeen()` (`app.js:2890`). Live multi-reload confirmation deferred — see Human Verification G. |
| 8 | `api/subscribe.js` validates and writes to Redis exactly per the Phase 1 schema | ✓ VERIFIED (code + live) | `api/subscribe.js` validates `endpoint`/`keys.p256dh`/`keys.auth` as non-empty strings, additionally requires an `https:` URL, writes `hset("push:subscriptions", { [sha256hex(endpoint)]: JSON.stringify(sub) })`. Live self-test confirms round-trip read-back under the sha256 field. Live curl probes against the deployed site confirm 400 for missing keys and non-https endpoint, 405 for GET. |
| 9 | `api/unsubscribe.js` is idempotent, returns 200 for both known and unknown endpoints | ✓ VERIFIED (code + live) | `api/unsubscribe.js` always returns `200` regardless of `hdel` count. Self-test and live curl probe both confirm 200 for a never-stored endpoint. |
| 10 | The repo's first `package.json` did not introduce a Vercel build step / change static serving | ✓ VERIFIED (code + live) | `package.json` has no `scripts` key at all (confirmed via `node -e "require('./package.json').scripts"` → `undefined`). Live `GET https://ai-stocks-pulse.vercel.app/` → 200, body contains `AI QuickCap` and `id="pushToggle"` — static site still served directly. |
| 11 | `node_modules/` is git-ignored; `package-lock.json` is committed | ✓ VERIFIED | `.gitignore` line 33 contains `node_modules/` with an explanatory Spanish comment; confirmed the ignore rule functions correctly (test file inside `node_modules/` is ignored by `git check-ignore`); `package-lock.json` is tracked and not ignored. |

**Score:** 11/11 code/API-level truths verified. 8 interactive behavioral checks (A–H) remain genuinely unverified by direct observation and are correctly recorded as DEFERRED (not fabricated) in `02-04-SUMMARY.md`, consistent with this project's `workflow.human_verify_mode: end-of-phase` setting.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `package.json` | First-ever, `@upstash/redis` dep, `type: module`, no build script | ✓ VERIFIED | Confirmed exact fields; `scripts` undefined |
| `package-lock.json` | Committed, pinned tree | ✓ VERIFIED (minor note) | Present and tracked; root `"name"` field reads `"agent-aaab83a493426b56d"` (a leaked worktree directory name from the isolated execution environment where `npm install` originally ran) instead of `"ai-stocks-pulse"`. Cosmetic only — does not affect `npm ci`/`npm install` correctness, confirmed by successfully installing and running the self-test from this exact committed lockfile. |
| `api/subscribe.js` | Vercel Function, validates + hset | ✓ VERIFIED | 20+ lines, substantive validation, `Redis.fromEnv()`, sha256 field derivation, https: check, no key-material logging |
| `api/unsubscribe.js` | Vercel Function, idempotent hdel | ✓ VERIFIED | Substantive, always-200 contract, sha256 field derivation |
| `scripts/api-selftest.mjs` | Node harness against live Redis | ✓ VERIFIED | 243 lines; independently re-executed in this session — 10/10 PASS against live Upstash Redis |
| `index.html` | `#pushSoftAsk` banner + `#pushToggle` markup | ✓ VERIFIED | All 6 element ids present, correct ordering (`themeToggle` < `pushToggle` < `installBtn`; banner before `#toast`), locked copy strings verbatim, 3 bell SVGs |
| `styles.css` | `.push-soft-ask` + 3-state icon-swap rules | ✓ VERIFIED | All required rules present; zero raw hex colors in new banner block; shadow value reused verbatim (4 occurrences incl. `.toast`); `pointer-events: none` correctly absent from banner block; 640px mobile override present |
| `app.js` | `initPushNotifications()` + helpers, wired into `init()` | ✓ VERIFIED | All 8 functions present and substantive (not stubs); wired between `initServiceWorker()` and `initAutoRefresh()`, not awaited |
| `service-worker.js` | `CACHE_NAME` bumped | ✓ VERIFIED | `ai-stocks-pulse-v48` confirmed, no `v47` remnant |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `api/subscribe.js` | `@upstash/redis Redis.fromEnv()` | `hset` on `push:subscriptions` | ✓ WIRED | `api/subscribe.js:68` |
| `api/unsubscribe.js` | `@upstash/redis Redis.fromEnv()` | `hdel` on `push:subscriptions` | ✓ WIRED | `api/unsubscribe.js:38` |
| `api/subscribe.js` | `scripts/push_redis.py` schema | sha256 hex digest field | ✓ WIRED | Both files: `createHash("sha256").update(endpoint).digest("hex")` |
| `index.html #pushToggle` | `styles.css .theme-toggle` | literal class reuse | ✓ WIRED | `index.html:71` `class="theme-toggle"` |
| `index.html #pushSoftAsk` | `styles.css .push-soft-ask` | class binding | ✓ WIRED | `.push-soft-ask {` at `styles.css:2184` |
| `styles.css #pushToggle[data-push-state]` | `index.html` bell SVG classes | display swap | ✓ WIRED | 3 state rules present, each shows exactly one bell |
| `app.js initPushNotifications()` | `index.html #pushSoftAsk`/`#pushToggle` | `getElementById` | ✓ WIRED | `app.js:2706`, `app.js:2773` |
| `app.js subscribeToPush()` | `/api/subscribe` | `fetch POST` with JSON content-type | ✓ WIRED | `app.js:2730` |
| `app.js unsubscribeFromPush()` | `/api/unsubscribe` | `fetch POST` after `sub.unsubscribe()` | ✓ WIRED | `app.js:2755`, endpoint captured before unsubscribe (verified line order) |
| `app.js init()` | `initPushNotifications()` | call placed after `initServiceWorker()` | ✓ WIRED | `app.js:2962-2964`: `initServiceWorker(); initPushNotifications(); initAutoRefresh();` |
| deployed `/api/subscribe`, `/api/unsubscribe` | live Vercel runtime | curl probes | ✓ WIRED | Independently re-probed in this session: `GET /`→200 with `id="pushToggle"`; `GET /api/subscribe`→405; `GET /api/unsubscribe`→405; malformed subscribe body→400; http:// endpoint→400; unknown unsubscribe endpoint→200; zero 500s |

### Behavioral Spot-Checks (performed by this verifier, not the executor)

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `app.js` parses as valid JS | `node -e "new vm.Script(...)"` | parses OK | ✓ PASS |
| Live self-test proves subscribe/unsubscribe against real Redis | `npm install && node scripts/api-selftest.mjs` (fresh install from committed lockfile, `.env.local` sourced) | 10 PASS, 0 FAIL | ✓ PASS |
| Deployed static site unaffected by new `package.json` | `curl -s https://ai-stocks-pulse.vercel.app/` | 200, contains `AI QuickCap` + `id="pushToggle"` | ✓ PASS |
| Deployed `/api/subscribe` validation | curl probes (GET, missing keys, http:// endpoint) | 405 / 400 / 400 | ✓ PASS |
| Deployed `/api/unsubscribe` idempotency | curl probe, unknown endpoint | 200 | ✓ PASS |
| Redis hash clean of test pollution | `python3 scripts/push_redis.py list` (after this session's own probes and self-test) | empty output | ✓ PASS |
| `node_modules` git-ignore correctness | created a real file under `node_modules/` and ran `git check-ignore` | correctly ignored; not present in `git status --porcelain` | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|-------------|-----------------|--------------|--------|----------|
| OPTIN-01 | 02-02, 02-03 | Soft-ask before native prompt, never on first load | ✓ SATISFIED (code); behavior deferred | Dwell timer + no page-load trigger, verified in source |
| OPTIN-02 | 02-01, 02-03 | Native prompt only after explicit accept | ✓ SATISFIED (code); behavior deferred | Exactly 2 gated `requestPermission()` call sites |
| OPTIN-03 | 02-02, 02-03 | iOS honest install-first message | ✓ SATISFIED (code); real-device deferred | `isIosNonStandalone()` dual check + gated UI |
| OPTIN-04 | 02-02, 02-03 | Persistent toggle, live state | ✓ SATISFIED (code); behavior deferred | `getPushState()` derivation, `renderPushToggle()` |
| OPTIN-05 | 02-01, 02-03 | Server-side Redis deletion on unsubscribe | ✓ SATISFIED (code + live API); real browser round-trip deferred | Self-test + curl probes independently reproduced in this session |
| OPTIN-06 | 02-02, 02-03 | Denied is quiet and permanent | ✓ SATISFIED (code); behavior deferred | Denied branch never reaches `requestPermission()` |

No orphaned requirements: all 6 OPTIN IDs declared in this phase's REQUIREMENTS.md section are claimed by at least one plan's frontmatter (02-01: OPTIN-02, OPTIN-05; 02-02: OPTIN-01, OPTIN-03, OPTIN-04, OPTIN-06; 02-03 and 02-04: all six).

**Documentation staleness (non-blocking, informational):** `.planning/REQUIREMENTS.md` still shows the OPTIN-01..06 checkboxes as `[ ]` (unchecked) and the Traceability table lists their status as "Pending", even though Phase 2 is marked complete in `ROADMAP.md`. This is a documentation-sync gap, not a code gap — recommend updating REQUIREMENTS.md's checkboxes/traceability table to "Complete" once the deferred human checks (A-H) pass.

### Anti-Patterns Found

None. Scanned `api/subscribe.js`, `api/unsubscribe.js`, `scripts/api-selftest.mjs`, `index.html`, `styles.css`, `app.js`, `service-worker.js` for `TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER` and stub-return patterns — zero matches. No `console.log` of subscription/endpoint/key material found in either API Function or `app.js`'s push code.

**Minor note (informational, not a gap):** `package-lock.json`'s root `"name"` field is `"agent-aaab83a493426b56d"` (a worktree directory artifact from the sandboxed execution environment) rather than `"ai-stocks-pulse"`. Confirmed this does not break installs — `npm install` from the committed lockfile succeeded and the self-test passed against it in this verification session. Cosmetic only; safe to leave or fix opportunistically in a later commit.

### Human Verification Required

Per `.planning/phases/02-subscribe-unsubscribe-ux/02-04-SUMMARY.md`, this project uses `workflow.human_verify_mode: end-of-phase`. The executor explicitly declined to fabricate PASS results for the 8 checks below, since they require an interactive browser session or a real iPhone device that was unavailable during automated execution. This verifier concurs with that deferral (per the launching agent's note) and could not resolve them programmatically either — all are legitimately interactive/visual/device-dependent checks, not evidence of missing implementation (every corresponding code path was independently verified above).

### 1. Soft-ask timing and non-blocking behavior (OPTIN-01)

**Test:** Open the deployed site (`https://ai-stocks-pulse.vercel.app`) in a fresh browser profile. Observe from t=0.
**Expected:** No banner/bell/native prompt for ~5s; banner slides up from the bottom at t≈6s with the locked copy, "Activar", and ×; page remains fully interactive (scrollable, clickable) behind the banner.
**Why human:** Dwell-timer visual behavior and non-blocking interaction cannot be observed via static source inspection.

### 2. Native permission prompt gesture (OPTIN-02)

**Test:** With the banner visible, click "Activar".
**Expected:** No native prompt before the click; it appears immediately upon click; accepting shows the "¡Notificaciones activadas!" toast and the bell turns solid accent.
**Why human:** Native browser permission UI only renders in a real interactive session.

### 3. Toggle state survives reload (OPTIN-04)

**Test:** While subscribed, reload the page.
**Expected:** Bell renders filled/accent immediately on load, no banner shown.
**Why human:** Requires a real granted+subscribed browser profile.

### 4. Server-side deletion via real subscription (OPTIN-05)

**Test:** Capture a real subscription's endpoint via DevTools console, confirm presence with `push_redis.py get`, click the bell once, re-run `push_redis.py get`.
**Expected:** Present before, absent after.
**Why human:** Requires a genuine browser-issued PushSubscription (not the synthetic fixture used by `api-selftest.mjs`), and DevTools console access.

### 5. Denied state is quiet and permanent (OPTIN-06)

**Test:** Block notifications for the site in browser settings, reload.
**Expected:** No banner ever appears; bell renders faint grey with a slash; clicking shows the help toast with no native prompt.
**Why human:** Requires changing OS/browser-level permission state.

### 6. iOS install-first message on a real device (OPTIN-03)

**Test:** On a real iPhone, open the site in Safari as a normal tab (not from a home-screen icon).
**Expected:** Banner shows the iOS install note only, no "Activar" button, no bell icon; functional flow appears after adding to home screen.
**Why human:** `navigator.standalone` cannot be reliably simulated via DevTools UA override; a real device is required per the plan's own instruction.

### 7. Dismissal never nags (OPTIN-01 anti-nagging guarantee)

**Test:** Dismiss the banner via ×, then reload the page multiple times.
**Expected:** Banner never reappears automatically; the toggle click still opens the flow.
**Why human:** Requires multiple real page loads in a persistent profile to confirm the localStorage-gated behavior holds across sessions.

### 8. Dark mode and mobile layout (UI-SPEC conformance)

**Test:** Toggle dark mode; narrow the viewport below 640px.
**Expected:** Banner/bell states render correctly with no hardcoded light-mode colors; banner spans full width with side insets under 640px, no horizontal scroll.
**Why human:** Visual rendering requires an actual browser viewport.

### Gaps Summary

No code-level gaps found. Every artifact this phase claims to have built exists, is substantive (not a stub), and is correctly wired — independently confirmed via source inspection, a fresh `npm install` + live self-test re-run against real Upstash Redis, and live curl probes against the deployed production site. The only open item is the standard end-of-phase human/device verification pass (checks A–H) that this project's workflow explicitly defers rather than fabricates — that deferral is honest and consistent with `02-04-SUMMARY.md`'s own reporting, not a sign of incomplete or hidden work.

---

*Verified: 2026-08-14T00:05:49Z*
*Verifier: Claude (gsd-verifier)*
