---
phase: 01-backend-foundation
plan: 02
subsystem: infra
tags: [redis, upstash, python, cli, push-notifications]

# Dependency graph
requires: []
provides:
  - "push:subscriptions Redis hash schema (field = sha256(endpoint), value = compact PushSubscription.toJSON())"
  - "scripts/push_redis.py stdlib-only CLI: put/get/list/del/selftest"
  - "Verified live round trip against the upstash-kv-indigo-window Upstash for Redis resource"
affects: [02-subscribe-api, 03-send-push]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Redis hash keyed by sha256(subscription.endpoint) for O(1) idempotent upsert/delete, enumerated with a single HGETALL — never KEYS/SCAN"
    - "urllib.request POST of a JSON command array to Upstash's REST endpoint, one command per request, bearer-token auth read from os.environ or .env.local at runtime"

key-files:
  created: [scripts/push_redis.py]
  modified: []

key-decisions:
  - "Implemented selftest() fully as part of the same file-creation commit (Task 1), since the plan's own Task 1 action already lists selftest() as a required function; Task 2 then only ran/verified it live — no additional code commit was needed for Task 2."

patterns-established:
  - "push:subscriptions schema: HSET/HGET/HGETALL/HDEL only, field = sha256hex(endpoint), value = json.dumps(subscription, separators=(',', ':'), sort_keys=True) — this is the exact shape Phase 2's api/subscribe.js and Phase 3's api/send-push.js must reuse unchanged."

requirements-completed: [BACK-02]

# Metrics
duration: 12min
completed: 2026-08-12
---

# Phase 1 Plan 02: Redis Push-Subscription Schema Summary

**Stdlib-only Python CLI (`scripts/push_redis.py`) locking the `push:subscriptions` Redis hash schema, with a verified live write/read/upsert/enumerate/delete round trip against the provisioned Upstash for Redis resource.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-08-12T22:38:00Z (approx.)
- **Completed:** 2026-08-12T22:50:00Z
- **Tasks:** 2/2 completed
- **Files modified:** 1 (`scripts/push_redis.py`, new)

## Accomplishments
- Locked the canonical `push:subscriptions` Redis hash schema (field = `sha256hex(endpoint)`, value = compact `PushSubscription.toJSON()`) in one reusable stdlib-only CLI, matching STACK.md's "KV Storage Schema" exactly.
- Proved a real write/read/upsert/enumerate/delete round trip against the live `upstash-kv-indigo-window` Upstash resource — both from the repo root (via `.env.local`) and from `/tmp` with credentials supplied purely via process environment variables (the exact contract a Vercel Function will use in later phases).
- Enforced the storage-layer validation gate (`endpoint`, `keys.p256dh`, `keys.auth` all required, non-empty) that `api/subscribe.js` (Phase 2) will reuse.
- Enumeration is a single `HGETALL` everywhere in the file — zero `KEYS`/`SCAN` usage, verified by an automated grep gate (PITFALLS Pitfall 7).

## Task Commits

Each task was committed atomically:

1. **Task 1: Create scripts/push_redis.py — the push:subscriptions Redis CLI** - `0937bfa` (feat) — includes the full `selftest()` implementation per the plan's own Task 1 function list (see Deviations below); Task 2 performed live verification only, no further code changes.

**Plan metadata:** (final commit follows this summary)

## Files Created/Modified
- `scripts/push_redis.py` - Stdlib-only Python 3.9+ CLI (`put`/`get`/`list`/`del`/`selftest`) for the `push:subscriptions` Redis hash; documents the canonical schema in its module docstring; `_load_env()` reads `KV_REST_API_URL`/`KV_REST_API_TOKEN` from the process environment or falls back to parsing `.env.local` at the repo root; `_command()` does a single `urllib.request` POST per Redis command against Upstash's REST endpoint; `put()` validates `endpoint`/`keys.p256dh`/`keys.auth` before any write; `list` prints only `<field>\t<endpoint>`, never key material.

## Decisions Made
- Combined the CLI's core operations (Task 1) and the `selftest()` implementation (Task 2) into a single file/commit, because Task 1's own `<action>` explicitly lists `selftest() -> int` as one of the "Required functions" to create, with a forward-reference to Task 2 for its exact behavior. Writing it once, complete, avoided a churn commit that would have rewritten the same function body. Task 2 then consisted purely of running and verifying the live round trip (no diff to commit).

## Deviations from Plan

None from the substantive requirements — plan executed exactly as specified (schema, validation, CLI surface, selftest behavior, no `KEYS`/`SCAN`, no hardcoded credentials).

**Process note (not a Rule 1-4 deviation):** Task 2 in the plan is written as if it modifies `scripts/push_redis.py` again to add `selftest()`. Since Task 1's action already required implementing `selftest()` in full, there was no second code change to commit for Task 2 — its deliverable (proving the live round trip, twice, with zero residue) was satisfied by running the already-committed script. This is documented here for traceability, not logged as an auto-fixed issue.

## Issues Encountered

- The GSD worktree for this plan (`worktree-agent-a785cf91b2bf5e65f`) did not contain `.planning/phases/01-backend-foundation/` (the plan/context files existed only as uncommitted files in the main checkout). Copied `01-02-PLAN.md` and `01-CONTEXT.md` into the worktree (plain filesystem copy, no git operation) so the plan could be read and this Summary could be written to its expected location. `.env.local` was likewise copied into the worktree from the main checkout (it is git-ignored in both, so this is a local-only, non-committed copy) since the live Redis round trip required real credentials.

## User Setup Required

None - no external service configuration required. Redis (Upstash for Redis) was already provisioned per 01-CONTEXT.md D-01/D-02; this plan only added the schema/CLI and verified it against the already-live resource.

## Next Phase Readiness
- The `push:subscriptions` schema and its validation gate are locked and proven live — Phase 2's `api/subscribe.js` can `HSET`/`HDEL` against this same hash with zero reshaping, and Phase 3's `api/send-push.js` can `HGETALL` the same hash and feed each value directly into `webpush.sendNotification()`.
- `python3 scripts/push_redis.py selftest` is the one-command, repeatable proof of ROADMAP Phase 1 success criterion #3, reusable by future phases for manual debugging/verification.
- No new dependencies were added to the repo (stdlib-only); no blockers for Phase 2/3 planning.

---
*Phase: 01-backend-foundation*
*Completed: 2026-08-12*

## Self-Check: PASSED

- FOUND: scripts/push_redis.py
- FOUND: commit 0937bfa
- FOUND: .planning/phases/01-backend-foundation/01-02-SUMMARY.md
