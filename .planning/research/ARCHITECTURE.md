# Architecture Research

**Domain:** Web push notifications bolted onto a static PWA + hourly batch pipeline (no dedicated backend)
**Researched:** 2026-08-12
**Confidence:** HIGH (component boundaries, data flow, idempotency pattern — verified against current Vercel/web-push docs) / MEDIUM (exact NYSE holiday-detection library choice, Vercel Function timeout limits on Hobby tier)

## Important correction to PROJECT.md's stated plan

PROJECT.md and the milestone brief both say "Vercel KV." **Vercel KV as a standalone product is deprecated** — Vercel retired it in December 2024 and auto-migrated existing stores to Upstash Redis. New projects must add Redis via the **Vercel Marketplace → Upstash for Redis** integration, not a "Create KV Database" flow (that flow no longer exists in the dashboard). Functionally this changes nothing about the architecture below — it's still a Redis-compatible REST-accessible key-value store, reachable from a Vercel Function with the same `SET`/`GET`/`SETNX`-style primitives — but the roadmap should say "Redis via Vercel Marketplace (Upstash)" rather than "Vercel KV," and the setup step is "add the Upstash integration to the Vercel project" rather than "create a KV database." (Confidence: HIGH — corroborated by Vercel's own `/docs/redis` page, the Upstash-Vercel integration docs, and multiple community-forum threads reporting the same migration.)

Sources: [Redis on Vercel](https://vercel.com/docs/redis), [Upstash for Redis – Vercel Marketplace](https://vercel.com/marketplace/upstash/upstash-kv), [Vercel Community: no KV option in dashboard](https://community.vercel.com/t/there-is-no-kv-database-option-in-vercel-or-marketplace/29129)

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│  BROWSER (client)                                                        │
│                                                                            │
│  app.js: initPushNotifications()          service-worker.js:            │
│  - request Notification permission   ◄──► - push event listener         │
│  - pushManager.subscribe(VAPID pub)        (shows notification)         │
│  - POST subscription → /api/subscribe      - notificationclick listener │
│  - unsubscribe() → POST /api/unsubscribe   (focuses/opens the app)      │
└───────────────┬───────────────────────────────────────┬─────────────────┘
                │ HTTPS POST (subscription JSON)         │ push message
                ▼                                        │ (via browser's
┌─────────────────────────────────────────────────────┐  │ push service —
│  VERCEL (hosting + serverless Functions + Redis)     │  │ FCM/Mozilla/etc,
│                                                        │  │ not our infra)
│  api/subscribe.js    ─┐                               │  │
│  api/unsubscribe.js  ─┼──►  Redis (Upstash, via        │  │
│                        │    Vercel Marketplace)         │  │
│  api/send-push.js  ◄──┘    - subscriptions hash/set    │  │
│    - shared-secret auth    - idempotency key            │  │
│    - SETNX idempotency       (push:sent:{ET date})       │  │
│      gate                                                │  │
│    - web-push.sendNotification() per subscriber ────────┼──┘
│    - prunes expired (410/404) subscriptions              │
└───────────────▲───────────────────────────────────────────┘
                │ HTTPS POST (JSON: title/body/url) + X-Push-Secret header
                │
┌───────────────┴───────────────────────────────────────────────────────┐
│  GITHUB ACTIONS (existing hourly cron, unchanged schedule)              │
│                                                                          │
│  pipeline/fetch_and_curate.py, main():                                 │
│  1. fetch + curate (existing, unchanged)                               │
│  2. write data.json, commit + push (existing, unchanged)               │
│  3. NEW: maybe_trigger_push(sector_summary, now_et)                    │
│     - is it a NYSE trading day, and is now_et >= market close?         │
│     - if yes: POST to Vercel's /api/send-push (try/except, non-fatal)  │
└──────────────────────────────────────────────────────────────────────┘
```

The two independent halves that already exist (Python pipeline / static frontend) stay independent and still only share `data.json`. Push notifications are a **third, thin slice** that connects them via one outbound HTTPS call — the pipeline never talks to Redis or web-push directly, and the frontend never talks to the pipeline directly.

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `service-worker.js` (extended) | Own the two push-specific browser events only: render the notification on `push`, handle the click. No fetching, no business logic, no knowledge of `data.json`. | `self.addEventListener("push", ...)` reads `event.data.json()`, calls `self.registration.showNotification(title, {body, icon, badge, data: {url}})`; `self.addEventListener("notificationclick", ...)` closes the notification and calls `clients.openWindow`/`client.focus()`. |
| `app.js` — `initPushNotifications()` (new `init*()`, same convention as the rest of the file) | All UI/permission/subscription-lifecycle logic. Owns the subscribe/unsubscribe control, requests `Notification.requestPermission()`, calls `registration.pushManager.subscribe()`, POSTs/DELETEs the subscription against the two new Functions, mirrors state to `localStorage` for UI only (not source of truth). | Reuses existing button/toast components per `DESIGN.md`; VAPID public key is a hardcoded constant (it's meant to be public). |
| `api/subscribe.js` (new Vercel Function) | Validate + upsert one `PushSubscription` object into Redis, keyed by a hash of `subscription.endpoint`. | Node/Edge Function, no auth needed (same-origin, anonymous by design — matches "no accounts"). |
| `api/unsubscribe.js` (new Vercel Function) | Remove one subscription from Redis by endpoint hash. | Called both explicitly (user clicks "unsubscribe") and defensively by `send-push` when a push service returns 404/410. |
| `api/send-push.js` (new Vercel Function) | The only component that: (a) enforces "exactly once per day," (b) knows the shared secret, (c) talks to `web-push`. | Checks `X-Push-Secret` header against `process.env.PUSH_TRIGGER_SECRET`; does the atomic idempotency check in Redis; iterates stored subscriptions; calls `webpush.sendNotification()`; deletes dead subscriptions. |
| `pipeline/fetch_and_curate.py` — `maybe_trigger_push()` (new function in existing file) | Decide "is this the market-close run" and, if so, fire-and-forget a signed POST to `api/send-push`. Owns zero push-delivery logic — it only ever sends the day's already-computed narrative text as a payload. | Wrapped in the pipeline's existing `try/except` resilience pattern; failure here must never block or roll back `data.json`'s commit (it already can't, since this runs *after* `data.json` is written). |
| GitHub Actions workflow (`refresh-data.yml`) | Unchanged schedule (`0 * * * *`). Only change: inject one new secret (`PUSH_TRIGGER_SECRET`) into the `env:` block alongside the existing three API keys. | No new jobs, no new triggers — this is the explicit constraint from PROJECT.md. |

## Recommended Project Structure

```
ai-stocks-pulse/
├── api/                        # NEW — Vercel Functions (auto-routed by folder name)
│   ├── subscribe.js            # POST — store a PushSubscription
│   ├── unsubscribe.js          # POST/DELETE — remove a PushSubscription
│   └── send-push.js            # POST — shared-secret gated, sends the day's push
├── app.js                      # existing — add initPushNotifications() near the other init*()s
├── service-worker.js           # existing — add push + notificationclick listeners, bump CACHE_NAME
├── pipeline/
│   ├── fetch_and_curate.py     # existing — add maybe_trigger_push(), call at end of main()
│   └── requirements.txt        # add `requests` (or use stdlib urllib) + `holidays`, `tzdata`
├── .github/workflows/
│   └── refresh-data.yml        # existing — add PUSH_TRIGGER_SECRET to env:
└── vercel.json                 # new or extended — Function config if needed (timeout, etc.)
```

### Structure Rationale

- **`api/`:** Vercel's file-system routing convention — any file here becomes `/api/<name>`. Three small, single-purpose Functions rather than one do-everything endpoint, so each has one auth model and one failure mode (subscribe/unsubscribe are open/anonymous; send-push is secret-gated).
- **No new top-level frontend files:** consistent with the existing single-`app.js`/single-`service-worker.js` no-build-step constraint — extend, don't fragment.
- **`pipeline/requirements.txt` gains two lightweight deps:** `holidays` (pure Python, no pandas, provides `holidays.financial_holidays("NYSE")`) for market-holiday detection, and `tzdata` (pins IANA timezone data so `zoneinfo.ZoneInfo("America/New_York")` is portable/reproducible on CI runners rather than depending on whatever system tzdata Ubuntu ships). Both are tiny, no-build-step-breaking additions to a pipeline that already has exactly one dependency (`anthropic`).

## Architectural Patterns

### Pattern 1: Payload-push, not payload-pull (avoid the deploy race)

**What:** The pipeline POSTs the *actual* notification content (title + body text, taken directly from the same `curate_with_claude()` output already used for the hero card's narrative) to `api/send-push` in the request body. `send-push` does **not** re-fetch the live site's `data.json` to figure out what to say.

**When to use:** Any time a trigger and a "read the latest data" step are separated by an async deploy step you don't control the timing of.

**Why it matters here:** `git push` → Vercel auto-deploy is not instantaneous. If `send-push` tried to `fetch("https://your-site.vercel.app/data.json")` immediately after the pipeline's commit, it could race the deploy and read yesterday's cached `data.json` (or a transiently 404ing one during the deploy swap). Passing the narrative directly in the trigger POST sidesteps this entirely and also means zero extra LLM calls or extra fetches — the same Claude output that fills the hero card is what goes in the push, satisfying PROJECT.md's "same narrative" requirement and the "cost-disciplined LLM usage" principle for free.

**Trade-offs:** `send-push` becomes slightly less self-contained (it trusts whatever text the pipeline sends rather than being the sole source of truth for the day's summary). Acceptable here because the pipeline is the only caller and the shared secret already establishes trust.

**Example:**
```python
# pipeline/fetch_and_curate.py
def maybe_trigger_push(sector_summary: dict, now_et: datetime) -> None:
    if not is_market_close_window(now_et):
        return
    try:
        requests.post(
            f"{SITE_URL}/api/send-push",
            json={
                "title": "AI QuickCap — resumen del cierre",
                "body": sector_summary.get("summary", "")[:180],
                "url": "/",
            },
            headers={"X-Push-Secret": os.environ["PUSH_TRIGGER_SECRET"]},
            timeout=10,
        )
    except Exception as exc:
        print(f"Aviso: no se pudo disparar el push diario: {exc}", file=sys.stderr)
```

### Pattern 2: Idempotency lives in the Function, not the trigger

**What:** `api/send-push.js` is the single source of truth for "has today's push already gone out." It does an atomic Redis `SET push:sent:{ET-date} 1 NX EX 90000` (NX = only set if not already present; EX = auto-expire after ~25h so nothing needs manual cleanup). If the `SET` reports it didn't actually set (key already existed), the Function returns `200 { sent: false, reason: "already sent" }` and does no delivery work. Only the caller that wins the race actually loops over subscriptions and calls `webpush.sendNotification()`.

**When to use:** Any "trigger this at most once per period" requirement where the trigger source (cron) cannot itself guarantee exactly-once semantics.

**Why it matters here:** This is what makes the whole design safe against GitHub Actions' cron not firing at exactly `:00`, firing late, or (rarely) getting skipped for an hour. See "Idempotency / reliability" below — this pattern is the actual answer, not the trigger-timing logic.

**Trade-offs:** Requires the Redis store to be available and consistent for the `SET NX` to be atomic — true for Upstash Redis (single-region, strongly consistent per-key), not true for eventually-consistent stores. Since we're already using Redis, this is free.

**Example:**
```javascript
// api/send-push.js
import { Redis } from "@upstash/redis";
const redis = Redis.fromEnv();

export default async function handler(req, res) {
  if (req.headers["x-push-secret"] !== process.env.PUSH_TRIGGER_SECRET) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const etDate = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" }); // YYYY-MM-DD
  const acquired = await redis.set(`push:sent:${etDate}`, "1", { nx: true, ex: 90000 });
  if (!acquired) {
    return res.status(200).json({ sent: false, reason: "already sent today" });
  }

  const { title, body, url } = req.body;
  const subs = await redis.smembers("push:subscriptions:index");
  let delivered = 0, pruned = 0;
  for (const key of subs) {
    const sub = await redis.get(key);
    if (!sub) continue;
    try {
      await webpush.sendNotification(sub, JSON.stringify({ title, body, url }));
      delivered++;
    } catch (err) {
      if (err.statusCode === 404 || err.statusCode === 410) {
        await redis.del(key);
        await redis.srem("push:subscriptions:index", key);
        pruned++;
      }
    }
  }
  return res.status(200).json({ sent: true, delivered, pruned });
}
```

### Pattern 3: Trigger-window widening, not trigger-time precision

**What:** Rather than trying to make the pipeline fire *exactly* at market close, widen the window during which the pipeline is *willing* to call `send-push` — e.g., every hourly run where `now_et` is on a trading day and `now_et.time() >= 16:00` (through, say, `19:59` ET) counts as "the market is closed, try to trigger." Combined with Pattern 2's idempotency gate, calling `send-push` redundantly on the 17:00, 18:00, and 19:00 ET runs is harmless — only the first one that wins the `SET NX` actually delivers.

**When to use:** Whenever the trigger source's timing is not guaranteed (GitHub Actions scheduled workflows are documented as best-effort — they can be delayed under high GitHub-wide load, and low-activity public repos have historically seen occasional skipped runs).

**Why it matters here:** This is the concrete fix for "the market-close hour could theoretically get skipped." A single "only call if `now_et.hour == 16`" check is fragile — if that one run is late (fires at 16:47 ET, still fine) or is the run that gets skipped entirely, the day's push silently never fires. A multi-hour trailing window plus server-side idempotency means the push still fires on the *next* successful run, still exactly once, with no manual intervention.

**Trade-offs:** A handful of extra outbound HTTPS calls per day (3-4 no-op "already sent" responses) — negligible cost on Vercel's Hobby tier, and each no-op call is a single Redis `GET`/`SET` check, not a delivery loop.

## Data Flow

### Subscribe Flow

```
[User clicks "Enable notifications"]
    ↓
app.js: Notification.requestPermission()
    ↓ (granted)
app.js: registration.pushManager.subscribe({ applicationServerKey: VAPID_PUBLIC_KEY, userVisibleOnly: true })
    ↓ (browser returns a PushSubscription object: endpoint + keys)
app.js: POST /api/subscribe  { subscription }
    ↓
api/subscribe.js: redis.set(`push:sub:{hash(endpoint)}`, subscription); redis.sadd("push:subscriptions:index", key)
    ↓
[localStorage flag set for UI state only — "you're subscribed on this device"]
```

### Unsubscribe Flow

```
[User clicks "Disable notifications"]
    ↓
app.js: subscription.unsubscribe()  (browser-side — revokes the PushSubscription)
    ↓
app.js: POST /api/unsubscribe { endpoint }   (server-side cleanup — MUST also happen,
    ↓                                          else a stale row lingers in Redis and
api/unsubscribe.js: redis.del(...) + srem     send-push wastes a call on it until it
                                               404/410s and gets pruned anyway)
```

### Daily Push Delivery Flow (the core of this milestone)

```
[GitHub Actions cron fires, ~hourly, best-effort timing]
    ↓
pipeline: fetch + curate (existing, unchanged) → writes data.json → commits + pushes (existing, unchanged)
    ↓
pipeline: maybe_trigger_push(sector_summary, now_et)
    ↓ (now_et is a NYSE trading day AND now_et.time() >= market close?)
    │  NO  → return, do nothing (23/24 runs on a normal day; every run on weekends/holidays)
    │  YES ↓
    POST https://<site>/api/send-push  { title, body, url }  header: X-Push-Secret
    ↓
api/send-push.js: SET push:sent:{ET-date} NX EX 90000
    │  key already existed → 200 { sent:false } — no-op, this run is done
    │  key newly set       ↓
    SMEMBERS push:subscriptions:index → for each: webpush.sendNotification(sub, payload)
    ↓                                       ↓ (410/404)
    [delivered]                        redis.del(sub) — self-pruning
    ↓
Vercel Function returns 200 { sent:true, delivered:N, pruned:M } → GitHub Actions log shows the result
    ↓
[Browser's push service delivers to the service worker]
    ↓
service-worker.js: self.addEventListener("push", ...) → self.registration.showNotification(...)
    ↓
[User taps notification] → notificationclick → clients.openWindow("/") or focus existing tab
```

### Key Data Flows

1. **Subscription lifecycle (browser ↔ Vercel):** one-time (or rare) writes, low volume, no timing sensitivity. Standard REST POST/DELETE against Redis.
2. **Daily trigger (GitHub Actions → Vercel):** high-frequency *attempts* (up to ~4/day within the trigger window) but exactly-once *effect*, enforced entirely server-side via the Redis `SETNX` idempotency key — the pipeline's timing is deliberately allowed to be sloppy.
3. **Delivery (Vercel → browser, via the browser vendor's push service):** fire-and-forget from `send-push`'s perspective; `web-push`'s promise resolving/rejecting per-subscription is the only feedback loop, used purely for pruning dead subscriptions, not for retrying the whole batch.

## "Exactly once per day, triggered from an hourly cron" — concrete answer

This is the crux of the milestone, so stated plainly:

**The guarantee does not come from the trigger. It comes from a server-side atomic check that is independent of how many times, or how imprecisely, the trigger fires.**

1. Determine "is the market closed today" using `zoneinfo.ZoneInfo("America/New_York")` (stdlib, DST-correct automatically — no manual UTC-offset math, no separate EST/EDT branch) combined with `holidays.financial_holidays("NYSE")` (pure-Python, no pandas) to skip weekends and market holidays. Compare against the **official 16:00 ET close**. (Known, accepted limitation: NYSE early-close days — day after Thanksgiving, sometimes Christmas Eve — close at 13:00 ET; the `holidays` package's financial calendar does not distinguish full closures from early closes. Practical impact is cosmetic, not a correctness bug: on an early-close day, the 16:00 ET run still reflects a market that's already been closed for 3 hours, so the numbers are accurate, just not delivered as early as they could be. Not worth extra dependency weight to fix for v2.)
2. Widen the pipeline-side trigger condition to a window (e.g. 16:00–19:59 ET) rather than a single hour, so cron delay/jitter/an occasional skipped run doesn't cause a missed day (Pattern 3 above).
3. Make every call into `api/send-push` idempotent via a Redis `SET key NX EX` keyed on the ET calendar date (Pattern 2 above) — this is the actual exactly-once guarantee. It's atomic at the Redis layer, so even two overlapping requests (e.g. a manual `workflow_dispatch` run plus the scheduled run both landing in the window) cannot both win.
4. Because the idempotency key auto-expires (`EX ~25h`), no manual cleanup/reset job is ever needed — tomorrow's key is simply a cache miss again.

Net effect: the pipeline can be as sloppy as GitHub Actions' cron actually is (documented as best-effort, not guaranteed-exact-time) and the system still delivers precisely one push per trading day, with zero new scheduling infrastructure.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Personal project scale (dozens–low hundreds of subscribers) | Exactly the design above. `send-push`'s per-subscriber loop inside one Function invocation is fine — well under Vercel Hobby's default Function duration limits. |
| Low thousands of subscribers | The sequential `for` loop in `send-push` may approach Function timeout. Switch to `Promise.allSettled()` batches (e.g. 50 at a time) instead of one-by-one `await`; still one Function invocation, no new infra. |
| Tens of thousands+ | Out of scope for this milestone (and for this product's stated audience) — would need a queue (e.g. Vercel Queues/QStash) to fan the send-loop out across multiple Function invocations. Not a v2 concern; note only so a future milestone doesn't have to rediscover this. |

### Scaling Priorities

1. **First bottleneck:** Function execution time if the subscriber loop is sequential and the list grows — fix is parallel batching, still no new infra, only relevant well past this milestone's expected scale.
2. **Second bottleneck (much further out):** Redis command volume on Upstash's free tier if subscriber count or push frequency grows a lot — not a concern at one push/day.

## Anti-Patterns

### Anti-Pattern 1: Adding Vercel Cron as the trigger

**What people do:** Reach for Vercel's built-in Cron Jobs feature to schedule the daily send, since it's right there in the same platform as the Function.
**Why it's wrong:** Directly contradicts the milestone's explicit constraint ("no new schedule/infra," reuse the existing hourly pipeline run) — and creates two independent sources of "when does the day's data get finalized," which can drift out of sync (Vercel Cron fires on its own clock, unaware of whether the pipeline's hourly run has actually landed a fresh `data.json` yet). Also: Vercel Hobby's Cron Jobs are limited to once per day at a fixed time you don't fully control relative to market close across DST changes without the same ET-timezone logic anyway — no complexity saved.
**Do this instead:** Keep the single source of truth for "the day's numbers are final" inside the pipeline that already computes them, and let it be the one thing that decides when to trigger.

### Anti-Pattern 2: `send-push` re-fetching `data.json` for the payload

**What people do:** Have the Function `fetch()` the live site's `data.json` to build the notification body, since that feels like "the source of truth."
**Why it's wrong:** Races the Vercel auto-deploy that follows the pipeline's commit (see Pattern 1) — can silently deliver yesterday's summary, or hit a 404 mid-deploy-swap.
**Do this instead:** Pass the narrative text directly in the trigger POST body; the pipeline already has it in memory from the same `curate_with_claude()` call that fills the hero card.

### Anti-Pattern 3: Checking `now_et.hour == 16` as the only trigger condition

**What people do:** The naive, seemingly-obvious translation of "trigger at market close" into code.
**Why it's wrong:** Couples correctness to cron firing within a single specific hour, on a scheduler documented as best-effort. One delayed or skipped run silently loses the entire day's push with no retry.
**Do this instead:** Widen to a multi-hour trailing window and let server-side idempotency (Pattern 2) absorb the redundancy safely (Pattern 3).

### Anti-Pattern 4: Client-side-only unsubscribe

**What people do:** Call `subscription.unsubscribe()` in the browser and consider the job done.
**Why it's wrong:** Leaves the subscription row in Redis; `send-push` will keep attempting delivery to it every day until the push service returns 410/404 and the self-pruning logic catches it (works, but wastes calls and delays the user's expectation of "I turned this off").
**Do this instead:** Explicitly POST/DELETE to `api/unsubscribe` in the same user action, as shown in the Unsubscribe Flow above — treat server-side pruning-on-410 as a safety net, not the primary removal path.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Browser Push Service (FCM for Chrome/Edge, Mozilla Autopush for Firefox, Apple Push for Safari) | Not integrated directly — `web-push` (npm) handles the VAPID signing and RFC 8291 payload encryption per-subscription; the actual push-service endpoint is embedded in each stored `PushSubscription.endpoint`. | Payload size limit ~4KB per RFC 8291 — keep the notification body short (the code example above truncates `summary` to 180 chars as a safety margin, well under the limit even after JSON/encryption overhead). |
| Upstash Redis (via Vercel Marketplace) | REST API, via `@upstash/redis` SDK (works in Vercel Functions/Edge runtime) or `@vercel/kv` (thin compatibility wrapper — still works post-deprecation for existing/new Upstash-backed stores per Vercel's migration docs, but `@upstash/redis` is the more future-proof direct choice). | Free tier is generous for this scale (low request volume — a handful of subscribe/unsubscribe events plus one idempotency check + N sends per day). |
| GitHub Actions secrets ↔ Vercel environment variables | `PUSH_TRIGGER_SECRET` must be set identically in both places (GitHub repo secret for the workflow's `env:` block; Vercel project env var read by `api/send-push.js`). No automatic sync between the two — a manual, documented step. | Same pattern already used for `ANTHROPIC_API_KEY` etc., just duplicated across two platforms instead of living only in GitHub Actions. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `app.js` ↔ `service-worker.js` | Browser-native (Push API, Service Worker API) — no direct function calls; `app.js` registers/updates the SW and initiates `pushManager.subscribe()`, but the SW's `push`/`notificationclick` handlers run independently in the SW's own thread whenever a push arrives, even if no tab is open. | Bumping `CACHE_NAME` (already a manual convention in this repo, currently `v45`) is required whenever `service-worker.js` changes, including this addition — otherwise installed PWA users won't pick up the new push handler promptly. |
| `app.js` ↔ `api/subscribe.js` / `api/unsubscribe.js` | Same-origin `fetch()` POST/DELETE, JSON body. No auth — anonymous by design, consistent with the existing no-accounts model; the `PushSubscription.endpoint` itself is the de facto identity. | |
| `pipeline/fetch_and_curate.py` ↔ `api/send-push.js` | Cross-origin (GitHub Actions runner → Vercel), HTTPS POST, shared-secret header auth. The *only* new network edge between the two previously-fully-decoupled halves of the system. | Must be wrapped in the pipeline's existing per-stage `try/except` resilience pattern (see `main()`'s handling of `fetch_earnings_actuals`/`fetch_daily_batch`) — a failure to reach Vercel must never affect `data.json`'s commit, which has already happened by the time this call runs. |
| `api/send-push.js` ↔ Redis | `@upstash/redis` REST calls — the idempotency `SET NX EX` and the subscription-set reads/writes/deletes. | This is the only component with both read and write-for-deletion access to subscription data; `subscribe`/`unsubscribe` only ever touch their own single key. |

## Suggested Build Order

1. **Generate VAPID keypair** (one-time, offline — `npx web-push generate-vapid-keys` or Python `py-vapid`). Public key becomes a hardcoded constant in `app.js`; private key + subject email go into Vercel env vars (`VAPID_PRIVATE_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_SUBJECT`). Nothing else in this milestone can be tested end-to-end without this.
2. **Add Upstash Redis integration to the Vercel project** (Marketplace, not "Vercel KV" — see correction above). Defines the env vars (`KV_REST_API_URL`/`KV_REST_API_TOKEN` or Upstash-native names, depending on SDK choice) that every Function below needs.
3. **Extend `service-worker.js`** with the `push` and `notificationclick` listeners; bump `CACHE_NAME`. Must exist and be deployed *before* the subscribe UI is meaningful — a `PushSubscription` created against a service worker with no `push` listener results in silently-dropped notifications (and, per spec, browsers may eventually warn/revoke permission for "silent" push registrations that never show a notification).
4. **Build `api/subscribe.js` + `api/unsubscribe.js`** and the Redis subscription schema (one key per subscription, one index set). Needed before the client UI has anywhere to persist a subscription.
5. **Build the client subscribe/unsubscribe UI** (`initPushNotifications()` in `app.js`) — depends on 1 (public key), 3 (SW handler already live), 4 (storage endpoints already live). This is the first point at which the feature is testable by an actual user in a real browser.
6. **Build `api/send-push.js`** (idempotency gate + `web-push` send loop + shared-secret auth + pruning). Depends on 2 (Redis) and can be developed/tested against a manually-inserted test subscription even before step 5 fully ships — useful to parallelize.
7. **Wire the pipeline trigger** (`maybe_trigger_push()` in `fetch_and_curate.py`, market-close/holiday detection, `PUSH_TRIGGER_SECRET` added to both GitHub Actions secrets and Vercel env vars). This must come last — there's nothing to trigger until 6 is deployed. Validate first via manual `workflow_dispatch` runs (already supported by the existing workflow) before trusting the real hourly cron end-to-end.

This ordering doubles as a natural roadmap-phase split: **(A) foundation** — VAPID + Redis + SW handler; **(B) subscribe/unsubscribe** — client UI + the two storage Functions, end-to-end testable; **(C) delivery** — `send-push` + idempotency, testable standalone; **(D) trigger integration** — pipeline wiring + market-close/holiday detection + secrets, the final connective step.

## Sources

- [Redis on Vercel (official docs)](https://vercel.com/docs/redis) — Vercel KV deprecation, Upstash Marketplace replacement (HIGH confidence)
- [Upstash for Redis – Vercel Marketplace](https://vercel.com/marketplace/upstash/upstash-kv) — current integration path (HIGH confidence)
- [Vercel Community: "There is no KV database option in Vercel or Marketplace"](https://community.vercel.com/t/there-is-no-kv-database-option-in-vercel-or-marketplace/29129) — corroborates dashboard-level removal (MEDIUM confidence, community-sourced but consistent with official docs)
- [web-push (npm) / web-push-libs/web-push (GitHub)](https://github.com/web-push-libs/web-push) — VAPID signing, `sendNotification()` API, 410/404 handling on expired subscriptions (HIGH confidence, canonical library)
- [holidays (PyPI)](https://pypi.org/project/holidays/) — `financial_holidays("NYSE")` for market-holiday detection, pure Python, no pandas dependency (MEDIUM confidence — verified via search, not hands-on tested against this repo)
- Existing repo files read directly: `.planning/PROJECT.md`, `.planning/codebase/ARCHITECTURE.md`, `.github/workflows/refresh-data.yml`, `service-worker.js`, `pipeline/requirements.txt` (HIGH confidence — primary source)

---
*Architecture research for: web push notifications on a static PWA + hourly GitHub Actions pipeline + Vercel Functions/Redis*
*Researched: 2026-08-12*
