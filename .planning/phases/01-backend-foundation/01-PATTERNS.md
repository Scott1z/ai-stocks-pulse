# Phase 1: Backend Foundation - Pattern Map

**Mapped:** 2026-08-12
**Files analyzed:** 2 (1 modified, 1 conditionally new)
**Analogs found:** 1 / 2 (self-analog for the modified file; no analog exists for the new file — repo has zero prior npm footprint)

## Scope Note

This phase touches exactly two files, per orchestrator scope and confirmed by CONTEXT.md/ARCHITECTURE.md's "Suggested Build Order" step 1-3 (VAPID keys + Redis provisioning + SW handler is "(A) foundation"):

1. `service-worker.js` — **extend in place**, do not replace or create a second worker.
2. `package.json` (repo root) — **new, conditional.** Per CONTEXT.md's Claude's-Discretion note and STACK.md's Installation section, VAPID key generation can be done via ephemeral `npx web-push generate-vapid-keys` **without** creating a `package.json` at all (npx fetches the package temporarily). Only create `package.json` in this phase if the chosen generation method requires a local install. Recommendation: skip it in Phase 1 — defer the real root `package.json` (with `web-push` + `@upstash/redis` as actual runtime dependencies) to the phase that builds `api/*.js` Functions, since those are the files that actually `import` these packages at runtime. Flag this as a decision point for the plan, not a foregone conclusion.

No other files are in scope for Phase 1 — `app.js` (subscribe UI), `api/*.js` (Functions), and `pipeline/fetch_and_curate.py` (trigger) are later phases (B/C/D in ARCHITECTURE.md's build order) and must NOT be touched here.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `service-worker.js` (modify: add `push` + `notificationclick` listeners, bump `CACHE_NAME`) | service-worker / event-handler | event-driven | `service-worker.js` itself (existing `install`/`activate`/`fetch` listeners in the same file) | exact — self-analog, same file, same conventions must carry forward |
| `package.json` (new, conditional) | config | N/A (dependency manifest, not a data-flow file) | none in repo | no-analog — first npm artifact this repo will ever have |

## Pattern Assignments

### `service-worker.js` (service-worker, event-driven) — ADD `push` + `notificationclick` listeners

**Analog:** the file's own existing `install`/`activate`/`fetch` listeners (read in full — 67 lines, single Read call, no re-reads needed).

**Full current file for reference** (`service-worker.js:1-67`):
```javascript
const CACHE_NAME = "ai-stocks-pulse-v45";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.json",
  "./icons/icon.svg",
  "./icons/icon-maskable.svg",
  "./fonts/Montserrat-Regular.woff2",
  "./fonts/Montserrat-Medium.woff2",
  "./fonts/Montserrat-SemiBold.woff2",
  "./fonts/Montserrat-Bold.woff2",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// data.json cambia cada corrida del pipeline: siempre intentar la red primero
// y solo caer al cache si no hay conexión, para no servir noticias/precios viejos.
function isDataRequest(request) {
  return new URL(request.url).pathname.endsWith("/data.json");
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  if (isDataRequest(event.request)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // App shell: cache-first, red como respaldo.
  event.respondWith(
    caches.match(event.request).then(
      (cached) =>
        cached ||
        fetch(event.request)
          .then((response) => {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
            return response;
          })
          .catch(() => cached)
    )
  );
});
```

**Conventions the new listeners MUST match (extracted from the excerpt above):**

| Convention | Evidence | Apply to new code |
|---|---|---|
| `CACHE_NAME` version string `"ai-stocks-pulse-v45"` bumped by incrementing the trailing integer (line 1) | Per CONTEXT.md's `code_context`: "bumps `CACHE_NAME` manually on every shell-affecting change ... v41→v45 across this session's features" | Bump to `"ai-stocks-pulse-v46"` (or next available integer) as part of this same edit — the push listeners count as a shell change per CONTEXT.md D-discretion note |
| `self.addEventListener("<event>", (event) => { ... });` — top-level, one listener per event type, arrow function callback, double-quoted event name string | Lines 16, 22, 37 | `self.addEventListener("push", (event) => { ... });` and `self.addEventListener("notificationclick", (event) => { ... });` — same shape, appended after the existing `fetch` listener |
| Async work inside a listener is always wrapped in `event.waitUntil(...)`, chaining `.then()`, never `async/await` inside the listener body | Lines 17-19, 23-28 | `push` handler: `event.waitUntil(self.registration.showNotification(...))`. `notificationclick` handler: `event.waitUntil(clients.openWindow(...))` |
| 2-space indentation, double-quoted strings, semicolons on every statement, trailing commas in multi-line arrays (line 13) | Whole file | Match exactly — no Prettier/linter in this repo (per CLAUDE.md Code Style), match by hand |
| Spanish inline comments explaining *why*, placed directly above the code they clarify (lines 31-32) | `isDataRequest` comment | Add a similar Spanish comment above the `push` listener explaining the icon/badge choice and the `data.url` fallback, consistent with this file's existing comment style |
| No helper function extraction unless reused more than once (contrast: `isDataRequest()` is a named helper because it's called from two branches of `fetch`) | Lines 33-35 vs. inline logic elsewhere | `push`/`notificationclick` bodies are each used exactly once — keep them inline in the listener, do not extract needless helper functions |

**Icon/asset path correction (do not follow STACK.md's example literally):**

STACK.md's code example (`STACK.md:56-57`) uses `/icons/icon-192.png` and `/icons/badge-72.png` — **these files do not exist in this repo.** Actual assets present (verified via `ls icons/`):
```
icons/icon.svg
icons/icon-maskable.svg
```
Per CONTEXT.md's `code_context` (`code_context` section, "Reusable Assets"): reuse `icons/icon.svg` / `icons/icon-maskable.svg` directly — these are already referenced in `manifest.json` (`manifest.json:12-23`) and cached as `CORE_ASSETS` in `service-worker.js:8-9`. Use relative paths matching the existing `CORE_ASSETS` convention (`"./icons/icon.svg"`), not absolute `/icons/...`, for consistency with how every other asset in this file is referenced.

**Recommended shape for the two new listeners** (synthesized from the analog conventions above + STACK.md's documented Push API mechanics, corrected for this repo's actual assets):
```javascript
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || "AI QuickCap", {
      body: data.body || "",
      icon: "./icons/icon.svg",
      badge: "./icons/icon.svg",
      data: { url: data.url || "./" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
```
Note: `showNotification`'s `body`/`icon`/`data` options object follows the same "always provide a safe default via `||`" defensive style already used for `data.title` — mirrors this repo's broader convention (per CLAUDE.md Error Handling: "failures degrade silently to a fallback value/state," e.g. `normalizeRealData()`'s field-defaulting in `app.js`).

**No error-handling/try-catch pattern applies here:** the existing `service-worker.js` has zero `try/catch` blocks — its error handling is entirely `.catch()` chains on promises (lines 48, 64) that fall back to a cached/stale response rather than throwing. The new `push` listener should follow the same idiom if `event.data.json()` needs a guard — but note the existing file doesn't even guard `JSON.parse`-equivalent calls elsewhere, so a minimal `event.data ? event.data.json() : {}` ternary (already shown above, matches STACK.md's documented pattern) is sufficient and consistent — do not add a `try/catch` that has no precedent in this file.

---

### `package.json` (config) — conditional, no analog

**No analog exists.** This repository has never had a `package.json`, `node_modules`, or any npm lockfile (confirmed: `ls` of repo root shows no `package.json`; CLAUDE.md Runtime section states this is "a deliberate architectural choice, not an oversight").

**If created in this phase** (only if VAPID generation requires a local install rather than ephemeral `npx`), follow STACK.md's Installation section exactly (`STACK.md:186-201`) — but scope it down to what Phase 1 actually needs:
```bash
npm init -y
npm install -D web-push   # dev-only if used solely for the one-time CLI keygen, not a runtime import yet
```
Do **not** install `@upstash/redis` in this phase — nothing in Phase 1's file scope (`service-worker.js` only) imports it; that dependency belongs to the phase that writes `api/subscribe.js`/`api/send-push.js`. Adding unused dependencies now would misrepresent what this phase's commit actually needs, contradicting the project's stated "lo más simple posible" / minimal-footprint constraint (CLAUDE.md Constraints).

**Preferred alternative (recommended default for the plan):** skip `package.json` in Phase 1 entirely. Run `npx web-push generate-vapid-keys` as a one-off, uninstalled command (`STACK.md:198-201` — "One-time VAPID keypair generation ... not a runtime dependency, just uses the installed web-push CLI"), copy the printed public/private key pair into `.env.local` / Vercel env vars, and let the *real* root `package.json` get created in the later phase that actually adds `import webpush from "web-push"` to a Vercel Function under `api/`. This keeps Phase 1 a pure "keys + Redis + SW" foundation phase with zero new dependency surface, matching ARCHITECTURE.md's phase split ("(A) foundation" is explicitly VAPID + Redis + SW handler only, no mention of `package.json`).

## Shared Patterns

### Manual `CACHE_NAME` version bump on any shell-affecting change
**Source:** `service-worker.js:1`, corroborated by CONTEXT.md (`code_context`, "v41→v45 across this session's features") and CLAUDE.md's Architecture section ("Offline cache" row: "cache name `ai-stocks-pulse-v36`, bumped manually on shell changes")
**Apply to:** `service-worker.js` — bump the trailing version integer by exactly 1 as part of the same commit that adds the `push`/`notificationclick` listeners. This is not optional — CONTEXT.md D-discretion explicitly calls this out as required for this phase.

### Event-listener-only structure, no framework, no module system
**Source:** `service-worker.js` (whole file — no `import`/`export`, no classes, top-level `self.addEventListener(...)` calls only)
**Apply to:** the two new listeners — do not introduce any wrapper/class/module pattern; append flat `self.addEventListener(...)` calls after the existing `fetch` listener, in the same style.

### Defensive/fallback-first defaults instead of throwing
**Source:** repo-wide convention per CLAUDE.md Error Handling ("failures degrade silently to a fallback value/state... no global error boundary") and directly visible in `service-worker.js`'s `.catch(() => cached)` (line 64) / `.catch(() => caches.match(event.request))` (line 48)
**Apply to:** `push` listener's `event.data ? event.data.json() : {}` and the `data.title || "AI QuickCap"` / `data.url || "./"` fallbacks — never let a malformed/missing push payload throw uncaught.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `package.json` | config | N/A | Repo has zero prior npm footprint — no existing config file of this kind to model conventions from. Use STACK.md's Installation section directly (already vetted against this project's dependency-minimalism constraint above), and strongly consider deferring its creation past Phase 1 (see analysis above). |

## Metadata

**Analog search scope:** repo root (`ls`), `service-worker.js` (full read), `icons/` (`ls`), `manifest.json` (full read), `app.js` (`grep` for `addEventListener` and `initServiceWorker`), `DESIGN.md` (`grep` for icon conventions), `.gitignore` (full read)
**Files scanned:** 7 (service-worker.js, manifest.json, app.js [grep only], DESIGN.md [grep only], .gitignore, pipeline/requirements.txt, repo root listing)
**Pattern extraction date:** 2026-08-12
</content>
