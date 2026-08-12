# Pitfalls Research

**Domain:** DIY Web Push Notifications (no third-party SaaS) — static PWA + Vercel Functions + Vercel KV, triggered by external GitHub Actions cron
**Researched:** 2026-08-12
**Confidence:** HIGH (Vercel platform limits, W3C Push API/VAPID spec, iOS Safari requirements verified against current official docs) / MEDIUM (KV free-tier exact numbers, since Vercel KV migrated to a Marketplace Upstash integration and pricing pages are inconsistent)

## Critical Pitfalls

### Pitfall 1: VAPID key/subject mismatches and leaked private keys

**What goes wrong:**
The private VAPID key gets committed to the repo (e.g. dropped into a `.env` file that isn't gitignored, or hardcoded "temporarily" during testing), or the public key baked into the client's `applicationServerKey` doesn't match the private key used server-side to sign push requests. Mismatched keys cause every single `web-push` send to fail with `401 Unauthorized` / `403 Forbidden` from the push service — but only at send time, which for this project is once a day, so the bug can sit undetected for a full day cycle before anyone notices no one got a notification.

**Why it happens:**
VAPID keys are generated once (`web-push generate-vapid-keys`) and pasted in two places — the client bundle (public key, as a `Uint8Array` conversion of a base64url string) and the server env vars (both keys + subject). It's easy to regenerate keys once "for testing" and forget to update the client, or to paste the public key from a *different* generated pair than the private key.

**How to avoid:**
- Generate VAPID keys exactly once, store private key + public key + subject as Vercel encrypted environment variables (never in repo, never in client-visible code).
- Expose the public key to the client via a small server endpoint (e.g. `/api/vapid-public-key`) or inject it at build/deploy time from the same env var — never hardcode it separately in the frontend JS so there is only one source of truth.
- Add a startup/self-check in the send Function: on cold start, log a hash (not the value) of the configured public key so mismatches are diagnosable from logs without exposing secrets.
- `.gitignore` any local `.env` files before ever touching push code; this project has no `package.json`/build step yet, so it's tempting to hardcode keys directly in a script — resist this.

**Warning signs:** Every push send returns 401/403 in Function logs; subscribe succeeds (client-side) but nothing ever arrives; works in local testing with a different key pair than production.

**Phase to address:** Backend foundation phase (VAPID generation, KV schema, env var setup) — before any client opt-in UI is built.

---

### Pitfall 2: Stale/expired subscriptions never cleaned up

**What goes wrong:**
Users uninstall the PWA, clear site data, switch browsers, or the push service (FCM/Mozilla autopush/Apple) invalidates the subscription server-side. The push service then returns `410 Gone` (permanently invalid) or `404 Not Found` when you try to send. If the send Function doesn't catch and act on this, the dead subscription stays in KV forever. At small scale this just wastes a few requests; at any real scale it means every daily send does full work for accumulating dead weight, KV read/write costs balloon for no benefit, and CPU/wall time on the send Function creeps upward — potentially far enough for a large chunk of subscribers to blow past a Function's execution window.

**Why it happens:**
The Web Push standard gives no way to proactively check if a subscription is still valid — the only reliable signal is the HTTP status code you get back *when you actually try to send*. Developers build the "subscribe" and "send" paths first and treat send-time errors as a footnote, not core logic.

**How to avoid:**
- Treat the daily send loop as: send → inspect status code → on `410` or `404`, delete that subscription's key from KV in the same pass (don't defer to a "cleanup job" you'll never build).
- Also implement the `pushsubscriptionchange` event in the service worker (fires when the browser silently rotates/invalidates a subscription) — re-subscribe and PUT the new subscription to your API automatically, avoiding a chunk of the 410s in the first place.
- Log a daily count of "sent / cleaned up / failed (other)" from the send Function so silent decay is visible in Vercel logs without needing a dashboard.
- Never assume 2xx-forever; a subscription valid last week can be dead today with zero client-side signal.

**Warning signs:** KV subscriber count keeps growing but never shrinks; send Function duration creeps up week over week; delivery rate (successful sends / total attempted) trends downward over time.

**Phase to address:** Send-function phase — cleanup-on-410 must ship in the same phase as the first working send, not deferred to "later polish."

---

### Pitfall 3: Asking for permission with no context, and no way back after "Block"

**What goes wrong:**
The classic mistake is prompting `Notification.requestPermission()` on page load or on first visit, before the user has any reason to trust the site. Chrome/Firefox data consistently shows this pattern gets denied 85-95% of the time. Once a user clicks "Block," the native browser permission is sticky — JavaScript can never show the prompt again (`Notification.permission` stays `"denied"` and calling `requestPermission()` again just returns `"denied"` silently, no dialog). If the only UI for enabling push was the initial nag with no persistent, findable "Enable notifications" control elsewhere in the app, that user is permanently locked out unless they dig into browser site settings themselves — and most won't.

**Why it happens:**
Developers wire the permission request directly to "page loaded" or "service worker registered" because it's the simplest code path, not because it's good UX. And they don't build a fallback path for the "already denied" state because it doesn't come up in a five-minute manual test.

**How to avoid:**
- Gate the permission request behind a deliberate user action (a visible "Notify me daily" toggle/button reusing the existing pill-button/toast components per `DESIGN.md`), never on load.
- Use a "soft ask" first: a custom in-app prompt explaining the value ("Get today's AI-sector summary at market close") with its own accept/dismiss, and only call the *real* `requestPermission()` after the user opts into the soft ask. This burns the one native permission shot only when the user is already bought in.
- Detect `Notification.permission === "denied"` and show a persistent, dismissible explainer ("Notifications are blocked — enable them in your browser's site settings") rather than hiding the feature or silently failing. Since re-prompting isn't possible, the UI's job shifts to *instructing*, not requesting.
- Store opt-in/opt-out state client-side too (not just inferred from subscription existing in KV) so the UI can render "you're subscribed" / "you're blocked" / "not yet asked" correctly across visits.

**Warning signs:** High bounce on first-visit permission prompts (check via a simple event ping before build-out); support/feedback mentioning "notifications don't work" with no visible way to fix it in-app.

**Phase to address:** Client opt-in UX phase.

---

### Pitfall 4: iOS Safari push silently doing nothing for non-installed users

**What goes wrong:**
Web Push on iOS/iPadOS only works for PWAs added to the Home Screen via Safari's Share → "Add to Home Screen" — it does **not** work in a regular Safari tab, and it does not work in any other iOS browser (Chrome/Firefox on iOS are all Safari WebKit under the hood and share this restriction). Support requires iOS/iPadOS 16.4+ (March 2023). If a user on iPhone Safari clicks "Enable notifications" while just browsing the tab (not installed), `PushManager.subscribe()` will throw, or in some iOS versions `Notification`/`PushManager` won't even exist on `window` — and if this isn't specifically detected and messaged, the feature just silently fails or throws a console error the user never sees, and they conclude "the button is broken."

**Why it happens:**
Developers test on desktop Chrome (where push "just works" without any installation step) and Android Chrome (same), then assume iOS behaves the same modulo minor quirks. The installed-PWA requirement is iOS-specific and easy to miss without deliberately testing on a physical iPhone in both installed and non-installed states.

**How to avoid:**
- Feature-detect explicitly: check `window.matchMedia('(display-mode: standalone)').matches` (or `navigator.standalone` on iOS Safari) combined with iOS UA/platform sniffing (`navigator.userAgentData` or the classic iOS UA regex, since iOS Safari doesn't expose a clean capability flag for this) to distinguish "iOS, not installed" from "iOS, installed" from "not iOS."
- On iOS + not installed: don't show a push opt-in that will fail. Instead show an explicit instruction: "Add this app to your Home Screen to enable notifications" with a short how-to, reusing existing toast/callout components.
- On iOS + installed but pre-16.4: detect via feature check (`'PushManager' in window`) and degrade gracefully with a version-upgrade message rather than a generic error.
- Never let the opt-in button be present-but-silently-broken — the worst UX outcome here is the user thinks they subscribed and never gets told they didn't.

**Warning signs:** Zero or near-zero iOS subscribers despite meaningful iOS traffic in analytics; console errors like `PushManager is not defined` or `NotSupportedError` on iOS devices; support messages saying "I tapped enable but nothing happened" from iPhone users.

**Phase to address:** Cross-platform/iOS handling phase — should be its own explicit checklist item, not folded silently into the general opt-in UX phase, given how differently it needs to behave.

---

### Pitfall 5: Unauthenticated send endpoint — anyone can trigger a push blast

**What goes wrong:**
The Vercel Function that sends the daily push is invoked over plain HTTPS by the GitHub Actions pipeline. If that endpoint has no authentication, its URL is discoverable (Vercel deployment URLs, GitHub Actions workflow YAML committed to a public repo, browser dev tools on the pipeline's network calls) and anyone can `curl` it — either spamming all subscribers with duplicate/garbage notifications, or (worse) hitting it repeatedly to burn through KV request quota and Function invocation minutes on the Hobby plan, or to trigger the push-service rate limiting described in Pitfall 2.

**Why it happens:**
It's tempting to skip auth because "it's just a cron trigger, nobody knows the URL" — security-through-obscurity that fails the moment the repo (which contains the workflow file calling this URL) is public, which it is here (public GitHub Pages/Vercel project).

**How to avoid:**
- Require a shared secret on every call: store it as both a GitHub Actions repository secret and a Vercel environment variable, sent as a header (e.g. `Authorization: Bearer <secret>` or `X-Pipeline-Secret`), and reject with 401 in the Function if it doesn't match (constant-time comparison, not `===`, to avoid timing side-channels).
- Prefer HMAC-signing the request over a raw shared secret if the payload varies (e.g. sign `date + payload-hash` with the shared secret) so a captured header can't be trivially replayed on a different day — GitHub's own webhook signature pattern (`X-Hub-Signature-256`, HMAC-SHA256 over the raw body) is a good template.
- Add an idempotency guard independent of auth: the Function should check (via a KV key like `sent:YYYY-MM-DD`) whether today's push already went out, and no-op (or 409) on a second call for the same date — this protects against both a leaked secret being replayed and the pipeline accidentally double-triggering (retries, manual re-runs).
- Do not rely on Vercel's deployment URL being "unlisted" as a security boundary.

**Warning signs:** Duplicate notifications received same day; unexplained spikes in KV command usage or Function invocations in the Vercel dashboard; any successful call to the send endpoint without the expected header present in logs.

**Phase to address:** Pipeline trigger integration phase — must ship together with the first working send endpoint, not retrofitted after go-live.

---

### Pitfall 6: Sequential sends blow past Function time, or fail as one unit instead of per-subscriber

**What goes wrong:**
A naive send loop does `for (const sub of subscribers) { await webpush.sendNotification(sub, payload) }`. Each `sendNotification` call is a network round-trip (~100-500ms typically, more under load) to a third-party push service (FCM, Mozilla, Apple). At even a few hundred subscribers this adds up to real wall-clock time, and if one subscriber's send hangs or the loop isn't wrapped per-item in try/catch, one failure can abort the whole batch, meaning subscribers later in the array never get their notification. On Vercel Hobby, Functions with Fluid Compute enabled now default to a 300-second max duration (this was a hard 10s ceiling on older/legacy Hobby configurations — the constraint has relaxed significantly, but it is not unlimited and is not guaranteed forever).

**Why it happens:**
Serial `await`-in-a-loop code is the first thing anyone writes, and it "works" in local testing with 2-3 test subscriptions, hiding the scaling problem until real subscriber counts exist.

**How to avoid:**
- Send concurrently in bounded batches using `Promise.allSettled` (not `Promise.all`, which short-circuits on first rejection) — e.g. batches of 20-50 concurrent sends — so one bad subscription never blocks or fails the rest, and total wall time stays roughly `subscribers / batch_size * per-send-latency` instead of `subscribers * per-send-latency`.
- Set `maxDuration` explicitly in the Function config rather than relying on defaults, and monitor actual duration in Vercel logs/observability as subscriber count grows — treat this as a scale checkpoint, not a one-time setting.
- Keep the payload small (Web Push payloads are capped around 4KB by most push services regardless of Vercel's own limits) — send a short summary + a link the notification click opens, not the full narrative text.
- If subscriber count ever grows enough that even batched sends approach the duration ceiling, split into multiple Function invocations (e.g. paginate through KV subscriber keys, one invocation per page) rather than trying to raise limits further — this is a Pro-plan/paid-tier problem to solve later, not now.

**Warning signs:** Send Function duration trending toward the configured max in logs; later-registered subscribers (if KV iteration order correlates with signup order) consistently missing notifications; occasional 504 `FUNCTION_INVOCATION_TIMEOUT` in Vercel logs.

**Phase to address:** Send-function phase, with an explicit scale note revisited if/when subscriber count grows materially (e.g., beyond a few hundred).

---

### Pitfall 7: KV access patterns that don't scale — `KEYS`-style full scans and per-request storms

**What goes wrong:**
Storing subscriptions such that "get all subscribers" requires an expensive scan pattern (e.g. `KEYS push:*` in Redis-family stores, which is O(n) and can block), or making one KV round-trip per subscriber for both the daily send *and* the cleanup pass, multiplies KV command usage fast. Vercel KV (now provisioned via the Marketplace as an Upstash Redis integration, since standalone Vercel KV was deprecated/migrated in December 2024) free tiers are commonly cited around 30,000 commands/day and 256MB storage — comfortably enough for hundreds to low thousands of subscribers if accessed efficiently, but easy to blow through with per-item read+write+scan patterns multiplied across a growing subscriber list, especially if the opt-in/unsubscribe endpoints also hit KV on every page load for status checks rather than relying on client-side state.
**Note:** exact current free-tier numbers vary across sources reviewed and should be re-verified against the live Vercel/Upstash dashboard at implementation time — treat the figures above as MEDIUM confidence, order-of-magnitude guidance, not a guarantee.

**Why it happens:**
Key-value stores make it easy to reach for "list all keys matching a prefix" as the obvious way to enumerate subscribers, without realizing this doesn't scale the way a real database index would.

**How to avoid:**
- Maintain an explicit index structure (e.g. a Redis `SET` or `HASH` of subscriber endpoints/IDs) that the send Function reads in one or a few commands, rather than scanning all keys by prefix.
- Use the endpoint URL (or a hash of it) as the KV key/index member so re-subscribing the same browser overwrites rather than duplicates.
- Batch KV writes where possible (e.g. a single `HSET` with a hash of subscriptions and a single `HDEL` for cleanups per invocation, rather than N individual `SET`/`DEL` calls) if the client library supports pipelining.
- Keep client-side subscribed/unsubscribed UI state in `localStorage` (consistent with the existing no-accounts, localStorage-first pattern in this project) so status checks don't need a KV round-trip on every page load — only the actual subscribe/unsubscribe/send actions touch KV.

**Warning signs:** Vercel/Upstash dashboard showing command usage climbing much faster than subscriber growth would explain; KV request count spiking on days with no send (suggesting status-check reads on every visit).

**Phase to address:** Backend foundation phase — get the KV schema right before building on top of it; retrofitting an index structure after the fact means a data migration.

---

### Pitfall 8: Time-zone/DST handling for "market close" trigger, and duplicate-send races

**What goes wrong:**
NYSE/Nasdaq close at 4:00 PM Eastern, which is either 20:00 or 21:00 UTC depending on US daylight saving time (DST) — and the existing hourly GitHub Actions pipeline almost certainly runs on a fixed UTC cron schedule. If the "is this the market-close run?" check in the pipeline or the send Function is hardcoded to a UTC hour without accounting for DST, the push either fires an hour early/late twice a year (around the March and November DST transitions), or — if the check is done loosely (e.g. "if hour >= 20") — it could fire on *every* hourly run after close instead of exactly once, spamming subscribers with the same digest multiple times a day.

**Why it happens:**
UTC-hour cron logic is simple to write and works fine 10 months a year, so the DST edge case doesn't surface until it happens — often not caught until a user reports getting the notification at the "wrong" time or getting it twice.

**How to avoid:**
- Determine "is market closed now" using actual US Eastern time-zone-aware logic (e.g. compute current time in `America/New_York` and compare to 16:00, which automatically handles EST/EDT), not a hardcoded UTC hour.
- Make the send trigger idempotent regardless of how many times the pipeline calls it in a day (see Pitfall 5's `sent:YYYY-MM-DD` KV guard) — this is the real safety net; correct timezone logic reduces *how often* the edge case is hit, the idempotency guard makes it harmless when it is.
- Test explicitly around the two DST transition dates (or simulate by mocking the date) rather than assuming "it worked today" means it's correct.

**Warning signs:** Push arrives at an unexpected local time for US users around mid-March or early November; more than one push notification received in the same day.

**Phase to address:** Pipeline trigger integration phase.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|-----------------|------------------|
| Skip cleanup-on-410 logic, "add it later" | Faster first working send | Silent quota/time waste, growing dead-weight KV entries, harder to retrofit once send logic is entangled with other concerns | Never — ship it in the same PR as the first send |
| Hardcode VAPID public key string in client JS instead of serving from an endpoint | One less API route | Easy to drift from server key on rotation; no single source of truth | Only truly acceptable pre-launch/local dev, never in the deployed version |
| No idempotency guard on the send endpoint | Simpler Function | Duplicate/spam sends on pipeline retry or replay attack | Never — this is a one-line KV check, cheap to add upfront |
| Serial `await`-in-loop sends | Simplest code to write/read | Time out risk grows with every new subscriber; silent data loss (skipped subscribers) on partial failure | Only acceptable while subscriber count is in single digits during dev/testing |
| Treat iOS as "same as Android, minor quirks" | Skip building iOS-specific detection UI | Feature appears broken for a meaningful share of mobile users with zero error signal | Never — must be addressed explicitly given iOS's install requirement |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|-------------------|
| Push services (FCM/Chrome, Mozilla autopush, Apple/Safari) | Assuming one push service's error semantics apply to all (e.g. treating all non-2xx as permanent) | Follow the Web Push spec generically: `410`/`404` = delete subscription; other 4xx/5xx = log and retry-eligible but don't delete; each push service (Google, Mozilla, Apple) implements the same standard endpoint contract so a well-behaved `web-push` library client handles this uniformly |
| GitHub Actions → Vercel Function | Trusting the URL is secret / relying on network-level obscurity | Shared secret header + constant-time comparison + idempotency key, as in Pitfall 5 |
| Vercel KV / Upstash | Enumerating subscribers via prefix `KEYS` scan | Maintain an explicit index (`SET`/`HASH`) of subscriber IDs for O(1)-ish enumeration |
| `web-push` npm library | Hand-rolling payload encryption (`aes128gcm`) instead of using the library | Use the maintained `web-push` library for Node — it correctly implements the Web Push Message Encryption spec (VAPID JWT signing, payload encryption, TTL/Urgency headers); do not hand-roll this |
| Service worker `push` event | Registering a `push` listener but forgetting `notificationclick` | Both are required: `push` shows the notification, `notificationclick` handles what happens when the user taps it (e.g. focus/open the app) — omitting the second makes taps do nothing |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|-----------------|
| Serial send loop | Send Function duration grows linearly with subscriber count | Batched `Promise.allSettled` concurrency | Somewhere in the hundreds of subscribers, depending on per-send latency and configured `maxDuration` |
| Per-subscriber KV round trips (read + write each) | KV command usage grows faster than subscriber count | Pipeline/batch KV operations; index structure instead of per-key scans | Free-tier daily command quota (order of tens of thousands) — could be hit well before subscriber count feels "large" if inefficient |
| No cleanup of dead subscriptions | Send Function does full work for entries that always fail; KV storage grows unbounded | Delete on `410`/`404` in the same send pass | Gradual — worsens every week churn happens without cleanup |
| Large notification payloads | Push service rejects with 413/oversized-payload errors | Keep payload to a short summary + link, not full narrative text | Most push services cap around 4KB payload |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Unauthenticated send endpoint | Anyone can trigger a push blast to all subscribers, or exhaust KV/Function quota | Shared-secret header (or HMAC signature) verified server-side, constant-time comparison |
| VAPID private key in repo or client bundle | Anyone can forge push requests as your server identity to push services; push services may ban the identity | Store only in Vercel encrypted env vars, never in git, never shipped to client |
| No idempotency on send trigger | Replay of a leaked/captured trigger request re-sends the day's push repeatedly | KV-based `sent:YYYY-MM-DD` guard, checked before doing any send work |
| Trusting client-supplied subscription data without validation | Malformed/malicious subscription objects stored in KV, or endpoint spoofing used to probe internal send logic | Validate subscription shape (`endpoint`, `keys.p256dh`, `keys.auth` present and well-formed) before writing to KV in the subscribe endpoint |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-------------------|
| Requesting permission on page load | User denies before understanding value; permanently blocked with no simple way back | Soft-ask in context, tied to a deliberate action, after the user has seen value in the app |
| No unsubscribe control as visible as the subscribe control | Users feel trapped by notifications, associate the whole app negatively | Mirror opt-in and opt-out prominence — same component, toggled state |
| Generic/no error messaging for iOS non-installed state | User thinks the feature is broken, doesn't realize install is required | Explicit "Add to Home Screen to enable notifications" instruction with steps |
| Silent no-op after permission denied | User assumes they're subscribed when they aren't, blames the product later | Reflect actual `Notification.permission` state in the UI at all times, with a "how to fix" path when denied |

## "Looks Done But Isn't" Checklist

- [ ] **Subscribe flow:** Often missing the `pushsubscriptionchange` handler — verify the service worker re-subscribes and updates the server when the browser silently rotates a subscription, not just on initial opt-in.
- [ ] **Send Function:** Often missing per-item error isolation — verify one bad/expired subscription can't abort the whole batch (test by manually corrupting one KV entry before a send).
- [ ] **iOS path:** Often "works" only because it was tested on desktop Chrome — verify on an actual iPhone in both installed (Home Screen) and non-installed (plain Safari tab) states, and on an iOS version below 16.4 if you can access one, to confirm graceful degradation.
- [ ] **Unsubscribe:** Often removes the client-side subscription (`PushSubscription.unsubscribe()`) but forgets to also delete the corresponding KV entry server-side — verify both sides are cleared, otherwise the server keeps trying to send to a subscription the browser already discarded.
- [ ] **Send trigger security:** Often tested only with the correct secret present — verify the endpoint actually returns 401 and does no work when the header is missing or wrong.
- [ ] **Notification click:** Often shows the notification correctly but tapping it does nothing or opens a blank tab — verify `notificationclick` opens/focuses the app at a sensible URL.
- [ ] **DST transition:** Often untested outside of "today" — verify the market-close time calculation explicitly around March/November DST boundaries, not just current-date manual testing.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|----------------|------------------|
| Mismatched/leaked VAPID keys | LOW | Regenerate a new key pair, update Vercel env vars, redeploy client with new public key — but note **all existing subscriptions become invalid** and every user must re-subscribe, since `applicationServerKey` is bound to a specific key pair at subscribe time |
| Accumulated dead subscriptions in KV | LOW | One-off cleanup script that sends a lightweight test push (or relies on the next real send) and deletes on `410`/`404`; going forward, cleanup-on-send prevents recurrence |
| Duplicate sends discovered after the fact | LOW | Add the `sent:YYYY-MM-DD` idempotency guard retroactively; no data loss, just a one-time user annoyance to apologize for if visible |
| Unauthenticated endpoint discovered exploited | MEDIUM | Rotate the shared secret immediately, add auth, audit Vercel/KV logs for the exploitation window, consider rotating VAPID keys if abuse involved sending unauthorized pushes to build trust erosion |
| iOS users silently never getting pushes for months | MEDIUM | No data recovery needed (nothing was ever sent), but requires an in-app announcement/detection fix plus, ideally, a one-time in-app message inviting affected users to install and re-subscribe |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|-------------------|----------------|
| VAPID key mismatch/leakage | Backend foundation (VAPID + KV setup) | Send a real test push end-to-end before building any more features on top; confirm private key absent from `git log` and client bundle |
| Stale subscriptions not cleaned up | Send-function phase | After a test send, manually invalidate one subscription (unsubscribe client-side) and confirm the next send removes it from KV |
| Permission-ask UX / no re-enable path | Client opt-in UX phase | Manually deny permission in a test browser profile, confirm the app detects `"denied"` and shows instructions rather than a dead button |
| iOS Safari install requirement | Cross-platform/iOS handling phase | Test on a physical iPhone: plain Safari tab (should show install instructions) and installed Home Screen PWA (should work) |
| Unauthenticated send endpoint | Pipeline trigger integration phase | `curl` the send endpoint with no/wrong secret from outside GitHub Actions, confirm 401 and no notifications sent |
| Serial sends / duration risk | Send-function phase | Load-test with a synthetic batch of dummy subscriptions (even invalid ones, to test error isolation) and check Function duration in Vercel logs |
| Inefficient KV access patterns | Backend foundation phase | Review KV command count for a full send cycle in the Vercel/Upstash dashboard against subscriber count — should be roughly O(subscribers), not higher |
| DST/timezone trigger bugs | Pipeline trigger integration phase | Simulate/mock dates around DST transitions; confirm exactly one send fires per calendar day regardless of season |

## Sources

- [Vercel Functions Limitations (official docs)](https://vercel.com/docs/functions/limitations) — HIGH confidence, fetched directly, last updated 2026-07-01
- [Vercel KV / Redis on Vercel (official docs)](https://vercel.com/docs/redis) — MEDIUM confidence, confirms migration to Upstash-backed Marketplace integration post-Dec-2024
- [PushAlert — iOS/iPadOS Web Push setup](https://pushalert.co/documentation/ios-web-push) — MEDIUM confidence, corroborated by multiple independent sources on 16.4+ requirement and Home Screen install requirement
- [Notificare — Web Push in iOS: Add to Home Screen](https://notificare.com/blog/2024/09/16/web-push-in-ios-add-to-home-screen/) — MEDIUM confidence
- [Pushpad — Web Push Error 410](https://pushpad.xyz/blog/web-push-error-410-the-push-subscription-has-expired-or-the-user-has-unsubscribed) — MEDIUM confidence, standard/widely corroborated behavior
- [Pushpad — How to check if a push endpoint is still valid](https://pushpad.xyz/blog/web-push-how-to-check-if-a-push-endpoint-is-still-valid) — MEDIUM confidence
- [web.dev — Permission UX](https://web.dev/articles/push-notifications-permissions-ux) — HIGH confidence, official Google/Chrome guidance
- [Chrome for Developers / Lighthouse — Requests notification permission on page load (best-practice audit)](https://developer.chrome.com/docs/lighthouse/best-practices/notification-on-start) — HIGH confidence, official
- [web-push-libs/web-push (GitHub, official library)](https://github.com/web-push-libs/web-push/blob/master/README.md) — HIGH confidence
- [GitHub Docs — Validating webhook deliveries (HMAC signature pattern)](https://developer.github.com/webhooks/securing/) — HIGH confidence, official; used here as the template for GitHub Actions → Vercel Function auth
- [Vercel Community — KV daily request limit thread](https://community.vercel.com/t/kv-daily-request-limit/1512) — LOW/MEDIUM confidence, community-sourced numbers, should be re-verified at implementation time against the live Vercel/Upstash dashboard
- Training-data knowledge of the W3C Push API, VAPID (RFC 8292), and Web Push Message Encryption (RFC 8291) specs — HIGH confidence, stable/unchanged standards

---
*Pitfalls research for: DIY web push notifications (Vercel Functions + KV, no third-party SaaS), AI QuickCap v2*
*Researched: 2026-08-12*
