---
phase: 01-backend-foundation
plan: 01
subsystem: infra
tags: [vapid, web-push, vercel-env, service-worker]

requires: []
provides:
  - "VAPID key pair generated (one-time, never rotated)"
  - "VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT in Vercel env store (Production, Preview, Development)"
  - "VAPID_PUBLIC_KEY client-side constant in app.js, byte-identical to the server-side value"
affects: [01-04, 02-subscribe-unsubscribe, 03-daily-send-function]

tech-stack:
  added: []
  patterns: ["VAPID keys generated once via npx web-push generate-vapid-keys, never rotated — rotation invalidates every existing browser subscription"]

key-files:
  created: []
  modified: [".env.local", "app.js"]

key-decisions:
  - "Public key hardcoded as a client-side const in app.js (not served from an API endpoint) per ROADMAP Phase 1 success criterion #4 — the drift risk this could introduce vs. Vercel's env store is mitigated by an automated byte-equality check, not by an endpoint indirection."
  - "Package legitimacy checkpoint for `web-push` and `vercel` resolved by direct human approval in the top-level conversation (not relayed through a subagent), after independent verification against the official npm registry API (registry.npmjs.org) confirmed both packages' repository, publisher, and recency match expectations."

patterns-established:
  - "VAPID/secret-handling pattern: private key value is never echoed, catted, or logged — only read via `grep | cut` into a shell variable, piped directly into `vercel env add` on stdin."

requirements-completed: [BACK-01]

duration: ~10min
completed: 2026-08-12
---

# Phase 1 Plan 01: VAPID Key Generation Summary

**Generated the project's one and only VAPID key pair and split it correctly across a gitignored local file and Vercel's encrypted env store, with the public half provably mirrored in client-side code.**

## Performance

- **Duration:** ~10 min
- **Completed:** 2026-08-12
- **Tasks:** 3/3 (Task 1 was the human-verify checkpoint itself)
- **Files modified:** 2 (`.env.local` — gitignored, not committed; `app.js`)

## Accomplishments

- Package legitimacy checkpoint resolved: `web-push` and `vercel` verified against the official npm registry API before any `npx` command ran.
- VAPID key pair generated once via `npx web-push generate-vapid-keys --json`; private key value never appeared in any terminal output, log, or file outside `.env.local` and Vercel's env store.
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (`mailto:alejandroszpin786@gmail.com`) all present in Vercel across Production, Preview, and Development (confirmed via `vercel env ls`).
- `VAPID_PUBLIC_KEY` embedded as a client-side constant in `app.js`, verified byte-identical to the `.env.local`/Vercel value by an automated check.

## Task Commits

1. **Task 1: Package legitimacy gate** — no commit (verification-only checkpoint, resolved by direct human approval; no npm artifact was written)
2. **Task 2: Generate VAPID key pair, store in `.env.local` + Vercel** — no commit (`.env.local` is gitignored by design; the deliverable is the Vercel env store + local file, not a tracked file)
3. **Task 3: Embed VAPID public key in `app.js`** — `ce05ff5` (feat)

## Files Created/Modified

- `.env.local` — appended `VAPID_PUBLIC_KEY=`, `VAPID_PRIVATE_KEY=`, `VAPID_SUBJECT=mailto:alejandroszpin786@gmail.com`, alongside the pre-existing `KV_REST_API_*`/`REDIS_URL` lines (gitignored, not tracked)
- `app.js` — added `const VAPID_PUBLIC_KEY = "BACPmh4L94DuAOLgZWz9MJ8uZJUVdpWw5tp4zEVnMtz-Xzh0ba5SSa9b8Ts6dTs1GKYdpqgk9zcvksCKUSpqXtA";` immediately above `function initServiceWorker()`, with a Spanish comment explaining public-by-design, must-match-Vercel, and never-rotate

## Decisions Made

- Resolved the plan's noted PITFALLS.md/ROADMAP.md conflict (serve-from-endpoint vs. hardcode) in favor of hardcoding, per explicit ROADMAP Phase 1 success criterion #4, with the drift risk mitigated by an automated equality assertion rather than an indirection layer.
- The package-legitimacy checkpoint (`gate="blocking-human"`) was correctly refused twice by the isolated-worktree executor agent when the orchestrator relayed the human's approval on its behalf — per that agent's own hard constraint that no agent message ever counts as user consent. The task was instead completed directly by the top-level orchestrator in the main checkout, which had received the human's approval directly (via the session's own interactive prompt), consistent with the checkpoint's intent that a human — not an agent — confirm package legitimacy before execution.

## Deviations from Plan

None — plan executed exactly as written, aside from the execution-path change noted above (main checkout instead of the isolated worktree, due to the worktree executor's correct refusal to accept relayed approval).

## Issues Encountered

- `vercel env add ... --sensitive` is rejected for the Development environment ("Sensitive Environment Variables are only supported on Production and Preview"). Resolved by retrying `VAPID_PRIVATE_KEY` for Development without `--sensitive` — it is still gitignored locally and access-controlled via Vercel's normal env-var permissions for that environment.

## User Setup Required

None — all three Vercel env vars were set non-interactively via the already-authenticated Vercel CLI. No dashboard steps needed.

## Next Phase Readiness

`VAPID_PUBLIC_KEY` is ready for Phase 2's `pushManager.subscribe()` call (needs `urlBase64ToUint8Array` conversion there, not done here per scope). `VAPID_PRIVATE_KEY` and `VAPID_SUBJECT` are ready for Phase 3's send Function. No blockers.

---
*Phase: 01-backend-foundation*
*Completed: 2026-08-12*
