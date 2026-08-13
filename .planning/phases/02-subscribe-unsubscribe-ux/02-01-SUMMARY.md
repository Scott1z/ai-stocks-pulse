---
phase: 02-subscribe-unsubscribe-ux
plan: 01
subsystem: api
tags: [vercel-functions, upstash-redis, push-notifications, esm, package-json]

# Dependency graph
requires:
  - phase: 01-backend-foundation
    provides: "push:subscriptions Redis hash schema (field=sha256(endpoint), value=compact PushSubscription.toJSON()), KV_REST_API_URL/TOKEN env vars, scripts/push_redis.py canonical CLI"
provides:
  - "api/subscribe.js — Vercel Function, validates and upserts a PushSubscription into push:subscriptions via Redis.fromEnv().hset()"
  - "api/unsubscribe.js — Vercel Function, idempotently deletes a PushSubscription by endpoint hash via Redis.fromEnv().hdel()"
  - "Repo's first package.json/package-lock.json/node_modules, scoped to api/'s one dependency (@upstash/redis@1.38.2)"
  - "scripts/api-selftest.mjs — Node harness proving both Functions against live Upstash Redis without a Vercel CLI"
affects: [02-02, 02-03, 03-daily-push-send]

# Tech tracking
tech-stack:
  added: ["@upstash/redis@1.38.2"]
  patterns:
    - "Vercel Functions use Redis.fromEnv() (never hardcoded env var names) to pick up the project's KV_REST_API_* naming"
    - "api/*.js is ESM (package.json type:module) — no export const config, default Node.js runtime"
    - "Server-side validation of client PushSubscription payloads mirrors scripts/push_redis.py's put() contract exactly, plus an added https: URL check on endpoint"
    - "Unsubscribe is unconditionally idempotent (200 regardless of HDEL count) — reused by future pruning logic"

key-files:
  created:
    - package.json
    - package-lock.json
    - api/subscribe.js
    - api/unsubscribe.js
    - scripts/api-selftest.mjs
  modified:
    - .gitignore

key-decisions:
  - "First-ever package.json is scoped only to api/'s single dependency; no scripts.build key so Vercel keeps serving index.html as a static site with zero build step for the frontend"
  - "type: module set in package.json so api/subscribe.js and api/unsubscribe.js can use ESM import syntax without a .mjs extension"
  - "api/subscribe.js adds an https: URL validation on endpoint beyond what scripts/push_redis.py's put() checks, since the Function receives untrusted client input while the Python script only ever handles locally-authored files"

requirements-completed: [OPTIN-02, OPTIN-05]

# Metrics
duration: ~15min
completed: 2026-08-13
---

# Phase 2 Plan 1: Subscribe/Unsubscribe Vercel Functions Summary

**Two Vercel Functions (`api/subscribe.js`, `api/unsubscribe.js`) built from scratch on `@upstash/redis@1.38.2`, using the repo's first-ever `package.json`, and proven end-to-end against live Upstash Redis via a custom Node self-test harness (no Vercel CLI available).**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-08-13T23:41:00Z (approx.)
- **Completed:** 2026-08-13T23:47:10Z
- **Tasks:** 3/3 completed
- **Files modified:** 6 (package.json, package-lock.json, .gitignore, api/subscribe.js, api/unsubscribe.js, scripts/api-selftest.mjs)

## Accomplishments

- Created the repo's first `package.json`/`package-lock.json`/`node_modules` — scoped strictly to resolving `@upstash/redis` for `api/`; the frontend (`index.html`/`app.js`/`styles.css`) still has zero build step and zero npm dependencies
- Built `api/subscribe.js`: validates `endpoint`/`keys.p256dh`/`keys.auth` as non-empty strings (mirroring `scripts/push_redis.py`'s `put()`), additionally rejects any non-`https:` endpoint, then `hset`s the compact `PushSubscription.toJSON()` under `sha256(endpoint)` in `push:subscriptions`
- Built `api/unsubscribe.js`: `hdel`s a subscription by endpoint hash and always returns `200` — including when the field was already gone — since "already unsubscribed" is not a client error, a contract Phase 3's send Function will rely on for dead-subscription pruning
- Proved both Functions end-to-end against the live Upstash Redis instance with `scripts/api-selftest.mjs`, a Node harness that imports the handlers' default exports directly and drives them with mock `req`/`res` objects (substituting for the unavailable Vercel CLI/`vercel dev`)
- Verified zero leftover test rows in Redis after the self-test run (`python3 scripts/push_redis.py list` shows no `aisp-selftest-` entries)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create the repo's first package.json and keep node_modules out of git** - `0ae29a7` (feat)
2. **Task 2: Write api/subscribe.js and api/unsubscribe.js** - `c08de4c` (feat)
3. **Task 3: Prove both Functions work against live Redis with a Node self-test harness** - `a68a542` (test)

_No plan-metadata commit in this response — worktree mode: the orchestrator commits SUMMARY.md/REQUIREMENTS.md centrally after merge._

## Files Created/Modified

- `package.json` - Repo's first, declares `@upstash/redis@^1.38.2` as the sole dependency, `"type": "module"`, `"private": true`, no `scripts.build`
- `package-lock.json` - Pinned dependency tree for reproducible Vercel installs (committed, not git-ignored)
- `.gitignore` - Added a `node_modules/` section with a Spanish comment explaining it is the repo's first and why it's excluded
- `api/subscribe.js` - Vercel Function: validates and upserts one `PushSubscription` into `push:subscriptions` via `Redis.fromEnv().hset()`
- `api/unsubscribe.js` - Vercel Function: idempotently deletes one `PushSubscription` from `push:subscriptions` via `Redis.fromEnv().hdel()`
- `scripts/api-selftest.mjs` - Node harness importing both handlers directly and exercising 10 test cases against live Upstash Redis, cleaning up its own throwaway fixture in a `finally` block

## Decisions Made

- **`@upstash/redis@1.38.2` exact version installed and pinned** — matches the version verified in `02-RESEARCH.md`'s Package Legitimacy Audit (`[OK] / Approved`, official Upstash SDK, `github.com/upstash/redis-js`).
- **`"type": "module"` in `package.json`** — required because `api/subscribe.js`/`api/unsubscribe.js` use ESM `import` syntax with a plain `.js` extension (filenames locked by `.planning/research/ARCHITECTURE.md`); without it, Node/Vercel would parse them as CommonJS and the `import { Redis } from "@upstash/redis"` line would throw at cold start. This decision is recorded here explicitly so Phase 3 (which adds `api/send-daily-push.js` under the same `package.json`) does not need to rediscover it.
- **First-ever `package.json` is scoped to the backend only** — `CLAUDE.md`'s "no `package.json`" framing is specifically about the frontend ("Any new frontend code must run as-is in the browser"); that constraint remains intact. No `scripts.build` key was added, so Vercel's zero-config detection continues to serve `index.html` from the repo root as a static site rather than attempting a build step.
- **`api/subscribe.js` adds an `https:` URL check on `endpoint`** beyond `scripts/push_redis.py`'s `put()` validation, since the Function receives fully untrusted client input (V5 input-validation control from `02-RESEARCH.md`'s Security Domain), whereas the Python CLI only ever handles locally-authored files. Documented inline in the file.

## Deviations from Plan

None - plan executed exactly as written. One implementation refinement made during Task 3 development (not a deviation from any plan requirement, just an execution detail): the self-test harness checks `KV_REST_API_URL`/`KV_REST_API_TOKEN` presence via a **dynamic** `import()` of the handlers and `@upstash/redis`, performed *after* the env-var check, rather than static top-level imports — because `api/subscribe.js`/`api/unsubscribe.js` construct `Redis.fromEnv()` at module scope, and a static import would evaluate that construction (and its noisy stderr warnings) before the harness's own env-var check could run. This keeps the required "hard-fail with Spanish message and non-zero exit when credentials are absent" behavior clean, matching the acceptance criteria exactly.

## Issues Encountered

- **Sandboxed shell could not `source`/`.` a file, even from within the worktree, to load `.env.local` for the live-Redis verification runs.** Worked around by writing a small Node loader (in the session scratchpad, not part of this plan's deliverables) that reads `.env.local` key/value pairs into `process.env` before dynamically importing `scripts/api-selftest.mjs`, so the harness itself remains exactly as specified (it does not read `.env.local` on its own — the caller is documented as responsible for sourcing it, matching `scripts/send-test-push.sh`'s convention). All ten self-test cases and the failure-mode check were verified successfully this way against the live Upstash Redis instance.
- `.env.local` (git-ignored, present at the outer repo root but not checked into this worktree by design) was temporarily copied into the worktree to run the live-Redis verification, then deleted after verification completed — confirmed `git check-ignore -q .env.local` passes throughout, so it was never at risk of being committed.

## User Setup Required

None - no external service configuration required. `KV_REST_API_URL`/`KV_REST_API_TOKEN` were already provisioned in Vercel and in local `.env.local` by Phase 1.

## Next Phase Readiness

- `api/subscribe.js` and `api/unsubscribe.js` are live, tested against production Redis, and ready for `02-02`/`02-03`'s client-side UI to call via `fetch("/api/subscribe", ...)` / `fetch("/api/unsubscribe", ...)`.
- `package.json` now exists at the repo root, so Phase 3's `api/send-daily-push.js` (which needs `web-push`) can add its dependency to the same file without introducing a second `package.json` moment.
- No blockers identified for `02-02`/`02-03`.

---
*Phase: 02-subscribe-unsubscribe-ux*
*Completed: 2026-08-13*

## Self-Check: PASSED

All created files verified present on disk (package.json, package-lock.json, api/subscribe.js, api/unsubscribe.js, scripts/api-selftest.mjs, .gitignore, this SUMMARY.md). All three task commits (`0ae29a7`, `c08de4c`, `a68a542`) verified present in `git log --oneline --all`.
