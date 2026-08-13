# Phase 2: Subscribe/Unsubscribe UX - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-13
**Phase:** 2-subscribe-unsubscribe-ux
**Areas discussed:** Soft-ask timing, soft-ask visual style, persistent toggle placement

---

## Soft-ask timing

| Option | Description | Selected |
|--------|-------------|----------|
| Después de un rato mirando la página | Appears automatically ~5-10s after the day's summary has loaded | ✓ |
| Solo si vuelve otro día | Never on first visit, only on a return visit | |
| Nunca aparece sola | No proactive prompt at all, only a persistent button | |

**User's choice:** Después de un rato mirando la página.
**Notes:** First-time visitors are eligible once the dwell threshold passes — not gated behind a return-visit requirement.

---

## Soft-ask visual style

| Option | Description | Selected |
|--------|-------------|----------|
| Banner discreto abajo de la pantalla | Bottom toast/banner, non-blocking, "Activar" button + close X | ✓ |
| Tarjeta dentro del hero | Integrated as a stat card in the hero/summary area | |
| Modal centrado | Centered dialog, blocks interaction until dismissed | |

**User's choice:** Banner discreto abajo de la pantalla.

---

## Persistent toggle placement

| Option | Description | Selected |
|--------|-------------|----------|
| En la topbar, junto al botón de tema | Same row/style as theme toggle and "Instalar app" | ✓ |
| Dentro del banner solamente | No separate control, banner reappears if needed | |

**User's choice:** En la topbar, junto al botón de tema.

---

## Claude's Discretion

- Exact dwell-time threshold (seconds) before the soft-ask banner appears
- Exact Spanish copy for soft-ask, denied-permission message, iOS install-first message
- Whether a dismissed soft-ask ever reappears automatically in-session (leaning no, per anti-nagging research guidance — only the topbar toggle re-opens the flow)
- iOS standalone-mode detection implementation and exact placement of the install-first message
- Toggle icon/visual states (subscribed / unsubscribed / denied)

## Deferred Ideas

None — discussion stayed within phase scope.
