---
phase: 02-subscribe-unsubscribe-ux
plan: 02
subsystem: ui
tags: [vanilla-css, vanilla-js-shell, push-api, pwa]

# Dependency graph
requires:
  - phase: 01-backend-foundation
    provides: VAPID public key constant in app.js, Redis subscription schema, CACHE_NAME bump for push shell
provides:
  - Inert #pushSoftAsk banner markup and #pushToggle topbar button markup in index.html, hidden by default
  - CSS for the three #pushToggle bell states (default/subscribed/denied) and the .push-soft-ask floating banner, including a 640px mobile override
  - Locked element-id contract for plan 02-03 to drive with JS (getElementById lookups, hidden/.show toggling, data-push-state attribute)
affects: [02-03-push-behavior]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "data-push-state attribute icon-swap mirrors the existing :root[data-theme] sun/moon display:none/block mechanism, just keyed off the button's own attribute instead of the root"
    - ".push-soft-ask reuses .toast's fixed/bottom/shadow/transition recipe verbatim but swaps the inverted text-on-paper surface for --panel + --line (needs to host a legible secondary button, unlike the toast)"

key-files:
  created: []
  modified:
    - index.html
    - styles.css

key-decisions:
  - "iOS install-first note lives inside the soft-ask banner as #pushIosNote (sibling of #pushSoftAskText, [hidden] by default) rather than near the topbar toggle — locked by the plan's own Planner Decision section, not re-litigated here"
  - "Used literal UTF-8 characters (× and →) instead of numeric/named HTML entities for the close glyph and the iOS note's arrow, matching existing codebase convention (modal-close's × at index.html:205/217, app.js:722's → in a comment) rather than introducing &times;/&rarr; as a new convention; kept &quot; for the note's straight quotes since they sit inside HTML text content"

patterns-established:
  - "Three-state SVG icon swap driven by a single data-* attribute on the button itself (not a root-level attribute) — reusable for any future tri-state icon toggle"

requirements-completed: [OPTIN-01, OPTIN-03, OPTIN-04, OPTIN-06]

# Metrics
duration: ~7min
completed: 2026-08-13
---

# Phase 2 Plan 2: Push Soft-Ask Banner + Topbar Toggle Shell Summary

**Static, inert DOM shell for push opt-in: a hidden bottom soft-ask banner (text + "Activar" + × + iOS note) and a hidden three-state topbar bell toggle in `index.html`, styled entirely from existing `styles.css` tokens/recipes with zero new design primitives.**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-08-13T23:42:00Z
- **Completed:** 2026-08-13T23:45:29Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- `#pushToggle` topbar button inserted between `#themeToggle` and `#installBtn`, reusing the literal `.theme-toggle` class (no new button primitive), carrying `data-push-state="default"`, `hidden` by default, with three sibling bell `<svg>`s (`icon-bell-outline` / `icon-bell-filled` / `icon-bell-slash`) matching the existing sun/moon stroke/attribute set exactly.
- `#pushSoftAsk` banner inserted as a sibling immediately before `#toast`, `hidden` by default, containing `#pushSoftAskText` (locked Spanish body copy), `#pushIosNote` (locked iOS copy, `[hidden]`), `#pushSoftAskAccept` (`.btn.btn-ghost`, visible label exactly "Activar"), and `#pushSoftAskClose` (× glyph, `aria-label="Cerrar"`).
- CSS added for the three `#pushToggle[data-push-state]` icon-swap rules (mirroring the theme icon-swap mechanism), with `--accent` for subscribed and `--text-faint` (never red, commented why) for denied.
- `.push-soft-ask` CSS added, reusing `.toast`'s float/shadow/transition recipe verbatim while diverging on surface (`--panel` + `--line` instead of inverted text-on-paper), radius (`--radius-sm` instead of pill), and omitting `pointer-events: none` since the banner holds live buttons. A `@media (max-width: 640px)` override (added inside the file's existing 640px block) makes it full-width with 12px side insets.
- Zero new custom properties, hex values, shadow values, or font-families introduced; `.btn`, `.btn-ghost`, `.theme-toggle`, `.theme-toggle-icon`, and the sitewide `:focus-visible` rule were all reused as-is (no new focus-visible rules needed since a global one already covers `var(--accent)`).

## Task Commits

Each task was committed atomically:

1. **Task 1: Add the #pushSoftAsk banner and #pushToggle button to index.html** - `60b407b` (feat)
2. **Task 2: Style the banner and the three toggle states in styles.css** - `31c376d` (feat)

**Plan metadata:** (this commit) `docs(02-02): complete push soft-ask shell plan`

## Files Created/Modified

- `index.html` - Added `#pushToggle` (topbar, hidden, three bell SVGs) and `#pushSoftAsk` (bottom banner, hidden, text/iOS-note/Activar/close)
- `styles.css` - Added `#pushToggle[data-push-state]` icon-swap + accent/faint color rules (after the existing dark-mode theme icon-swap block) and `.push-soft-ask`/`.push-soft-ask.show`/`.push-soft-ask-text`/`.push-soft-ask-note`/`.push-soft-ask-close` rules (after `.toast.show`), plus a mobile override inside the existing `@media (max-width: 640px)` block

## Element-ID Contract (for plan 02-03)

Locked and verified in the DOM, ready for `initPushNotifications()` to look up via `getElementById`:

| ID | Element | Initial state | Notes |
|----|---------|----------------|-------|
| `#pushSoftAsk` | `<div class="push-soft-ask">` | `hidden` | 02-03 toggles `hidden` off + adds `.show` for entrance |
| `#pushSoftAskText` | `<p>` | visible (parent hidden) | locked body copy already in place |
| `#pushSoftAskAccept` | `<button class="btn btn-ghost">` | visible (parent hidden) | text "Activar", `aria-label="Activar notificaciones"` |
| `#pushSoftAskClose` | `<button class="push-soft-ask-close">` | visible (parent hidden) | × glyph, `aria-label="Cerrar"` |
| `#pushIosNote` | `<p class="push-soft-ask-note">` | `hidden` (nested) | 02-03 unhides only for iOS-Safari-tab visitors, and correspondingly hides `#pushSoftAskText`/`#pushSoftAskAccept` and keeps `#pushToggle` hidden entirely per the plan's Planner Decision |
| `#pushToggle` | `<button class="theme-toggle" data-push-state="default">` | `hidden` | 02-03 unhides only after confirming push support + non-iOS-tab; icon shown is driven purely by `data-push-state` (`default`\|`subscribed`\|`denied`) |
| `.icon-bell-outline` / `.icon-bell-filled` / `.icon-bell-slash` | `<svg>` inside `#pushToggle` | display:none unless matching state | exactly one visible per `data-push-state` value |

**Consequence of the iOS-note placement decision:** on iOS Safari outside standalone mode, plan 02-03 will show the banner after its dwell delay with only `#pushIosNote` visible (text + accept hidden) and will never unhide `#pushToggle` at all — there is genuinely no functional enable action available until the visitor installs the app, so a hidden toggle is the honest outcome rather than a dead button (OPTIN-03).

## Decisions Made

- Followed the plan's locked Planner Decision verbatim: iOS note lives inside the banner as `#pushIosNote`, not near the toggle.
- Chose literal UTF-8 `×`/`→` characters over HTML entities for consistency with existing `.modal-close` and `app.js` comment usage (entities were only used for the straight quotes inside the iOS note text, which is conventional either way).

## Deviations from Plan

None - plan executed exactly as written. Both tasks' automated verification commands passed on first attempt; no bugs, missing functionality, or blocking issues were encountered.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. This plan is pure static markup/CSS with no JS, no network calls, no new environment variables.

## Next Phase Readiness

- Plan 02-03 can now write `initPushNotifications()` against a stable, verified element-id contract (table above) — every id it needs already exists in the DOM, inert and hidden.
- No blockers. The CSP `<meta>` tag is untouched (byte-identical to before this plan), so 02-03's same-origin `/api/*` fetch calls will work under the existing `connect-src 'self'` policy without any CSP changes.
- Visual QA (per the plan's `<verification>` section: cycling `data-push-state` in DevTools, removing `hidden` from the banner, narrowing the viewport below 640px, toggling dark mode) was not run in this automated pass — recommend a quick manual pass before/during 02-03 execution once the toggle logic exists to drive `hidden`/`.show` for real.

---
*Phase: 02-subscribe-unsubscribe-ux*
*Completed: 2026-08-13*

## Self-Check: PASSED

- FOUND: index.html
- FOUND: styles.css
- FOUND: .planning/phases/02-subscribe-unsubscribe-ux/02-02-SUMMARY.md
- FOUND commit: 60b407b
- FOUND commit: 31c376d
