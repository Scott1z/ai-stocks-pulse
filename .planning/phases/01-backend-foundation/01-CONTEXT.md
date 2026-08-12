# Phase 1: Backend Foundation - Context

**Gathered:** 2026-08-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Pure technical foundation for push notifications — nothing user-facing yet. Delivers: a VAPID key pair, provisioned Redis storage, and a service worker that can receive and display a push notification and handle clicks on it. Requirements covered: BACK-01, BACK-02, BACK-03, BACK-04.

</domain>

<decisions>
## Implementation Decisions

### Redis Provisioning

- **D-01:** Upstash for Redis (Vercel Marketplace) is provisioned NOW, not deferred to implementation time. User completed the marketplace terms acceptance and the CLI install (`vercel integration add upstash/upstash-kv`) during this discussion.
- **D-02:** The resulting resource is `upstash-kv-indigo-window`, connected to the `ai-stocks-pulse` Vercel project across all three environments (Production, Preview, Development). Env vars already present via `.env.local` and Vercel's env store: `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `KV_REST_API_READ_ONLY_TOKEN`, `KV_URL`, `REDIS_URL`. The planner/executor should use these directly — no further provisioning step needed in this phase's plan.

### Claude's Discretion

Everything else in this phase is pure infrastructure with the technical approach already locked in by research (see Canonical References below) — no further user gray areas identified:
- VAPID key pair generation method (e.g., `web-push generate-vapid-keys` or equivalent) and exactly how the private key is set as a Vercel env var
- Redis schema for subscriptions (hash keyed by SHA-256 of `endpoint`, per STACK.md's recommendation)
- Whether to use `@upstash/redis` vs. `@vercel/kv` compatibility wrapper (research recommends `@upstash/redis` as more future-proof)
- Exact `push`/`notificationclick` handler code added to the existing `service-worker.js` (extend in place, do not create a second worker — browsers only allow one active SW per scope)
- `CACHE_NAME` bump in `service-worker.js` to reflect the shell change, per this project's existing convention (see `styles.css`/`app.js` history of manual version bumps)
- How the manually-sent test push (Phase 1 success criterion #1) gets constructed for verification — Claude's call on the simplest reliable method (e.g., a one-off Node script using the new VAPID keys and a manually-created browser subscription)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project & Requirements
- `.planning/PROJECT.md` — full v2 scope, constraints (no accounts, Vercel-only backend, "lo más simple posible"), Key Decisions log
- `.planning/REQUIREMENTS.md` — BACK-01..04 exact wording, out-of-scope list
- `.planning/ROADMAP.md` — Phase 1 goal, success criteria, dependency on nothing (first phase)

### Research (locks the technical approach for this phase)
- `.planning/research/STACK.md` — `web-push` + `@upstash/redis` library choices, VAPID mechanics, Node.js-runtime-not-Edge requirement, Redis schema recommendation
- `.planning/research/ARCHITECTURE.md` — component boundaries (SW vs app.js vs Functions vs pipeline), build order rationale for why Phase 1 comes first
- `.planning/research/PITFALLS.md` — VAPID key handling mistakes, KV access-pattern anti-patterns to avoid from the start

### Existing Code (files this phase extends)
- `service-worker.js` — the service worker to extend with `push`/`notificationclick` listeners (NOT replace); current `CACHE_NAME` convention to follow when bumping
- `DESIGN.md` — existing icon/asset conventions (brand icon paths already used for the PWA manifest, reusable for the notification icon per FEATURES.md's "near-zero extra cost" recommendation)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `icons/icon.svg`, `icons/icon-maskable.svg` (already used in `manifest.json`) — reuse directly as the push notification's `icon`/`badge`, per research's recommendation to avoid new asset design
- Existing `service-worker.js` structure (install/activate/fetch listeners already present) — the `push`/`notificationclick` listeners are new additions to this same file, following its existing event-listener style

### Established Patterns
- This project bumps `CACHE_NAME` manually on every shell-affecting change (see `service-worker.js` history: v41→v45 across this session's features) — the new push listeners count as a shell change and need the same bump
- No `package.json` exists yet at repo root — this phase's Vercel Functions work (later phases) will introduce the first one, scoped to `api/`, per STACK.md; Phase 1 itself may not need it yet if it's just VAPID generation (one-off, could use `npx web-push`) + SW edits (no build step) + Redis provisioning (already done via CLI, no code)

### Integration Points
- Service worker push/click handlers are the client-side half of a contract whose server-side half (the actual send Function) doesn't exist until Phase 3 — Phase 1 only needs to prove the SW *can* display and handle a push, via a manually-constructed test, not a real end-to-end send

</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond the Redis-provisioning decision above — open to standard approaches for VAPID generation and SW handler implementation.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. (Broader v2 scope questions — additional push triggers, personalization, accounts — were already resolved and recorded as Out of Scope in `.planning/PROJECT.md` / `.planning/REQUIREMENTS.md` before this phase's discussion began.)

</deferred>

---

*Phase: 01-backend-foundation*
*Context gathered: 2026-08-12*
