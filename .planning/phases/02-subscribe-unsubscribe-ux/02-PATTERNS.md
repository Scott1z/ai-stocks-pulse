# Phase 2: Subscribe/Unsubscribe UX - Pattern Map

**Mapped:** 2026-08-13
**Files analyzed:** 6 (3 modified, 3 new)
**Analogs found:** 4 / 6 (2 have no in-repo analog — first-of-kind files, flagged below)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `app.js` — new `initPushNotifications()` + helpers | provider (`init*()` bootstrap fn) | event-driven (permission/gesture-triggered) + request-response (fetch to `/api/*`) | `app.js` `initInstallPrompt()` (lines 2598-2621) | exact — same shape: deferred-capability button, one-time init, gesture-gated action, toast feedback |
| `index.html` — `#pushSoftAsk` banner + `#pushToggle` button | component (markup) | request-response (user gesture → JS handler) | `#toast` div (line 273) + `#themeToggle`/`#installBtn` buttons (lines 64-72) | exact — both target elements already exist as siblings to extend |
| `styles.css` — `.push-soft-ask`, `.push-toggle-icon` rules | config (style rules) | n/a | `.toast` (2134-2154), `.theme-toggle` (384-410), `.btn`/`.btn-ghost` (474-491), `.modal-close` (1773-1787) | exact — UI-SPEC mandates reusing these primitives verbatim |
| `api/subscribe.js` (NEW) | route/controller (Vercel Function) | CRUD (create/upsert) | `scripts/push_redis.py` `put()` (lines 149-169) — cross-language logic analog only, no existing JS server file | role-match (logic-level, not language-level) — see "No Analog Found" |
| `api/unsubscribe.js` (NEW) | route/controller (Vercel Function) | CRUD (delete) | `scripts/push_redis.py` `delete()` (lines 200-209) — cross-language logic analog only | role-match (logic-level, not language-level) — see "No Analog Found" |
| `package.json` (NEW) | config | n/a | none — repo's first-ever `package.json` | no analog |

## Pattern Assignments

### `app.js` — `initPushNotifications()` (provider, event-driven + request-response)

**Analog:** `initInstallPrompt()`, `app.js:2598-2621`, plus `initThemeManager()`/`applyTheme()`, `app.js:2555-2596`, plus `showToast()`, `app.js:2379-2385`

**Deferred-capability + gesture-gated action pattern** (`initInstallPrompt`, lines 2598-2621):
```javascript
function initInstallPrompt() {
  const installBtn = document.getElementById("installBtn");
  let deferredPrompt = null;

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.hidden = false;
  });

  installBtn.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") showToast("¡App instalada!");
    deferredPrompt = null;
    installBtn.hidden = true;
  });

  window.addEventListener("appinstalled", () => {
    installBtn.hidden = true;
    showToast("¡App instalada!");
  });
}
```
Copy this shape exactly for `initPushNotifications()`: grab the DOM element(s) by id once at the top, attach one `click` listener per interactive control, call the *native* async browser API (`Notification.requestPermission()` / `pushManager.subscribe()`) directly inside the click handler (never after an unrelated `await` chain — RESEARCH.md's Anti-Pattern #1, gesture attribution), then update DOM state (`hidden`, icon swap) and call `showToast(...)` on completion.

**localStorage read-with-fallback pattern** (`FAVORITES_KEY`, lines 203-209, and `initThemeManager`, lines 2574-2581):
```javascript
const FAVORITES_KEY = "aisp_favorites";
let favorites = new Set();
try {
  favorites = new Set(JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]"));
} catch {
  favorites = new Set();
}
```
```javascript
function initThemeManager() {
  let saved = null;
  try {
    saved = localStorage.getItem(THEME_KEY);
  } catch {
    /* localStorage unavailable — el toggle sigue funcionando, solo no persiste */
  }
  applyTheme(saved);
  ...
}
```
Use this exact try/catch-with-empty-body shape for the soft-ask session-seen flag (`aisp_push_soft_ask_seen`, per UI-SPEC): read defensively at the top of `initPushNotifications()`, write defensively inside the dismiss handler. Never let a `localStorage` throw (private browsing / quota) break the push flow — it should just not persist.

**Toast feedback pattern** (`showToast()`, lines 2379-2385):
```javascript
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove("show"), 3000);
}
```
Call this directly (already global, no import needed — no module system in this file) for all four toast copy strings locked in UI-SPEC's Copywriting Contract (subscribe success/failure, unsubscribe confirmation). Do not build a second toast mechanism for the soft-ask banner itself — the banner is a separate persistent element (`#pushSoftAsk`), not a toast; only the post-subscribe/unsubscribe *confirmations* go through `showToast()`.

**Constant placement + wiring convention** (`VAPID_PUBLIC_KEY`, lines 2623-2631; `init()`, lines 2672-2717):
```javascript
// ---------------------------------------------------------------------------
// Clave pública VAPID — es pública por diseño, segura de enviar al navegador.
// ...
// ---------------------------------------------------------------------------
const VAPID_PUBLIC_KEY = "BACPmh4L94DuAOLgZWz9MJ8uZJUVdpWw5tp4zEVnMtz-Xzh0ba5SSa9b8Ts6dTs1GKYdpqgk9zcvksCKUSpqXtA";

function initServiceWorker() {
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("service-worker.js").catch(() => {});
    });
  }
}
```
`VAPID_PUBLIC_KEY` already exists (Phase 1) — reuse it directly, do not redeclare. `initPushNotifications()` needs `navigator.serviceWorker.ready` (which resolves only after registration), so it must be added to `init()`'s call sequence *after* `initServiceWorker()` (research's Recommended Project Structure explicitly confirms this ordering):
```javascript
  initThemeManager();
  initInstallPrompt();
  initServiceWorker();
  // initPushNotifications();  <-- add here, after initServiceWorker()
  initAutoRefresh();
```
Follow the existing `init*()` naming convention (verb-prefix rule from CLAUDE.md) — this is a one-time setup function wiring listeners, so `init*()` is correct, not `render*()`/`build*()`.

**Base64url → Uint8Array conversion** (proven Phase 1 logic, `scripts/make-test-subscription.js` lines 18-30 — copy verbatim into `app.js` as a small helper, e.g. `urlBase64ToUint8Array()`):
```javascript
const base64 = VAPID_PUBLIC_KEY;
const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
const b64 = padded.replace(/-/g, "+").replace(/_/g, "/");
const raw = atob(b64);
const applicationServerKey = new Uint8Array(raw.length);
for (let i = 0; i < raw.length; i++) applicationServerKey[i] = raw.charCodeAt(i);

const sub = await reg.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey,
});
```
This exact logic already round-tripped successfully against the live VAPID key pair in Phase 1's manual test — do not rewrite it, extract it into a small named helper function and call it from both the soft-ask "Activar" handler and the topbar toggle's subscribe path.

---

### `index.html` — `#pushSoftAsk` banner + `#pushToggle` button (component, request-response)

**Analog:** `#toast` (line 273), topbar buttons (lines 64-72), modal close button (lines 200, 212)

**Toast-sibling insertion point** (line 273):
```html
<div class="toast" id="toast" role="status" aria-live="polite"></div>

<script src="app.js"></script>
```
Insert `<div id="pushSoftAsk" ...>` as a new sibling immediately before this line (UI-SPEC: "inserted once in `index.html` near the existing `<div id="toast">`"), not reusing `#toast`'s element since it needs a persistent button + close control.

**Topbar button pattern** (lines 64-72):
```html
<div class="topbar-actions">
  <span id="marketStatus" class="market-status" ...></span>
  <span id="dataSourcePill" class="demo-pill" ...>DATOS DE DEMOSTRACIÓN</span>
  <button id="themeToggle" class="theme-toggle" type="button" aria-label="Cambiar a modo oscuro" aria-pressed="false">
    <svg class="theme-toggle-icon icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true">...</svg>
    <svg class="theme-toggle-icon icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">...</svg>
  </button>
  <button id="installBtn" class="btn btn-ghost" hidden>Instalar app</button>
</div>
```
Insert `<button id="pushToggle" class="theme-toggle" type="button" data-push-state="default" aria-label="Activar notificaciones">...</button>` between `#themeToggle` and `#installBtn` (D-03's exact placement), reusing the literal `theme-toggle` class (not a new class) and the dual-`<svg>` display-toggle pattern (`icon-sun`/`icon-moon` → this phase's outline-bell/filled-bell/bell-slash, gated by `data-push-state` per UI-SPEC's Component Inventory §2, mirroring how `[data-theme="dark"]` gates the sun/moon icons). No manual margin needed — `.topbar-actions` already has `gap: 12px` (styles.css:382).

**Close-icon-button pattern** (modal close, lines 200/212):
```html
<button class="modal-close" aria-label="Cerrar">×</button>
```
Copy this exact shape (× glyph, `aria-label="Cerrar"`) for the soft-ask banner's dismiss control, adapted to the banner's own class (per UI-SPEC, sized to match modal-close sizing/style, not necessarily the identical class name since the banner sits in a flex row, not absolutely positioned inside a modal panel).

---

### `styles.css` — `.push-soft-ask`, `.push-toggle-icon` (config, n/a)

**Analog:** `.toast` (2134-2154), `.theme-toggle` (384-410), `.btn`/`.btn-ghost` (474-491), `.modal-close` (1773-1787)

**Fixed-position bottom banner pattern** (`.toast`, lines 2134-2150):
```css
.toast {
  position: fixed;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%) translateY(20px);
  background: var(--text);
  border: 1px solid var(--text);
  color: var(--paper);
  padding: 12px 20px;
  border-radius: var(--radius-pill);
  font-size: 0.85rem;
  box-shadow: 0 10px 30px -12px rgba(16, 24, 40, 0.35);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.2s ease;
  z-index: 10;
}
.toast.show {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}
```
Reuse the `bottom: 24px`, opacity/translateY entrance transition, and box-shadow recipe verbatim for `.push-soft-ask` (UI-SPEC explicitly calls out "Toast Float shadow"). Diverge only where UI-SPEC requires it: `--panel` background + `1px --line` hairline border (not `.toast`'s inverted `--text`-on-`--paper` treatment), `4px` radius instead of `--radius-pill` (structural container, not a status pill), and it must not use `pointer-events: none` (the banner holds live buttons, unlike the toast).

**30×30 pill icon-button pattern** (`.theme-toggle`, lines 384-399):
```css
.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  border-radius: var(--radius-pill);
  border: 1px solid var(--line-strong);
  background: transparent;
  color: var(--text-dim);
  cursor: pointer;
  transition: border-color 0.12s ease, color 0.12s ease, transform 0.1s ease;
}
.theme-toggle:hover { color: var(--text); border-color: var(--accent); }
.theme-toggle-icon { width: 15px; height: 15px; }
.theme-toggle .icon-moon { display: none; }
```
`#pushToggle` reuses the `.theme-toggle` class directly per D-03 — no new CSS class needed for the button shell itself. Only add a new `.push-toggle-icon` rule (or reuse `.theme-toggle-icon`'s 15×15 sizing verbatim) plus the three `data-push-state="default|subscribed|denied"` display-toggle rules, mirroring the `:root[data-theme="dark"] .theme-toggle .icon-sun { display: none }` pattern (lines 405-406) but keyed off the button's own `data-push-state` attribute instead of the root theme attribute:
```css
/* pattern to follow, not literal — adapt selector to data-push-state */
#pushToggle[data-push-state="subscribed"] .icon-bell-outline { display: none; }
#pushToggle[data-push-state="subscribed"] .icon-bell-filled { display: block; }
```
Subscribed-state icon fill uses `--accent` (UI-SPEC Color section); denied-state icon/text uses `--text-faint`, never a semantic red.

**Ghost button pattern** (`.btn`/`.btn-ghost`, lines 474-491):
```css
.btn {
  font: inherit;
  font-weight: 600;
  font-size: 0.82rem;
  padding: 9px 16px;
  border-radius: var(--radius-pill);
  border: 1px solid transparent;
  cursor: pointer;
  transition: transform 0.12s ease, border-color 0.12s ease, color 0.12s ease;
}
.btn:active { transform: scale(0.96); }
.btn-ghost {
  background: transparent;
  border-color: var(--line-strong);
  color: var(--text);
}
.btn-ghost:hover { border-color: var(--accent); color: var(--accent); }
```
The soft-ask's "Activar" button is a literal `<button class="btn btn-ghost">` — no new button-style CSS at all, per UI-SPEC's exact `9px 16px` padding callout (do not round to `8px 16px`).

**Close-icon-button pattern** (`.modal-close`, lines 1773-1787):
```css
.modal-close {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--line-strong);
  background: transparent;
  color: var(--text-dim);
  font-size: 1.1rem;
  line-height: 1;
  cursor: pointer;
}
.modal-close:hover { border-color: var(--accent); color: var(--accent); }
```
Adapt (not reuse verbatim, since the soft-ask close sits inline in a flex row, not absolutely positioned) — drop `position: absolute`/`top`/`right`, keep the circular 28px hit-target, hairline border, and hover-to-accent recipe.

---

### `api/subscribe.js` (NEW) — route/controller, CRUD (create/upsert)

**No same-language analog exists** (first-ever `api/` file in the repo). Closest **logic-level** analog: `scripts/push_redis.py`'s `put()` function (Python, but defines the canonical validation contract and Redis command shape this file must mirror).

**Validation contract to mirror** (`scripts/push_redis.py:149-169`):
```python
def put(subscription: dict) -> str:
    endpoint = subscription.get("endpoint")
    keys = subscription.get("keys") or {}
    p256dh = keys.get("p256dh") if isinstance(keys, dict) else None
    auth = keys.get("auth") if isinstance(keys, dict) else None

    if not isinstance(endpoint, str) or not endpoint:
        raise ValueError("La suscripción no tiene un 'endpoint' válido.")
    if not isinstance(p256dh, str) or not p256dh:
        raise ValueError("La suscripción no tiene un 'keys.p256dh' válido.")
    if not isinstance(auth, str) or not auth:
        raise ValueError("La suscripción no tiene un 'keys.auth' válido.")

    field = endpoint_field(endpoint)  # sha256(endpoint).hexdigest()
    value = json.dumps(subscription, separators=(",", ":"), sort_keys=True)
    _command("HSET", SUBSCRIPTIONS_KEY, field, value)
    return field
```
Port this exact validation shape (endpoint / keys.p256dh / keys.auth all required non-empty strings, reject otherwise) and the exact Redis schema (`HSET push:subscriptions <sha256hex(endpoint)> <json>`) into JS, per RESEARCH.md's Pattern 4 code example:
```javascript
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
`Redis.fromEnv()` reads `KV_REST_API_URL`/`KV_REST_API_TOKEN` (already provisioned in `.env.local`/Vercel by Phase 1 — confirmed by `scripts/push_redis.py`'s own env-var names, lines 35-38) — do not hardcode `UPSTASH_REDIS_REST_*` names from generic docs.

---

### `api/unsubscribe.js` (NEW) — route/controller, CRUD (delete)

**No same-language analog exists.** Closest logic-level analog: `scripts/push_redis.py`'s `delete()` function.

**Idempotent-delete contract to mirror** (`scripts/push_redis.py:200-209`):
```python
def delete(endpoint: str) -> int:
    field = endpoint_field(endpoint)
    result = _command("HDEL", SUBSCRIPTIONS_KEY, field)
    try:
        return int(result)
    except (TypeError, ValueError):
        return 0
```
Port to JS with the same idempotency guarantee RESEARCH.md's Pitfall 2 calls out explicitly: `HDEL` on a non-existent field returns `0`, not an error — always respond `200` regardless of whether the field existed, since "already unsubscribed" is not a client error:
```javascript
import { Redis } from "@upstash/redis";
import { createHash } from "node:crypto";

const redis = Redis.fromEnv();

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const endpoint = req.body?.endpoint;
  if (typeof endpoint !== "string" || !endpoint) {
    return res.status(400).json({ error: "invalid endpoint" });
  }

  const field = createHash("sha256").update(endpoint).digest("hex");
  await redis.hdel("push:subscriptions", field);
  return res.status(200).json({ ok: true }); // 200 even if field didn't exist
}
```

---

## Shared Patterns

### Error handling (silent-degradation philosophy)
**Source:** `app.js` — `loadData()`'s whole-fetch try/catch, and every `localStorage` try/catch (e.g. lines 205-209, 2576-2580)
**Apply to:** `initPushNotifications()`'s subscribe/unsubscribe fetch calls and all `localStorage` reads/writes
```javascript
try {
  saved = localStorage.getItem(THEME_KEY);
} catch {
  /* localStorage unavailable — el toggle sigue funcionando, solo no persiste */
}
```
Never `alert()`, never throw uncaught — a failed `/api/subscribe` call should fall through to the locked toast copy "No se pudo activar las notificaciones. Probá de nuevo más tarde." (UI-SPEC Copywriting Contract), matching this project's blanket "never let the page go blank / never surface a thrown exception to the user" rule (CLAUDE.md Error Handling section).

### Toast confirmation
**Source:** `showToast()`, `app.js:2379-2385`
**Apply to:** subscribe success, subscribe failure, unsubscribe confirmation (all four copy strings are pre-locked in UI-SPEC — no new toast mechanism needed)

### Ghost-button visual language
**Source:** `.theme-toggle` (styles.css:384-410) + `.btn-ghost` (styles.css:486-491)
**Apply to:** `#pushToggle` (reuses `.theme-toggle` class directly) and the soft-ask "Activar" button (reuses `.btn.btn-ghost` directly) — zero new button primitives per D-03 and UI-SPEC's Design System section ("this phase introduces zero new design primitives")

### `init*()` naming + wiring convention
**Source:** `app.js` `init()` orchestration, lines 2672-2717; CLAUDE.md Naming Patterns section
**Apply to:** the new `initPushNotifications()` function — must be added to the fixed call sequence inside `init()`, positioned after `initServiceWorker()` (needs `navigator.serviceWorker.ready`) per RESEARCH.md's Recommended Project Structure

### Redis schema + `Redis.fromEnv()` env var fallback
**Source:** `scripts/push_redis.py` (schema docstring, lines 11-33) — canonical schema definition; RESEARCH.md Pattern 3 — confirms `Redis.fromEnv()` JS-client behavior
**Apply to:** both `api/subscribe.js` and `api/unsubscribe.js` — same hash key (`push:subscriptions`), same field derivation (`sha256(endpoint)` hex), same `KV_REST_API_URL`/`KV_REST_API_TOKEN` env vars already provisioned

## No Analog Found

Files with no close match in the codebase (planner should use RESEARCH.md's Code Examples / Pattern 4 instead, cross-referenced against `scripts/push_redis.py`'s validation contract as noted above):

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `api/subscribe.js` | route/controller | CRUD | No `api/` directory exists anywhere in the repo yet — first Vercel Function. Logic-level analog only: `scripts/push_redis.py` (different language, same validation/schema contract) |
| `api/unsubscribe.js` | route/controller | CRUD | Same as above |
| `package.json` | config | n/a | Repo's first-ever `package.json`/`package-lock.json`/`node_modules` — CLAUDE.md documents "no `package.json`" as a deliberate frontend choice; RESEARCH.md's Open Questions section already flags this explicitly for planner awareness (one-line callout recommended in the plan, not a re-litigated decision) |

## Metadata

**Analog search scope:** `app.js` (2719 lines, full read of init/toast/theme/install-prompt/VAPID sections), `index.html` (277 lines, topbar/toast/modal sections), `styles.css` (2227 lines, topbar/button/toast/modal-close sections), `scripts/push_redis.py` (365 lines, full read), `scripts/make-test-subscription.js` (35 lines, full read)
**Files scanned:** 5 read directly (no `api/` directory or `package.json` exist to scan — confirmed via directory listing)
**Pattern extraction date:** 2026-08-13
