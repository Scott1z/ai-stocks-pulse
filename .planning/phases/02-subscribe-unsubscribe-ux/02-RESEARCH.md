# Phase 2: Subscribe/Unsubscribe UX - Research

**Researched:** 2026-08-13
**Domain:** Web Push opt-in/opt-out UX (browser Push API + Notification permission lifecycle) on a zero-build vanilla JS PWA, plus two new Vercel Functions for Redis-backed subscription storage
**Confidence:** HIGH

## Summary

This phase is almost entirely a UX/state-machine problem, not a technology problem: the browser APIs involved (`Notification.requestPermission()`, `PushManager.subscribe()`, `PushManager.getSubscription()`) are small and already partially exercised by Phase 1's manual test tooling (`scripts/make-test-subscription.js`). The real work is (1) building a correct three-state UI (default / subscribed / denied) plus an iOS platform gate that never shows a non-functional control, and (2) creating the two backend Vercel Functions (`api/subscribe.js`, `api/unsubscribe.js`) that Phase 1 deliberately did not build — despite the phase brief's premise, **these endpoints do not exist yet** in the codebase.

Every visual element this phase introduces is fully specified in `02-UI-SPEC.md` (copy, colors, spacing, exact class names to reuse) — there is no open design question left for research to resolve. What research adds on top of the UI-SPEC is: (a) the exact JS sequencing to satisfy OPTIN-01/02/06 correctly (permission-state gating order matters — checking `Notification.permission` before rendering any CTA is what prevents ever re-showing a dead prompt), (b) the iOS standalone-detection technique with verified caveats, (c) the server-side half (subscribe/unsubscribe Functions + Redis calls) that this phase must also build, and (d) a load-bearing correction: this phase will introduce the repo's **first-ever `package.json`**, a real architectural first for a project whose CLAUDE.md explicitly frames "no `package.json`" as a deliberate choice — this needs to be called out explicitly to the planner, not silently introduced.

**Primary recommendation:** Build `initPushNotifications()` in `app.js` as a single new `init*()` function (permission-state-driven render + three event handlers: soft-ask accept/dismiss, topbar toggle click) wired to two new Vercel Functions (`api/subscribe.js`, `api/unsubscribe.js`) using `@upstash/redis`'s `Redis.fromEnv()` against the Upstash credentials already provisioned in Phase 1 (`KV_REST_API_URL`/`KV_REST_API_TOKEN`). Follow the exact markup/CSS/copy already locked in `02-UI-SPEC.md` — no new visual decisions are needed.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Soft-ask banner display/dismiss logic, dwell-timer, session-seen flag | Browser / Client | — | Pure UI state, `localStorage`-backed, no server round trip needed to decide whether to show it |
| `Notification.requestPermission()` call | Browser / Client | — | Native browser API, must be invoked directly from a user gesture (the "Activar" click) |
| `PushManager.subscribe()` / `getSubscription()` | Browser / Client | — | Native browser API, service-worker-scoped |
| iOS standalone-mode detection | Browser / Client | — | `navigator.standalone` / `matchMedia` are client-only signals, no server involvement possible |
| Topbar toggle icon state (default/subscribed/denied) | Browser / Client | — | Derived entirely from `Notification.permission` + local subscription check, read on each page load |
| Persisting a subscription record | API / Backend | Database / Storage | `api/subscribe.js` validates + writes; Redis is the actual store — client never talks to Redis directly |
| Deleting a subscription record | API / Backend | Database / Storage | `api/unsubscribe.js` deletes; must succeed server-side per OPTIN-05's explicit "not just locally" requirement |
| Subscription persistence | Database / Storage | — | `push:subscriptions` Redis hash (schema locked in Phase 1) |

## User Constraints (from CONTEXT.md)

<user_constraints>
### Locked Decisions

- **D-01 (soft-ask timing):** The soft-ask does NOT appear on page load. It appears automatically after a short dwell time (~5-10s) on the page, once the visitor has already seen the day's sector summary. Not gated behind "return visit" — first-time visitors are eligible once the dwell threshold passes.
- **D-02 (soft-ask visual style):** A discrete, non-blocking banner at the bottom of the screen (toast/banner style, not a centered modal, not hero-integrated). Contains explanatory text, an "Activar" button, and a close (X) to dismiss without deciding. Never blocks interaction with the rest of the page.
- **D-03 (persistent toggle placement):** The always-visible subscribe/unsubscribe toggle lives in the topbar, next to the existing theme toggle button and "Instalar app" button — same ghost-button visual language, not a new component family.

### Claude's Discretion

- Exact dwell-time threshold in seconds/milliseconds before the soft-ask banner appears (research suggested ~5s; UI-SPEC locked **6 seconds** as the default).
- Exact banner copy (Spanish) for the soft-ask, denied-permission quiet message, and iOS "install first" message — **locked in `02-UI-SPEC.md`'s Copywriting Contract**, not open anymore.
- Whether the soft-ask, once dismissed via X, should ever reappear later in the same session/visit — **resolved: never re-triggers automatically after dismissal, per FEATURES.md's anti-nagging guidance; only the topbar toggle re-opens the flow.**
- iOS standalone-mode detection implementation and exact placement/copy of "install first" message — **resolved in UI-SPEC's Component Inventory §3.**
- Icon/visual treatment of the topbar toggle in subscribed/unsubscribed/denied states — **resolved in UI-SPEC's Copywriting Contract and Component Inventory §2.**

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| OPTIN-01 | Soft-ask appears before any native prompt, never on first page load | Dwell-timer pattern (D-01, UI-SPEC §Component Inventory 1); gating condition `Notification.permission === "default"` AND not already seen this session |
| OPTIN-02 | Native permission prompt only fires after explicit soft-ask acceptance | `Notification.requestPermission()` called only inside the "Activar" click handler, never on page load or timer fire |
| OPTIN-03 | iOS visitors without home-screen install see honest "install first" message | `navigator.standalone` / `matchMedia('(display-mode: standalone)')` detection gate, verified HIGH confidence in FEATURES.md; UI-SPEC Component Inventory §3 |
| OPTIN-04 | Persistent toggle reflects live subscription state | Read `Notification.permission` + `pushManager.getSubscription()` on load to derive one of 3 states; topbar `#pushToggle` button, UI-SPEC §Component Inventory 2 |
| OPTIN-05 | One-action unsubscribe, deletes server-side (Redis), not just locally | `api/unsubscribe.js` (new) — `subscription.unsubscribe()` client-side AND `DELETE`/POST to `/api/unsubscribe` server-side, both required |
| OPTIN-06 | Denied permission → quiet help message, never re-prompted | `Notification.permission === "denied"` check gates out both soft-ask and any programmatic re-prompt attempt — this state is permanent and unrecoverable via JS by design |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Web Push API / Notification API (browser-native) | N/A | Client permission + subscription lifecycle | Native browser API, zero dependency, matches project's zero-framework constraint |
| `@upstash/redis` | 1.38.2 `[VERIFIED: npm registry, published 2026-08-13]` | REST-based Redis client used inside `api/subscribe.js` / `api/unsubscribe.js` to read/write the `push:subscriptions` hash | Official Upstash SDK, documented by Upstash's own docs as the recommended client for exactly this Vercel Marketplace integration; already selected in prior-phase research (`.planning/research/STACK.md`), consistent HIGH confidence there |
| Vercel Functions (Node.js runtime) | Vercel's current default (Node 20.x/22.x as of the 2025-2026 dashboard defaults) `[CITED: .planning/research/STACK.md, corroborated by Vercel docs]` | Runs `api/subscribe.js` / `api/unsubscribe.js` | Already the chosen backend platform (site is on Vercel per STATE.md decision log); no Edge-runtime constraint applies to these two functions (unlike Phase 3's `web-push`-dependent send function) since neither does VAPID signing |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None | — | — | This phase needs exactly one new dependency (`@upstash/redis`). Do not add a validation library, router, or `body-parser` — Vercel Functions already parse JSON bodies and the payload shape (`{endpoint, keys: {p256dh, auth}, expirationTime}`) is simple enough to validate by hand, matching the existing `push_redis.py` validation pattern from Phase 1. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@upstash/redis` npm package | Hand-rolled `fetch()` calls to the Upstash REST API (mirroring `scripts/push_redis.py`'s exact `POST [command, ...args]` pattern, zero dependencies) | Would defer introducing `package.json` until Phase 3 (which needs `web-push` regardless and forces `package.json` then). Rejected here because it contradicts the already-locked architecture in `.planning/research/ARCHITECTURE.md` (component table explicitly names `api/subscribe.js`/`api/unsubscribe.js` using the Redis client) and CONTEXT.md's canonical references treat that plan as locked. **Flag to planner:** if minimizing the "first `package.json`" moment to Phase 3 is preferred, the hand-rolled REST approach is a legitimate zero-risk substitute — raise as a discretionary call, not a blocker. |

**Installation:**
```bash
npm install @upstash/redis
```
This is the repo's first-ever `npm install` — creates `package.json`, `package-lock.json`, `node_modules/` at repo root. It changes nothing about the frontend (no bundler, no build step is introduced for `index.html`/`app.js`/`styles.css`); it exists solely so Vercel resolves the two Functions' one dependency. **Flag for planner:** this is worth one explicit sentence in the plan/commit message since CLAUDE.md documents "no `package.json`" as a deliberate architectural choice that this phase is the first to change.

**Version verification:** `npm view @upstash/redis version` confirmed `1.38.2`, published 2026-08-13 (same-day as this research), GitHub source `github.com/upstash/redis-js`.

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| `@upstash/redis` | npm | Long-established SDK (current release 1.38.2, published 2026-08-13; package itself dates to 2021) | High (official SDK for a mainstream Vercel Marketplace integration) | `github.com/upstash/redis-js` | [OK] | Approved |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

slopcheck was run with `--ecosystem npm` (its default is PyPI, which incorrectly reported `@upstash/redis` as hallucinated — a documented cross-ecosystem confusion pitfall, resolved by forcing `--ecosystem npm`). Result: `[OK]`. Note: running `slopcheck install` actually executes `npm install` as a side effect — this was reverted immediately after verification (no `package.json`/`node_modules` left behind by this research session). The planner/executor will need to run the real `npm install @upstash/redis` themselves as part of a task.

## Architecture Patterns

### System Architecture Diagram

```text
Visitor loads page
        │
        ▼
init() → initPushNotifications()
        │
        ├─► Read Notification.permission ("default" | "granted" | "denied")
        │   + reg.pushManager.getSubscription() (async, after SW ready)
        │
        ├─► Render topbar #pushToggle in matching state (default/subscribed/denied)
        │
        ├─► iOS gate: navigator.standalone === false (iOS Safari, not installed)?
        │       │
        │       ├─ YES → never show functional CTA; show "install first" message instead
        │       └─ NO  → proceed normally
        │
        └─► permission === "default" AND not already seen this session?
                │
                ▼
          setTimeout(6000ms) → show #pushSoftAsk banner
                │
      ┌─────────┴─────────┐
      ▼                   ▼
  "Activar" click     "×" click
      │                   │
      ▼                   ▼
Notification.        Hide banner,
requestPermission()  set localStorage
      │               seen-flag (never
      ▼               auto-reappears)
  ┌───┴────┐
  ▼        ▼
granted   denied
  │        │
  ▼        ▼
reg.pushManager    Update toggle to
.subscribe(...)    "denied" state
  │
  ▼
POST /api/subscribe { subscription }
  │
  ▼
api/subscribe.js → Redis.fromEnv()
  .hset("push:subscriptions", sha256(endpoint), JSON)
  │
  ▼
Toast "¡Notificaciones activadas!"
Update topbar toggle to "subscribed"

Unsubscribe path (topbar toggle click while subscribed):
  reg.pushManager.getSubscription()
        │
        ▼
  subscription.unsubscribe()  (client-side, browser push registration)
        │
        ▼
  POST /api/unsubscribe { endpoint }
        │
        ▼
  api/unsubscribe.js → Redis.fromEnv().hdel("push:subscriptions", sha256(endpoint))
        │
        ▼
  Toast "Notificaciones desactivadas."
  Update topbar toggle to "default"
```

### Recommended Project Structure

```
api/
├── subscribe.js       # NEW — Vercel Function, upserts one PushSubscription into Redis
└── unsubscribe.js     # NEW — Vercel Function, deletes one PushSubscription from Redis by endpoint hash
app.js                 # add initPushNotifications() near the other init*()s (after initInstallPrompt, before initServiceWorker — needs SW ready)
index.html             # add #pushSoftAsk banner markup (near #toast), add #pushToggle button in .topbar-actions
styles.css             # add .push-soft-ask, .push-toggle-icon rules — reuse .btn-ghost/.theme-toggle/.toast, no new primitives
package.json           # NEW — repo's first, exists only to declare @upstash/redis for api/
package-lock.json      # NEW — committed alongside package.json
```

### Pattern 1: Permission-state-first rendering (no "generic enable button")

**What:** Every render of the push UI (topbar toggle, soft-ask visibility check, iOS gate) starts by reading `Notification.permission` synchronously, then branches. Never render a control that assumes "default" without checking.

**When to use:** On page load (inside `initPushNotifications()`) and after every subscribe/unsubscribe action completes.

**Example:**
```javascript
// Source: pattern verified against MDN Notification.permission + FEATURES.md
function pushState() {
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    return "unsupported";
  }
  return Notification.permission; // "default" | "granted" | "denied"
}
```
Note: `"granted"` alone does not mean *subscribed* — a visitor can grant browser permission without ever having called `pushManager.subscribe()` (e.g., if a future feature also requests notification permission), or have revoked the Redis-side subscription while permission remains granted. The topbar toggle's true "subscribed" state must additionally check `await reg.pushManager.getSubscription()` returns non-null, not just `permission === "granted"`.

### Pattern 2: iOS standalone-mode gate before any push UI

**What:** Detect iOS + non-standalone context and substitute an honest message for the entire push UI (soft-ask AND topbar toggle both), rather than letting a functional-looking button silently fail.

**When to use:** Once, at the top of `initPushNotifications()`, before deciding whether to wire the soft-ask timer or render an active toggle.

**Example:**
```javascript
// Source: FEATURES.md iOS Safari Explicit Platform Gap section (HIGH confidence,
// corroborated by MDN + WebKit 16.4 release notes + OneSignal/Notificare docs)
function isIosNonStandalone() {
  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isStandalone =
    window.navigator.standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches;
  return isIos && !isStandalone;
}
```
`window.matchMedia('(display-mode: standalone)')` alone is not sufficient on iOS — Safari historically only reliably exposes `navigator.standalone` (a non-standard but long-supported iOS-specific boolean); check both, matching FEATURES.md's explicit dual-check recommendation.

### Pattern 3: Redis client via `Redis.fromEnv()` reusing Phase 1's existing env vars

**What:** `api/subscribe.js`/`api/unsubscribe.js` should call `Redis.fromEnv()` rather than `new Redis({url, token})` with explicit env var names.

**Example:**
```javascript
// Source: https://upstash-redis-js.mintlify.app/platforms/vercel (official docs,
// verified via WebFetch this session — quoted: "This reads from:
// UPSTASH_REDIS_REST_URL or KV_REST_API_URL and UPSTASH_REDIS_REST_TOKEN or
// KV_REST_API_TOKEN ... Redis.fromEnv() works out of the box!")
import { Redis } from "@upstash/redis";
const redis = Redis.fromEnv();
```
This is a load-bearing verification: Phase 1 provisioned `KV_REST_API_URL`/`KV_REST_API_TOKEN` (confirmed in `.env.local` and `scripts/push_redis.py`'s required env vars), not the `UPSTASH_REDIS_REST_*` names shown in Upstash's generic getting-started docs. Without confirming the fallback, a naive implementation following only the generic docs example could hardcode the wrong env var names and silently fail to connect in production. `[CITED: upstash-redis-js.mintlify.app/platforms/vercel]`.

### Pattern 4: Server-side handler shape (no framework)

**What:** Plain Vercel Function handlers, matching the "no Express, no body-parser" recommendation already locked in `.planning/research/STACK.md`.

**Example:**
```javascript
// api/subscribe.js — Node.js Vercel Function (default runtime, no Edge opt-in)
import { Redis } from "@upstash/redis";
import { createHash } from "node:crypto";

const redis = Redis.fromEnv();

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const sub = req.body?.subscription;
  const endpoint = sub?.endpoint;
  const p256dh = sub?.keys?.p256dh;
  const auth = sub?.keys?.auth;
  if (typeof endpoint !== "string" || !endpoint || typeof p256dh !== "string" || !p256dh || typeof auth !== "string" || !auth) {
    return res.status(400).json({ error: "invalid subscription" });
  }

  const field = createHash("sha256").update(endpoint).digest("hex");
  await redis.hset("push:subscriptions", { [field]: JSON.stringify(sub) });
  return res.status(200).json({ ok: true });
}
```
Mirrors the exact validation rules already enforced in `scripts/push_redis.py`'s `put()` function (require `endpoint`, `keys.p256dh`, `keys.auth` as non-empty strings) — reuse that same validation contract server-side so a malformed client payload never reaches Redis, matching the `push:subscriptions` schema locked in Phase 1 (field = `sha256(endpoint)` hex digest, value = compact `PushSubscription.toJSON()`).

### Anti-Patterns to Avoid

- **Calling `Notification.requestPermission()` outside a direct user-gesture handler (soft-ask "Activar" click or topbar toggle click):** some browsers silently ignore or auto-deny permission requests not triggered by a user gesture; always call it synchronously inside the click handler, not after an `await` chain that breaks gesture attribution.
- **Treating `Notification.permission === "granted"` as equivalent to "this visitor has an active Redis subscription":** they are two independently-revocable states (browser permission vs. server-side stored subscription) — always derive the topbar toggle's true state from both signals.
- **Showing a topbar toggle or soft-ask CTA to an iOS Safari tab visitor without the standalone gate:** produces a button that either does nothing on tap or throws inside `pushManager.subscribe()`, reading as a broken feature (explicitly called out as the #1 iOS pitfall in FEATURES.md).
- **Re-prompting after a soft-ask dismissal within the same session:** violates OPTIN-01's spirit and FEATURES.md's anti-nagging guidance; the `localStorage` seen-flag must be sticky per-session (or longer) once dismissed via ×.
- **Skipping server-side deletion on unsubscribe:** calling only `subscription.unsubscribe()` client-side without also calling `/api/unsubscribe` leaves a stale Redis entry that Phase 3's send function would still attempt to push to — violates OPTIN-05 explicitly ("deleted server-side... not just locally").

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| VAPID-key base64url → Uint8Array conversion for `applicationServerKey` | A custom base64 decoder | The existing `urlBase64ToUint8Array`-style helper already proven in `scripts/make-test-subscription.js` (Phase 1) | Already written, already verified end-to-end against the live VAPID key pair in Phase 1's manual test — copy that exact logic rather than reinventing it |
| Redis read/write for subscriptions | Raw `fetch()` calls to the Upstash REST API from inside the Vercel Function | `@upstash/redis`'s `Redis.fromEnv()` + `.hset`/`.hdel` | Official typed client already selected for this exact use case in prior research; hand-rolling REST calls inside the Function (as `push_redis.py` does, for a *different*, dependency-free CLI context) would be redundant now that `package.json` exists anyway for this phase |
| Toast/notification-style UI feedback | A new toast component for subscribe/unsubscribe confirmations | Existing `showToast()` (`app.js:2379`) | Explicitly named as reusable in `02-CONTEXT.md`; zero reason to duplicate |
| iOS/PWA install nudge | A new "please install" UI element | Existing `initInstallPrompt()`/"Instalar app" button pattern (`app.js:2598`), reused per UI-SPEC Component Inventory §3 | Same visual/copy family already established for the identical underlying constraint (PWA installability) |

**Key insight:** every "don't hand-roll" item in this phase is really "don't hand-roll a *second* version of something Phase 1 or the existing app already built once" — the phase's actual net-new surface area is small (one new `init*()` function, two small Vercel Functions, one new banner, one new toggle button).

## Common Pitfalls

### Pitfall 1: Assuming `Phase 1 already delivered /api/subscribe and /api/unsubscribe`

**What goes wrong:** The phase brief handed to this research task explicitly states "Phase 1 already delivered the backend: ... /api/subscribe and /api/unsubscribe Vercel Functions." **This is incorrect** — verified directly against the working tree: no `api/` directory exists anywhere in the repo (`find . -iname "*subscribe*"` returns only the `.planning/phases/02-*` directory itself). Phase 1's actual deliverables (per `ROADMAP.md` and `STATE.md`) were: the VAPID key pair, the `push:subscriptions` Redis *schema* (documented and selftested via the stdlib-only `scripts/push_redis.py` CLI, not a Vercel Function), and the service worker's `push`/`notificationclick` listeners. The two Vercel Functions this phase's own `02-CONTEXT.md` correctly identifies as in-scope ("this phase adds the subscribe/unsubscribe UI **and the Vercel Functions** (`api/subscribe.js`, `api/unsubscribe.js`)") must be built from scratch here.

**Why it happens:** `.planning/research/ARCHITECTURE.md` (written before Phase 1 execution) describes the full 4-phase component plan including these functions, and it's easy to misread "described in architecture research" as "already built in Phase 1."

**How to avoid:** The planner must include explicit tasks to create `api/subscribe.js` and `api/unsubscribe.js`, plus the `package.json`/`@upstash/redis` install, as part of this phase's plan — not treat them as pre-existing integration points to merely "call."

**Warning signs:** Any task description phrased as "wire the UI to the existing `/api/subscribe` endpoint" without a corresponding task to actually create that file.

### Pitfall 2: Stale/expired subscriptions never cleaned up (deferred, but relevant context)

**What goes wrong:** Not this phase's job to fix (Phase 3's SEND-03 handles 410/404 pruning during send), but worth knowing: `api/unsubscribe.js` built here is the same code path Phase 3 will call defensively — so its contract (idempotent delete-by-endpoint-hash, safe to call on an already-deleted subscription) should be designed with that reuse in mind now.

**How to avoid:** `HDEL` on a non-existent field returns `0`, not an error — `api/unsubscribe.js` should return success (200) even when the deletion count is 0, since "already unsubscribed" is not a client error.

### Pitfall 3: Permission-prompt UX — no way back after "Block"

**What goes wrong:** Once a visitor clicks "Block" in the native browser prompt, `Notification.permission` becomes `"denied"` permanently — there is no JS API to reset it. Attempting to call `requestPermission()` again from a denied state either silently no-ops or (in some browsers) never shows a prompt at all.

**Why it happens:** This is an intentional browser security boundary (verified HIGH confidence, `.planning/research/PITFALLS.md` Pitfall 3, corroborated by MDN/web.dev).

**How to avoid:** Gate every code path that could call `requestPermission()` behind `Notification.permission === "default"`. Once `"denied"`, only ever render the quiet help message (UI-SPEC copy already locked) — no button, no retry logic, no "try again" affordance.

**Warning signs:** Any code path where `requestPermission()` is called without first checking current permission state.

### Pitfall 4: Chrome's "quiet permission UI" auto-suppression

**What goes wrong:** Chrome/Edge track an origin's historical grant rate and can auto-downgrade the *native* permission prompt to a quieter, less visible UI (or suppress it) for origins with poor accept rates — meaning a bad early soft-ask → high-decline pattern can degrade the prompt's visibility for *all future visitors*, not just the one who declined.

**Why it happens:** Browser-vendor anti-annoyance heuristic, `[CITED: FEATURES.md, corroborated by Chrome DevRel documentation]`.

**How to avoid:** This is exactly why D-01/D-02's soft-ask-first pattern matters — it filters out visitors who wouldn't have granted anyway before the native prompt ever fires, keeping the site's real grant rate (as tracked by Chrome) higher.

### Pitfall 5: `req.body` shape assumptions in Vercel Functions

**What goes wrong:** Vercel Node.js Functions auto-parse JSON request bodies into `req.body` when `Content-Type: application/json` is set — but a malformed/missing `Content-Type` header from a buggy client-side `fetch()` call can leave `req.body` undefined or a raw string.

**How to avoid:** Client-side `fetch()` calls to `/api/subscribe`/`/api/unsubscribe` must explicitly set `headers: { "Content-Type": "application/json" }`; server-side, defensively check `req.body?.subscription` with optional chaining (as shown in Pattern 4 above) rather than assuming the shape.

## Code Examples

### Client subscribe flow (full sequence)

```javascript
// Source: pattern combines VAPID_PUBLIC_KEY (existing, app.js:2631) +
// scripts/make-test-subscription.js's proven base64 conversion (Phase 1) +
// .planning/research/STACK.md's documented subscribe flow
async function subscribeToPush() {
  const reg = await navigator.serviceWorker.ready;
  const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey,
  });
  const res = await fetch("/api/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscription: sub.toJSON() }),
  });
  if (!res.ok) throw new Error("subscribe failed");
  return sub;
}
```

### Client unsubscribe flow

```javascript
// Source: OPTIN-05's explicit "server-side, not just locally" requirement
async function unsubscribeFromPush() {
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  const endpoint = sub.endpoint;
  await sub.unsubscribe(); // browser-side push registration removed
  await fetch("/api/unsubscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint }),
  }); // server-side Redis deletion — must not be skipped even if this fails silently per this app's error philosophy
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| "Vercel KV" as a provisionable product | Redis via Vercel Marketplace → "Upstash for Redis" integration | December 2024 (Vercel deprecated native KV, auto-migrated to Upstash) | Already correctly reflected in this project's `.env.local`/`scripts/push_redis.py` env var names (`KV_REST_API_URL`/`KV_REST_API_TOKEN` — legacy naming preserved by the migration for backward compatibility, still what the Marketplace integration injects today) |
| `@vercel/kv` npm package | `@upstash/redis` npm package | Ongoing since the KV deprecation | `@vercel/kv` still technically works as a thin wrapper but is legacy naming; new code should use `@upstash/redis` directly, as this research recommends |

**Deprecated/outdated:** None specific to this phase beyond the above (already correctly avoided by the existing Phase 1 work).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Vercel's default Node.js Function runtime (not Edge) applies automatically to `api/subscribe.js`/`api/unsubscribe.js` without any explicit `export const config` | Standard Stack / Architecture | Low — these two functions don't need Node's `crypto` module the way Phase 3's `web-push`-based send function does, so even if Edge were somehow selected, `@upstash/redis` (REST-based) would still work; risk is cosmetic/config-drift at worst |
| A2 | Vercel project has no existing `vercel.json` overriding function routing/runtime | Recommended Project Structure | Low — confirmed no `vercel.json` exists in the repo today; if one is added between now and execution, re-verify the `api/` auto-routing assumption still holds |

**If this table is empty:** N/A — two low-risk assumptions logged above; everything else in this research (package versions, env var fallback behavior, iOS platform constraints, existing code entry points) was verified directly against the live repo, official Upstash docs, or prior-phase research already marked HIGH confidence.

## Open Questions

1. **Should the `package.json`-introduction decision be raised explicitly with the user before execution, given CLAUDE.md's "no `package.json`" framing?**
   - What we know: CLAUDE.md documents zero `package.json` as "a deliberate architectural choice, not an oversight," but that framing is scoped to the *frontend* ("Any new frontend code must run as-is in the browser"). The `.planning/research/STACK.md` (already-completed prior research, referenced as canonical in `02-CONTEXT.md`) explicitly anticipates and accepts this exact tradeoff for the backend Functions.
   - What's unclear: Whether the user has seen/internalized that this specific phase is where that first `package.json` lands (vs. assuming it was a Phase 1 concern already handled).
   - Recommendation: Planner should surface this as a one-line callout in the plan (not re-litigate the decision — it's already implicitly approved via the locked architecture research) so it's not a surprise in a later review.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Local dev of `api/*.js`, `npm install` | Yes | v24.19.0 (local) — Vercel prod runtime independently defaults to 20.x/22.x, both compatible with `@upstash/redis@1.38.2` | — |
| npm | `npm install @upstash/redis` | Yes | 11.17.0 | — |
| Vercel CLI (`vercel dev`) | Local testing of Functions against the Vercel Node runtime before deploy | No | — | Deploy to a Vercel preview environment and test there instead; not blocking since the two functions are simple enough to unit-verify with a local Node script hitting Redis directly (same pattern as `scripts/push_redis.py`'s `selftest`) |
| Upstash Redis (`KV_REST_API_URL`/`KV_REST_API_TOKEN`) | Both new Functions | Yes — already provisioned in Phase 1, present in `.env.local` and verified live via `push_redis.py selftest` | — | — |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** Vercel CLI — use Vercel preview deploys or a local Node smoke-test script instead of `vercel dev`.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None exists in this repo (`.planning/codebase` TESTING.md analysis confirms: no `package.json`, no Jest/Vitest/Playwright config, no `pipeline` test runner — verification is manual browser testing exclusively) |
| Config file | none — see Wave 0 |
| Quick run command | `python3 -m http.server 8000` then manual browser check (per existing project convention, `TESTING.md`) |
| Full suite command | N/A — no automated suite exists project-wide |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| OPTIN-01 | Soft-ask never appears on load, appears after dwell | manual-only | — (visually confirm banner absent at t=0, present at t=6s) | N/A — project has no test infra |
| OPTIN-02 | Native prompt only after "Activar" click | manual-only | — (DevTools: confirm `Notification.requestPermission()` not called until click, via breakpoint or console log) | N/A |
| OPTIN-03 | iOS honest message | manual-only (requires real iOS Safari device or simulator; DevTools UA override to approximate `navigator.standalone` is unreliable — real device recommended) | — | N/A |
| OPTIN-04 | Toggle reflects live state | manual-only | — (toggle permission via browser site settings, reload, confirm toggle icon updates) | N/A |
| OPTIN-05 | Unsubscribe deletes server-side | manual + `scripts/push_redis.py get <endpoint>` (returns nothing after unsubscribe — reuses Phase 1's own verification CLI) | `python3 scripts/push_redis.py get <endpoint>` | Yes — `scripts/push_redis.py` already exists from Phase 1 |
| OPTIN-06 | Denied state never re-prompts | manual-only | — (set permission to "Block" in browser settings, reload, confirm no soft-ask, no button, only quiet message) | N/A |

### Sampling Rate

- **Per task commit:** manual browser check of the specific behavior just implemented (per project's existing, only verification convention)
- **Per wave merge:** full manual pass through all 6 OPTIN behaviors in one browser session, plus one Redis-backed round trip using `scripts/push_redis.py list`/`get` to confirm server-side state matches UI state
- **Phase gate:** all 6 success criteria in `ROADMAP.md`'s Phase 2 section manually verified before `/gsd:verify-work`

### Wave 0 Gaps

None — this project has no test framework by deliberate convention (`TESTING.md`), and introducing one is out of scope for this phase (would be a cross-cutting infra decision, not a subscribe/unsubscribe UX task). `scripts/push_redis.py` (existing, Phase 1) already covers the one piece of server-side state this phase needs to verify (Redis round trip), so no new verification tooling is required.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Subscriptions are anonymous by design (no accounts, per PROJECT.md); the `PushSubscription.endpoint` itself is the de facto identity, consistent with the existing no-login model |
| V3 Session Management | No | No sessions involved |
| V4 Access Control | No | Same-origin, anonymous, no per-user authorization boundary to enforce (any visitor can subscribe/unsubscribe their own browser's subscription — there is nothing to protect one visitor's subscription from another, since endpoints are opaque per-device push-service URLs) |
| V5 Input Validation | Yes | `api/subscribe.js` must validate `endpoint` (string, non-empty, ideally checked to be an `https://` URL matching a known push-service host pattern) and `keys.p256dh`/`keys.auth` (non-empty strings) before writing to Redis — reuse the exact validation already proven in `scripts/push_redis.py`'s `put()` |
| V6 Cryptography | No new surface | SHA-256 hashing of the endpoint (for the Redis hash field) uses Node's built-in `crypto.createHash("sha256")` — same primitive already used server-side in `push_redis.py` (Python `hashlib.sha256`), never hand-rolled |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Malformed/oversized subscription payload sent to `/api/subscribe` (e.g., a non-push-service endpoint URL, or a huge string flooding Redis) | Denial of Service / Tampering | Validate shape (endpoint is a string, keys are non-empty strings) before writing; Vercel Functions have a default body-size limit (typically several MB) that bounds worst-case payload size without extra code |
| Arbitrary endpoint deletion via `/api/unsubscribe` (any caller can POST any `endpoint` string and delete that Redis entry, even one they don't own) | Tampering / Denial of Service | Accepted risk, consistent with the "no accounts" anonymous design — an attacker would need to already know another visitor's exact push endpoint (a long opaque per-device secret-ish URL, never exposed to other clients) to exploit this; not treated as in-scope to fix given the project's explicit anonymous, no-auth architecture. Flag for planner awareness, not a blocking finding — this matches the same trust model already accepted for the existing anonymous `localStorage` watchlist. |
| CSP gap for the new same-origin `fetch()` calls | Tampering | None needed — the existing CSP (`connect-src 'self'`) already permits same-origin `fetch()` to `/api/subscribe`/`/api/unsubscribe` with no change required, since the site is served from the same Vercel origin as its Functions |

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection: `app.js` (VAPID_PUBLIC_KEY, initServiceWorker, initInstallPrompt, showToast, applyTheme/initThemeManager patterns), `service-worker.js` (push/notificationclick listeners), `index.html` (topbar markup, toast/modal-close markup), `styles.css` (.theme-toggle, .btn/.btn-ghost, .toast, .modal-close rules), `scripts/push_redis.py` (canonical Redis schema + validation contract), `scripts/make-test-subscription.js` (proven base64/subscribe flow) — all read directly this session
- `npm view @upstash/redis version` — confirmed `1.38.2`, published 2026-08-13
- `python3 -m slopcheck install @upstash/redis --ecosystem npm` — confirmed `[OK]`
- `https://upstash-redis-js.mintlify.app/platforms/vercel` (official Upstash docs, fetched this session) — confirmed `Redis.fromEnv()` falls back to `KV_REST_API_URL`/`KV_REST_API_TOKEN`
- `.planning/research/FEATURES.md`, `.planning/research/PITFALLS.md`, `.planning/research/ARCHITECTURE.md`, `.planning/research/STACK.md` — prior-phase research explicitly designated canonical by `02-CONTEXT.md`

### Secondary (MEDIUM confidence)
- WebSearch cross-referencing `Redis.fromEnv()` KV_REST_API_URL fallback behavior (corroborated by the primary official-docs fetch above)

### Tertiary (LOW confidence)
- None used

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — `@upstash/redis` version/legitimacy directly verified this session; Node runtime and env var behavior confirmed against official docs
- Architecture: HIGH — component boundaries already locked by prior-phase ARCHITECTURE.md research (canonical per CONTEXT.md) and cross-checked against the actual (currently-missing) `api/` directory
- Pitfalls: HIGH — iOS platform gap, permission-denial permanence, and Chrome quiet-UI suppression are all well-documented, cross-corroborated browser behaviors; the "Phase 1 didn't actually build the API endpoints" finding is a direct, verified codebase discrepancy, not a training-data guess

**Research date:** 2026-08-13
**Valid until:** 30 days (stable browser APIs + a single fast-moving dependency version pin that should be re-verified at execution time if more than a few weeks pass)
