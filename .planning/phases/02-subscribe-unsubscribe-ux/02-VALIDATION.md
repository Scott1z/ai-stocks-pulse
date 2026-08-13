---
phase: 2
slug: subscribe-unsubscribe-ux
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-08-13
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None exists in this repo (`TESTING.md` confirms: no `package.json`-based test runner, no Jest/Vitest/Playwright config — verification is manual browser testing exclusively, project-wide convention) |
| **Config file** | none — Wave 0 not applicable, see below |
| **Quick run command** | `python3 -m http.server 8000` then manual browser check (existing project convention) |
| **Full suite command** | N/A — no automated suite exists project-wide |
| **Estimated runtime** | manual, ~5-10 min per full 6-behavior pass |

---

## Sampling Rate

- **After every task commit:** manual browser check of the specific behavior just implemented
- **After every plan wave:** full manual pass through all 6 OPTIN behaviors in one browser session, plus one Redis-backed round trip via `scripts/push_redis.py list`/`get` to confirm server-side state matches UI state
- **Before `/gsd:verify-work`:** all 6 success criteria in `ROADMAP.md`'s Phase 2 section manually verified
- **Max feedback latency:** immediate (manual, same session)

---

## Per-Task Verification Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? | Status |
|--------|----------|-----------|-------------------|---------------|--------|
| OPTIN-01 | Soft-ask never appears on load, appears after dwell | manual-only | — (visually confirm banner absent at t=0, present at t=6s) | N/A — no test infra | ⬜ pending |
| OPTIN-02 | Native prompt only after "Activar" click | manual-only | — (DevTools: confirm `Notification.requestPermission()` not called until click) | N/A | ⬜ pending |
| OPTIN-03 | iOS honest message | manual-only (real iOS Safari device/simulator recommended) | — | N/A | ⬜ pending |
| OPTIN-04 | Toggle reflects live state | manual-only | — (toggle browser site permission, reload, confirm icon updates) | N/A | ⬜ pending |
| OPTIN-05 | Unsubscribe deletes server-side | manual + CLI | `python3 scripts/push_redis.py get <endpoint>` (returns nothing after unsubscribe) | Yes — `scripts/push_redis.py` (Phase 1) | ⬜ pending |
| OPTIN-06 | Denied state never re-prompts | manual-only | — (set permission to "Block", reload, confirm no soft-ask/button, only quiet message) | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

None — this project has no test framework by deliberate convention (`TESTING.md`), and introducing one is out of scope for this phase (a cross-cutting infra decision, not a subscribe/unsubscribe UX task). `scripts/push_redis.py` (existing, Phase 1) already covers the one piece of server-side state this phase needs to verify (Redis round trip), so no new verification tooling is required.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|--------------------|
| Soft-ask dwell timing | OPTIN-01 | No test framework; timing/visual state | Load page, confirm banner absent immediately, present at ~6s |
| Native prompt gating | OPTIN-02 | Requires real browser permission API + user gesture | Click "Activar", confirm native prompt appears only then (not before) |
| iOS standalone detection | OPTIN-03 | `navigator.standalone` unreliable via DevTools UA override | Test on real iOS Safari device, both installed and non-installed states |
| Live toggle state | OPTIN-04 | Depends on real browser permission state | Change permission in browser settings, reload, confirm toggle updates |
| Denied-state permanence | OPTIN-06 | Requires real permission "Block" state | Block notifications, reload, confirm quiet message only, no prompts |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies (manual-only, justified above — no test infra exists project-wide, by convention)
- [x] Sampling continuity: no 3 consecutive tasks without a verification step (each task has a manual or CLI-backed check)
- [x] Wave 0 covers all MISSING references (none — no Wave 0 needed)
- [x] No watch-mode flags
- [x] Feedback latency < immediate (manual, same session)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-08-13
