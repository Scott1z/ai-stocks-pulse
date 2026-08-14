---
status: partial
phase: 02-subscribe-unsubscribe-ux
source: [02-VERIFICATION.md]
started: 2026-08-14T02:08:15Z
updated: 2026-08-14T02:08:15Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Soft-ask dwell timing (OPTIN-01)
expected: Banner is absent immediately on page load, appears at ~6s dwell, non-blocking
result: [pending]

### 2. Native prompt gesture (OPTIN-02)
expected: Native browser permission prompt fires only after clicking "Activar" in the soft-ask
result: [pending]

### 3. Toggle state on reload (OPTIN-04)
expected: Bell icon in topbar reflects live subscription state after page reload
result: [pending]

### 4. Server-side deletion via real subscription (OPTIN-05)
expected: Unsubscribing via the real UI toggle deletes the row from Redis (verified via `scripts/push_redis.py get <endpoint>`), not just a synthetic self-test fixture
result: [pending]

### 5. Denied state quiet/permanent (OPTIN-06)
expected: Once browser notification permission is denied, no native re-prompt and no soft-ask ever appears again
result: [pending]

### 6. iOS install-first message (OPTIN-03)
expected: On iOS Safari without "Add to Home Screen", an honest install-first message is shown instead of a non-functional enable control
result: [pending]

### 7. Dismissal never nags
expected: Once the soft-ask is dismissed (×), it never reappears in that browser
result: [pending]

### 8. Dark mode / mobile layout
expected: Soft-ask banner and toggle render correctly in dark mode and on mobile viewport widths
result: [pending]

## Summary

total: 8
passed: 0
issues: 0
pending: 8
skipped: 0
blocked: 0

## Gaps
