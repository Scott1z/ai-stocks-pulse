# Feature Research

**Domain:** Web push notifications (daily digest) for an anonymous, no-account static PWA
**Researched:** 2026-08-12
**Confidence:** HIGH (permission-prompt UX, iOS restriction, tag/renotify, 410 pruning — all corroborated by MDN/web.dev/Chrome DevRel and multiple ESP vendors) / MEDIUM (specific opt-in-rate numbers, which are vendor-marketing claims, not independently verified)

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist, or that browsers/Apple effectively mandate. Missing these makes the feature feel broken or gets the origin auto-blocked by the browser's own heuristics.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Soft-ask before hard permission prompt** | Never trigger the native `Notification.requestPermission()` on first load or first click. Chrome/Edge auto-suppress prompts on sites with historically low grant rates ("quiet permission UI"), so a blind first-load ask actively damages future ability to ask at all. Show your own UI (button/banner) explaining value first; only call the real API after explicit "yes." | LOW | This is CSS/JS + one gating boolean in `localStorage`, no backend. Reuses existing toast/button components per DESIGN.md — no new visual language needed. |
| **Contextual timing, not immediate** | Ask when the value is obvious — e.g., after the visitor has scrolled/engaged with the day's summary, or via a dismissible banner after N seconds/visits — not on page load. | LOW | A simple engagement heuristic (e.g., show soft-ask after hero card has been visible ~5s, or on 2nd visit) is enough; no need for anything sophisticated. |
| **Persistent settings/unsubscribe control** | Users expect a visible, permanent way to see "am I subscribed?" and turn it off — not just a one-time prompt with no way back. Sites that ask once and offer no off-switch are a well-documented UX failure. | LOW–MEDIUM | A small bell/toggle in the topbar (fits existing pill/ghost-button language) that reflects live subscription state: "Notificarme" vs "Notificaciones activadas ✓ (click to disable)." Requires reading `PushSubscription` state on load via `registration.pushManager.getSubscription()`. |
| **One-tap unsubscribe, symmetric with subscribe** | Unsubscribing must be as easy as subscribing — one click, no dead ends, no "email support to opt out." | LOW | `subscription.unsubscribe()` client-side + a DELETE call to remove the row from Vercel KV. Must actually delete server-side, not just flip a flag — otherwise the pipeline keeps sending to a browser that revoked. |
| **Graceful handling of denied/blocked permission** | Once a user clicks "Block" in the native prompt, JS **cannot** re-prompt — `Notification.permission === "denied"` is permanent until the user manually changes it in browser site-settings. The soft-ask UI must detect this state and stop offering the button (or downgrade it to a "notifications are blocked in your browser — see how to re-enable" help link), never keep nagging into a dead prompt. | LOW | Check `Notification.permission` before rendering the CTA at all: `"granted"` → show subscribed state; `"denied"` → show a quiet help link, never a button; `"default"` → show the soft-ask. |
| **Click-to-open behavior, focuses existing tab first** | Clicking the notification should open/focus the app, not just dismiss silently. Best practice: in the `notificationclick` SW handler, call `clients.matchAll({type:'window', includeUncontrolled:true})`, focus a matching already-open tab if one exists, otherwise `clients.openWindow(url)`. Always call `notification.close()` too — some platforms don't auto-dismiss. | LOW–MEDIUM | For this feature, "opens to what page" = the homepage / hero summary (there's no deep-linkable per-notification page — it's a single daily digest, not per-article). Keep it simple: always open `/`. |
| **Respect the promised cadence exactly** | Table stakes for trust: if the pitch is "one push per day at market close," sending zero extra, off-cadence, or duplicate pushes is mandatory. Users who get spammed past the promise unsubscribe/block immediately and that block is often permanent (browser-level, sometimes affects future prompt suppression heuristics too). | LOW (behaviorally) / MEDIUM (operationally — must dedupe if pipeline reruns) | The existing hourly pipeline already runs multiple times a day; the send Function must guard against firing more than once per trading day (e.g., check a "already sent today" flag in KV before dispatching). |
| **Prune dead/expired subscriptions on send** | A meaningful fraction of stored subscriptions go stale over time (uninstalled PWA, revoked permission, browser data cleared, endpoint rotated). The push server returns `404`/`410` for these. Not handling this means the send Function keeps retrying dead endpoints forever, wasting the (small) Hobby-tier budget and slowing the daily send. | LOW–MEDIUM | On `410`/`404` response from `web-push`, delete that subscription's KV entry inline in the same send loop. This is standard behavior of libraries like `web-push` (Node) — check status code, don't just catch-and-ignore. |
| **Basic text notification (title + body)** | The floor: every browser supports title + body text via `showNotification()`. This alone satisfies "daily digest." | LOW | `title`: e.g. "AI QuickCap — Cierre del mercado"; `body`: the existing LLM-written sector narrative (same text as the hero card), possibly truncated to ~150 chars since most OSes truncate long bodies anyway. |
| **HTTPS + valid service worker scope** | Push requires a secure context and an already-registered service worker; the site already has this (PWA offline shell). | N/A (already shipped) | No new work — existing SW registration is the integration point; push subscription logic is added to it, not a second worker. |

### Differentiators (Competitive Advantage)

None of these are required for a working daily-digest push. They add polish but should be weighed against the project's explicit "lo más simple posible" / Hobby-tier-only constraint.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Notification icon/badge matching brand** | `icon` (large, shown in the notification) and `badge` (small monochrome, shown in status bar/Android) options make the push instantly recognizable as AI QuickCap rather than a generic Chrome notification. | LOW | Reuse the existing PWA manifest icon(s) — no new asset design needed. Cheap win, arguably borderline table-stakes rather than a true differentiator, but not universally done so listed here. |
| **Tag + renotify so unopened digests don't stack** | Setting `tag: "daily-digest"` on every push means a new day's notification silently *replaces* yesterday's if the user never opened it, instead of the notification tray accumulating one stale card per missed day. `renotify: true` (requires a non-empty tag) makes the replacement actually alert the user (sound/vibration) rather than swapping silently in the background. | LOW | Directly addresses the spec's own suggested differentiator. Purely client-side (`showNotification()` options in the SW's `push` event handler) — zero backend cost. Recommended: adopt this even though it's optional, since it's nearly free and meaningfully improves the "digest" framing (always current, never a pile-up). |
| **Action buttons (e.g., "Ver resumen" / "Cerrar")** | `actions: [{action, title}]` lets the user act without fully opening the notification (supported on Chrome/Edge/Firefox desktop + Android; **not supported in Safari at all**, including installed iOS PWAs). | MEDIUM | Given the single-CTA nature of "open the daily summary," an action button adds little beyond what click-anywhere already does — and it's unsupported on the one platform (iOS) where friction is already highest. Low value-to-effort here; treat as skippable, not a real differentiator for this specific feature. |
| **Rich image in the notification body** | The `image` option shows a bigger visual than `icon` (e.g., a mini sector-heatmap or chart snapshot) — supported on Chrome/Android, not on Safari/macOS notification banners in the same way. | MEDIUM–HIGH | Would require generating a small image at send time (or reusing the existing `Compartir Resumen` canvas image, resized) and hosting it at a public URL for the push payload to reference. Real effort for a feature only some platforms render; not worth it for a v2 "single daily push" feature — flag as a possible v3 idea if it's ever paired with the existing share-image code. |
| **Delivery confirmation / open-rate analytics** | Knowing how many of the day's sends succeeded (200), how many died (404/410 pruned), and how many were actually opened (via a query param on the click-through URL, e.g. `/?src=push`) tells you whether the feature is worth keeping. | LOW–MEDIUM | Cheap version: log counts (sent/pruned/failed) from the Vercel Function to its own logs — already "free" observability on Vercel, no new infra. Open-rate: append `?utm_source=push` (or similar) to the notification's target URL and check it client-side; store a simple daily counter in KV. This is worth doing even at "lo más simple posible" because it's the only way to validate the feature earned its complexity — recommend as a lightweight differentiator, not the rich per-user analytics a marketing ESP (OneSignal etc.) would offer. |
| **Personalized digest content (e.g., favorites-aware)** | Instead of the same sector summary for everyone, tailor which tickers/movers are called out based on the visitor's `localStorage` watchlist. | HIGH | **Not feasible as designed**: push payloads are sent server-side by a Function that has no access to a given browser's `localStorage` favorites (no accounts, no synced state) — the server only knows a push endpoint exists, nothing about that browser's watchlist. Would require sending watchlist data to the server at subscribe time, which contradicts the "anonymous, device-local" no-accounts principle. Explicitly out of scope, consistent with PROJECT.md's deferred "other triggers" items — not a v2 differentiator. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|------------------|-------------|
| **Prompting for permission on first page load** | Feels like the "obvious" place to ask — maximize exposure to every visitor. | Near-universally identified as the #1 push UX mistake. Grant rates on a cold first-load ask are low, and a denial is *permanent* (no re-prompt possible) — worse, Chrome's built-in "quiet permission UI" heuristic auto-downgrades future prompts for origins with historically poor accept rates, so an early bad ask can suppress the *native* prompt's visibility for all future visitors, not just that one. | Soft-ask UI after a contextual trigger (engagement/scroll/return visit), only calling the real browser API after the user opts in through your own control. |
| **Re-prompting a user who dismissed or ignored the soft-ask** | "They just didn't notice it, ask again on next page." | Repeated asking reads as nagging and trains users to reflexively dismiss/block, which — again — is a *permanent* browser-level state once they hit Block. | Show the soft-ask once per session (or with a real cooldown, e.g. not more than once every N days), and always leave a persistent, low-key entry point (the settings/topbar toggle) so an interested user can opt in later on their own terms instead of being re-asked. |
| **Sending more than the promised one push/day** | Temptation to add "just one more" trigger later (breaking news, big mover) without telling users the cadence changed. | Breaks the trust contract established at opt-in ("one push per day"); users who feel spammed unsubscribe or block at the OS level, which — unlike an in-app unsubscribe — this project has no way to detect or recover from gracefully mid-cycle. PROJECT.md already scopes this out explicitly for v2. | If additional trigger types (favorites price alerts, earnings, breaking news) are ever added, treat them as an *explicit second opt-in* with its own toggle and its own stated cadence — never silently bundled into the existing "daily digest" subscription. |
| **Treating a denied/blocked notification permission as a support problem to solve** | Feels incomplete to leave some users unable to re-subscribe from within the app. | There is no JS API to reset a `denied` permission — it's an intentional browser security boundary, not a bug to work around. Building elaborate in-app "please re-enable" wizards is disproportionate effort for a state the app cannot fix. | A single quiet, honest message with a link/instructions for the browser's own site-settings UI (e.g., "click the lock icon → Notifications → Allow") is standard and sufficient; don't over-engineer this. |
| **Building this feature as if iOS Safari-in-tab visitors can be reached** | The existing app already markets "installable as a PWA," so it's tempting to assume push "just works" everywhere it's already promoted. | **It doesn't, and this is a hard platform wall, not a bug**: since iOS/iPadOS 16.4 (March 2023), Apple only allows web push for a site that has been explicitly added to the Home Screen via Add to Home Screen — a Safari *tab or bookmark*, even to an installable PWA, categorically cannot receive push at all, no workaround, no polyfill. See iOS section below. | Design the opt-in UI to detect this platform state and be honest about it (see iOS section) rather than showing a generic "enable notifications" button that silently fails or never fires the native prompt on iOS Safari tabs. |
| **A native-SaaS-style rich notification-center / in-app inbox** | OneSignal/Firebase-style products often bundle a persistent "notification history" UI inside the app itself. | Massive scope increase (new UI section, new data model, new sync logic) for a feature that is, by design, a single daily push — there is nothing to browse since there's only ever one digest per day and it's the same content already on the homepage. | None needed — the homepage *is* the "inbox": clicking the push just opens the homepage, which already shows today's summary. |
| **Third-party push SaaS (OneSignal, Firebase Cloud Messaging, etc.)** | These handle cross-browser quirks, analytics dashboards, and segmentation out of the box. | Explicitly rejected in PROJECT.md constraints — adds a second account/platform for a single feature, and most have free-tier subscriber caps or paid tiers that conflict with "stay within Vercel's free Hobby tier." Vanilla Push API + VAPID + Vercel KV + Vercel Functions covers 100% of what this single-trigger, no-segmentation feature needs. | Standard Web Push protocol (VAPID keys, `web-push` npm library or equivalent) called from a Vercel Function, subscriptions in Vercel KV — already the chosen approach. |

## Feature Dependencies

```
Service Worker (already shipped, offline shell)
    └──requires──> Push subscription logic added to existing SW
                       └──requires──> VAPID key pair (generated once, public key embedded client-side)
                                          └──requires──> Soft-ask UI (button/banner)
                                                             └──enables──> Native permission prompt
                                                                              └──enables──> subscribe() → PushSubscription object
                                                                                               └──requires──> POST subscription to Vercel Function
                                                                                                                  └──requires──> Vercel KV to store it

Settings/unsubscribe toggle ──requires──> subscription state check (getSubscription()) on every page load
Settings/unsubscribe toggle ──requires──> DELETE endpoint (Vercel Function) to remove KV entry

Daily send (Vercel Function, triggered from existing pipeline run)
    └──requires──> VAPID private key (server-side secret)
    └──requires──> Stored subscriptions in KV
    └──requires──> "already sent today" guard flag in KV (prevents duplicate sends if pipeline reruns)
    └──enhanced by──> tag:"daily-digest" + renotify (client SW push handler, no server dependency)
    └──enhanced by──> 410/404 pruning (deletes dead KV entries as a side effect of sending)
    └──enhanced by──> delivery-count logging / open-rate query param (independent, additive, no blocking dependency)

iOS eligibility gate (soft-ask UI)
    └──requires──> Detecting standalone/installed-PWA context (`navigator.standalone` on iOS Safari, or `matchMedia('(display-mode: standalone)')`)
                       └──conflicts with──> showing the same generic "Enable notifications" CTA to an iOS Safari *tab* visitor (must instead show an "Install this app first" nudge)

Rich content (image, action buttons) ──enhances──> basic notification, but ──conflicts with── Safari/iOS support (silently ignored there, not an error — degrade gracefully, don't rely on it)
```

### Dependency Notes

- **Soft-ask UI requires the existing SW, not a new one:** the app already registers a service worker for the offline app-shell; push subscription (`pushManager.subscribe()`) and the `push`/`notificationclick` event handlers are added to that same file, not a second worker — browsers only allow one active SW per scope anyway.
- **iOS eligibility gate must come before the soft-ask, not after:** if the soft-ask button is shown to an iOS Safari tab visitor and then silently fails to trigger a working prompt (because push isn't available outside standalone/installed mode), that reads as a broken feature. The gate needs a client-side check (`window.navigator.standalone === true` on iOS, or the standards-based `display-mode: standalone` media query) *before* deciding whether to show "Activar notificaciones" vs. "Instalá la app para activar notificaciones."
- **Tag/renotify and 410-pruning are independent of each other and of the core send** — both can be added after the MVP ships without touching the subscribe/unsubscribe flow, useful if phasing this into "MVP" vs "add after validation."
- **Delivery analytics has zero hard dependencies on anything except the send Function existing** — it's pure addition (a log line, a KV counter, a URL param), safe to build last or skip entirely for a true v1.

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed for a working, trustworthy daily push that matches the PROJECT.md requirements.

- [ ] Soft-ask UI (dismissible, contextual — not first-load) gating the native `Notification.requestPermission()` call — table stakes, prevents permanent-denial damage
- [ ] iOS standalone-mode detection, with an honest "install first" message instead of a non-functional button for Safari-tab visitors on iOS — table stakes given this app markets installability
- [ ] Subscribe → POST subscription object to a Vercel Function → store in Vercel KV — core requirement (PROJECT.md Active item)
- [ ] Topbar/settings toggle reflecting live subscription state, doubling as the unsubscribe control — table stakes, required by PROJECT.md ("unsubscribe as easily as they subscribed")
- [ ] Unsubscribe → `subscription.unsubscribe()` client-side + DELETE from KV server-side — table stakes
- [ ] Denied-permission detection → swap CTA for a quiet help message, never re-prompt — table stakes, prevents nagging
- [ ] Daily send Function: reads KV, sends via VAPID/`web-push`-equivalent, triggered from the existing hourly pipeline's market-close run — core requirement (PROJECT.md Active item)
- [ ] "Already sent today" guard in the send Function — prevents duplicate pushes if the hourly pipeline reruns near close — table stakes for respecting the promised cadence
- [ ] Basic text notification (title + body = existing sector narrative) with brand icon/badge — table stakes; icon reuse is near-zero extra cost
- [ ] `notificationclick` handler: focus existing tab if open, else open homepage — table stakes

### Add After Validation (v1.x)

Add once the core send/subscribe/unsubscribe loop is confirmed working in production.

- [ ] `tag: "daily-digest"` + `renotify: true` so a missed day's notification is replaced, not stacked — cheap, client-only, directly serves the "digest" framing; trigger for adding: as soon as v1 subscribe/send is verified working, this is a same-PR-sized addition
- [ ] 410/404 dead-subscription pruning in the send loop — trigger for adding: once there's a real subscriber base large enough for staleness to matter (could even be near-immediate, low effort)
- [ ] Delivery logging (sent/pruned/failed counts) — trigger for adding: once you want to know the feature is worth its complexity, i.e., after the first week of real sends

### Future Consideration (v2+ / deferred)

- [ ] Open-rate tracking via click-through URL param — defer until there's a reason to optimize send copy/timing, not needed to validate the base feature
- [ ] Action buttons on the notification — defer: unsupported on iOS/Safari (this project's most fragile platform already), low marginal value over click-anywhere for a single-CTA digest
- [ ] Rich image in notification — defer: real effort (image generation + public hosting), partial platform support, could later reuse the existing `Compartir Resumen` canvas code if ever pursued
- [ ] Additional push triggers (favorites price alerts, earnings, breaking news) — explicitly deferred in PROJECT.md; each would need its own opt-in and cadence, not bundled into the daily-digest subscription
- [ ] Personalized/favorites-aware digest content — not feasible under the current anonymous, accounts-free architecture without sending watchlist data server-side, which conflicts with the stated no-accounts principle

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Soft-ask opt-in UI | HIGH | LOW | P1 |
| iOS standalone detection + honest messaging | HIGH (prevents a broken/confusing experience for a large chunk of mobile visitors) | LOW | P1 |
| Subscribe → KV storage | HIGH | LOW–MEDIUM | P1 |
| Unsubscribe control (topbar toggle + DELETE) | HIGH | LOW | P1 |
| Denied-permission graceful handling | MEDIUM | LOW | P1 |
| Daily send Function w/ "already sent" guard | HIGH | MEDIUM | P1 |
| Basic notification (title/body/icon) + click-to-focus | HIGH | LOW | P1 |
| tag + renotify (replace unopened digest) | MEDIUM | LOW | P2 |
| 410/404 subscription pruning | MEDIUM (operational hygiene) | LOW | P2 |
| Delivery logging | MEDIUM (product-validation value) | LOW–MEDIUM | P2 |
| Open-rate tracking | LOW–MEDIUM | LOW–MEDIUM | P3 |
| Action buttons | LOW | MEDIUM | P3 (skip candidate) |
| Rich notification image | LOW–MEDIUM | MEDIUM–HIGH | P3 (skip candidate) |
| Personalized digest content | MEDIUM (would be nice) | HIGH, architecturally blocked | Out of scope |

**Priority key:**
- P1: Must have for launch (matches PROJECT.md's "Active" requirements plus the table-stakes UX floor)
- P2: Should have, add right after v1 ships (cheap, additive, no risk to core flow)
- P3: Nice to have, likely skip given platform support gaps and "lo más simple posible" constraint

## iOS Safari: Explicit Platform Gap (flagged per quality gate)

This deserves its own callout because AI QuickCap already markets itself as "installable as a PWA," which creates a real expectation mismatch if not handled explicitly in the opt-in UI.

- **The rule, precisely:** Since iOS/iPadOS 16.4 (released March 2023), Apple's WebKit only allows a site to request/receive Web Push if that site has been added to the device's Home Screen (Add to Home Screen) and is being viewed in **standalone mode** (launched from its home-screen icon). A visitor using Safari normally — even repeatedly, even to a site that is technically "installable" — **cannot** receive push notifications from an open browser tab. There is no workaround, flag, or polyfill; this is a deliberate Apple platform restriction, not a temporary bug. (HIGH confidence — corroborated by MDN, WebKit release notes coverage, and multiple push-vendor documentation pages independently.)
- **Practical implication for this project:** every iOS visitor who hasn't already tapped "Add to Home Screen" will see either (a) no working opt-in button at all, or — if not gated — (b) a button that appears to do something but the permission prompt never fires / silently fails. Both are bad; (b) is actively broken UX.
- **Recommended handling (table stakes, not optional, for this app specifically):**
  1. Detect standalone/installed mode client-side: `window.navigator.standalone === true` (iOS-specific, older/more reliable signal) or the standards-based `window.matchMedia('(display-mode: standalone)').matches` (works cross-platform, including Android/desktop PWAs).
  2. If iOS + **not** standalone → don't show "Activar notificaciones" at all. Show a short, honest instruction instead: e.g. "En iPhone, instalá la app (Compartir → Agregar a inicio) para poder activar las notificaciones" — reusing the existing "Instalar app" ghost-button pattern already in DESIGN.md's Buttons component rather than inventing new UI.
  3. If iOS + standalone (already installed and launched from home screen) → the soft-ask flow behaves normally, same as desktop Chrome/Firefox/Edge and Android Chrome.
  4. Android Chrome/Firefox and desktop Chrome/Firefox/Edge/Safari (macOS Safari 16+) support push from an ordinary browser tab — no install requirement there. Don't over-generalize the iOS gate to other platforms.
- **Why this matters for the roadmap:** this detection/messaging logic is not an edge case to bolt on later — it's core to whether the opt-in UI is honest at all for a meaningful slice of mobile traffic, and it directly touches the existing "Instalar app" install-prompt feature (DESIGN.md's Buttons/Navigation section), so the two should likely be designed and built together rather than as separate, disconnected phases.

## Sources

- [The Ultimate Guide to Not F#!@ing Up Push Notifications — Stéphanie Walter](https://stephaniewalter.design/blog/the-ultimate-guide-to-not-fck-up-push-notifications/) — soft-prompt strategy, cadence guidance (MEDIUM-HIGH confidence, independent UX researcher, cross-checked against web.dev)
- [Permission UX — web.dev / web-push-book (Chrome DevRel, Gauntface)](https://web-push-book.gauntface.com/permission-ux/) — soft-ask pattern, denied-state handling, settings-panel pattern (HIGH confidence, official Chrome documentation lineage)
- [Permission UX — web.dev articles](https://web.dev/articles/push-notifications-permissions-ux) — timing/context guidance, unsubscribe UI expectations (HIGH confidence)
- [OneSignal: Get your audience to "Add to Home Screen"](https://documentation.onesignal.com/docs/en/getting-your-audience-to-add-to-home-screen) — iOS 16.4+ Add-to-Home-Screen requirement (MEDIUM-HIGH confidence, major ESP vendor doc, consistent with WebKit's own 16.4 release notes coverage)
- [Notificare: Web Push in iOS: Add to Home Screen (2024)](https://notificare.com/blog/2024/09/16/web-push-in-ios-add-to-home-screen/) — corroborates iOS standalone-mode requirement (MEDIUM confidence, secondary vendor source, agrees with OneSignal)
- [MDN: Notification.tag](https://developer.mozilla.org/en-US/docs/Web/API/Notification/tag) and [MDN: Notification.renotify](https://developer.mozilla.org/en-US/docs/Web/API/Notification/renotify) — tag/renotify replace-notification behavior (HIGH confidence, official browser API reference)
- [web.dev: Notification behavior](https://web.dev/articles/push-notifications-notification-behaviour) — tag/renotify practical use, action button platform support notes (HIGH confidence)
- [MDN: ServiceWorkerGlobalScope notificationclick event](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/notificationclick_event) — click-to-open/focus pattern (HIGH confidence, official reference)
- [Web Push Book: Common Notification Patterns](https://web-push-book.gauntface.com/chapter-05/04-common-notification-patterns/) — `clients.matchAll()` + `openWindow()` focus-or-open pattern (HIGH confidence)
- [Pushpad: Web Push Error 410](https://pushpad.xyz/blog/web-push-error-410-the-push-subscription-has-expired-or-the-user-has-unsubscribed) and [Pushpad: how to check if a push endpoint is still valid](https://pushpad.xyz/blog/web-push-how-to-check-if-a-push-endpoint-is-still-valid) — 410/404 pruning pattern, `pushsubscriptionchange` event (MEDIUM-HIGH confidence, vendor doc but describes standard Push protocol behavior, cross-checked against W3C mailing-list discussion)
- [web.dev: Sending messages with web push libraries](https://web.dev/articles/sending-messages-with-web-push-libraries) — VAPID/library-level send patterns (HIGH confidence)
- Project context: `/Users/alejandroszpin/Documents/CLAUDE CODE #001/ai-stocks-pulse/.planning/PROJECT.md` and `/Users/alejandroszpin/Documents/CLAUDE CODE #001/ai-stocks-pulse/DESIGN.md` — existing requirements, constraints, and component language reused throughout this document

---
*Feature research for: web push notifications (daily digest) on a static, anonymous, no-account PWA*
*Researched: 2026-08-12*
