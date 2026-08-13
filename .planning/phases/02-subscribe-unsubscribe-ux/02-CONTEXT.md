# Phase 2: Subscribe/Unsubscribe UX - Context

**Gathered:** 2026-08-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Visitors can opt in and out of daily push notifications through UI that respects browser-permission and iOS platform constraints, never damaging the visitor's ability to be asked again. Requirements covered: OPTIN-01 through OPTIN-06.

</domain>

<decisions>
## Implementation Decisions

### Soft-ask timing

- **D-01:** The soft-ask does NOT appear on page load. It appears automatically after the visitor has spent a short dwell time (~5-10s) on the page, once they've already seen the day's sector summary — the app has demonstrated its value before asking for a favor. Not gated behind "must be a return visit" — first-time visitors are eligible once the dwell threshold passes.

### Soft-ask visual style

- **D-02:** A discrete, non-blocking banner at the bottom of the screen (toast/banner style, not a centered modal, not a hero-integrated card). Contains explanatory text, an "Activar" button, and a close (X) to dismiss without deciding. Never blocks interaction with the rest of the page.

### Persistent toggle placement

- **D-03:** The always-visible subscribe/unsubscribe toggle lives in the topbar, next to the existing theme toggle button (sun/moon icon) and "Instalar app" button — same ghost-button visual language, not a new component family. This is the control a visitor who dismissed or missed the soft-ask uses to opt in later, and the one an already-subscribed visitor uses to unsubscribe (OPTIN-04, OPTIN-05).

### Claude's Discretion

- Exact dwell-time threshold in seconds/milliseconds before the soft-ask banner appears (research suggested ~5s as a reasonable anchor; not user-specified precisely)
- Exact banner copy (Spanish, matching the site's existing tone) for the soft-ask, the denied-permission quiet message, and the iOS "install first" message
- Whether the soft-ask, once dismissed via the X, should ever reappear later in the same session/visit, or only via the persistent topbar toggle (per FEATURES.md's anti-nagging guidance: never re-prompt automatically — only the deliberate toggle click re-opens the flow)
- iOS standalone-mode detection implementation (`navigator.standalone` / `matchMedia('(display-mode: standalone)')`) and exact placement/copy of the "install first" message — reuses the existing "Instalar app" button pattern per FEATURES.md's explicit recommendation, not a new UI element
- Icon/visual treatment of the topbar toggle in its subscribed vs. unsubscribed vs. denied states

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project & Requirements
- `.planning/PROJECT.md` — full v2 scope and constraints
- `.planning/REQUIREMENTS.md` — OPTIN-01..06 exact wording
- `.planning/ROADMAP.md` — Phase 2 goal, success criteria, depends on Phase 1

### Research (locks UX approach for this phase)
- `.planning/research/FEATURES.md` — table-stakes opt-in UX patterns, the explicit iOS Safari platform-gap section, anti-features (never prompt on load, never re-prompt after dismissal)
- `.planning/research/PITFALLS.md` — Pitfall 2 (permission-prompt UX), Pitfall 3 (iOS Home-Screen-install requirement)
- `.planning/research/ARCHITECTURE.md` — `app.js`'s planned `initPushNotifications()` component boundary

### Existing Code (Phase 1 deliverables this phase builds on)
- `app.js` — existing `const VAPID_PUBLIC_KEY` (Phase 1), existing `initInstallPrompt()`/"Instalar app" button pattern to reuse for iOS messaging, existing `showToast()` function, existing topbar button markup (theme toggle, install button) to match style
- `service-worker.js` — existing `push`/`notificationclick` listeners (Phase 1), unchanged by this phase
- `DESIGN.md` — Buttons component section (ghost-button style), topbar/navigation conventions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `showToast()` in `app.js` — existing toast mechanism, could inform the soft-ask banner's show/hide behavior even though the soft-ask needs a button (not just auto-dismiss text) and a longer/different lifecycle
- Topbar ghost-button pattern (theme toggle, "Instalar app") — the toggle for this phase should visually match these exactly
- `initInstallPrompt()` — existing PWA install-prompt logic; the iOS "install first" messaging for push should reuse this button/flow rather than invent a parallel one

### Established Patterns
- This project's single-accent-color rule and flat/hairline visual language (DESIGN.md) — no new colors, no new shadows for the banner or toggle
- `app.js` has no module system — new `initPushNotifications()` function follows the existing `init*()` naming/wiring convention, called once from `init()`

### Integration Points
- Depends on Phase 1's `VAPID_PUBLIC_KEY` constant and the service worker's existing `push`/`notificationclick` listeners — this phase adds the subscribe/unsubscribe UI and the Vercel Functions (`api/subscribe.js`, `api/unsubscribe.js`) that store/delete Redis records, per ARCHITECTURE.md's component plan

</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond the three decisions above — open to standard approaches for copy, exact timing values, and toggle icon states.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-subscribe-unsubscribe-ux*
*Context gathered: 2026-08-13*
