# Stack Research

**Domain:** Web Push notifications for a static PWA, backend on Vercel Functions + a KV-style store, triggered from an existing Python/GitHub Actions pipeline
**Researched:** 2026-08-12
**Confidence:** HIGH (Web Push/VAPID mechanics, `web-push` API shape, Vercel Functions/Cron behavior — all verified against npm registry, GitHub, and current Vercel docs) / MEDIUM (exact Upstash free-tier numbers, which move over time — verify at implementation time)

## Critical Correction to Milestone Assumptions

**"Vercel KV" as named in PROJECT.md no longer exists as a product you can provision.** Vercel discontinued native Vercel KV; existing stores were auto-migrated to Upstash Redis in December 2024, and for any *new* project the equivalent is installed from the **Vercel Marketplace as "Upstash for Redis"** (formerly branded "Upstash for Vercel — KV"). Functionally this is the same thing (Upstash-backed Redis, REST-based client, same free tier the project would have gotten under "Vercel KV"), so nothing about the plan needs to change — but the roadmap/setup steps should say "add the Upstash for Redis integration from the Vercel Marketplace," not "enable Vercel KV," or whoever implements this will hit a dead menu item.
Confidence: HIGH — confirmed via Vercel's own changelog and community threads.

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Web Push API + Push API (browser-native) | N/A (browser API, not a package) | Client subscribes to push, receives it in the background | Native to Chrome, Firefox, Edge, and Safari 16.4+ (incl. installed iOS/iPadOS PWAs since 16.4). No SDK needed client-side — matches the project's zero-framework constraint exactly. |
| `web-push` (npm, server-side) | 3.6.7 (latest on npm) | Builds the VAPID JWT, encrypts the payload per RFC 8291, and POSTs to the browser's push service (FCM/Mozilla/Apple push endpoints) | The de facto standard Node library for sending Web Push; referenced directly by MDN's own Push API guide. Only viable option that doesn't require standing up Firebase Cloud Messaging or a paid SaaS. |
| Vercel Functions (Node.js runtime) | Current default Node runtime on Vercel (Node 20/22 as of 2025–2026 dashboard defaults) | Runs the send-push logic and the subscribe/unsubscribe endpoints | Already the chosen backend per PROJECT.md; Node runtime (not Edge) is *required* here — see Edge incompatibility note below. |
| Upstash for Redis (via Vercel Marketplace, née "Vercel KV") | Free tier | Stores push subscription objects, queried at send time | Successor product to Vercel KV; same Redis-compatible REST API, same "click to provision, env vars auto-injected" DX. Free tier (256MB storage, 500K commands/month as of the March 2025 pricing update) is enormously more than a single-project daily-push workload needs. |
| `@upstash/redis` (npm) | 1.38.2 (latest, published Aug 2026) | Typed REST client for reading/writing subscriptions from the Vercel Function | REST-based (plain `fetch` under the hood), so it works from Vercel's serverless Node runtime without TCP connection-pooling headaches. One dependency: `uncrypto`. This is what a Marketplace "Upstash for Redis" integration expects you to use — `@vercel/kv` still works as a thin wrapper but is legacy naming; go straight to `@upstash/redis`. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None beyond the two above | — | — | This is intentionally a 2-dependency feature. Do not add `body-parser`, `express`, a validation library, etc. — Vercel Functions give you a plain `(req, res)` handler with `req.body` already parsed for JSON, and the payload shapes here (a subscription object, a bearer token, a summary string) are simple enough to validate by hand. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `vercel dev` (Vercel CLI) | Local testing of the Function against the same Node runtime Vercel uses in prod | Optional but recommended once `api/` exists — `vercel dev` will read `.env.local` for `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY`/`KV_REST_API_URL`/`KV_REST_API_TOKEN` the same way prod does. |
| `web-push generate-vapid-keys` (CLI bundled with the `web-push` npm package) | One-time VAPID keypair generation | Run once locally (`npx web-push generate-vapid-keys`), paste the output into Vercel env vars. Do not regenerate this per-deploy or automate it into CI — see Pitfall note below. |

## Client Side: Web Push + Service Worker

**Subscribe flow (in `app.js` or a small new module, still vanilla JS — no npm needed):**
```js
const reg = await navigator.serviceWorker.ready;
const sub = await reg.pushManager.subscribe({
  userVisibleOnly: true, // required by Chrome/Firefox: every push must show a visible notification
  applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY), // public key only, hardcoded as a JS constant
});
// POST sub.toJSON() to your Vercel Function, e.g. POST /api/subscribe
```

**In `service-worker.js` (extends the existing service worker, does not replace it):**
```js
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'AI QuickCap', {
      body: data.body,
      icon: '/icons/icon-192.png', // reuse existing manifest icons
      badge: '/icons/badge-72.png',
      data: { url: data.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
```
`userVisibleOnly: true` is non-negotiable — Chrome and Firefox will reject a subscription without it (silent push without a visible notification is explicitly disallowed to prevent abuse). Confidence: HIGH, this is documented Push API behavior, not a library quirk.

**VAPID key generation/rotation:**
- Generate **once**, via `npx web-push generate-vapid-keys` (part of the `web-push` package's CLI, no separate tool needed).
- Store `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` as Vercel environment variables (Production + Preview). The public key is also needed client-side — bake it into a small JS constant in the frontend (it's public by design, safe to ship).
- **Do not rotate routinely.** Rotating VAPID keys invalidates every existing subscription (the browser's push service validates that the sender's private key matches the public key presented at subscribe time); every visitor would need to re-subscribe. Only rotate if the private key leaks, and treat that as a one-time incident requiring a re-opt-in banner, not a scheduled maintenance task.
- Confidence: HIGH — this is standard VAPID/RFC 8292 behavior, corroborated by the `web-push` library docs and multiple independent implementation guides.

## Server Side: Sending Pushes from a Vercel Function

```js
// api/send-daily-push.js  (Node.js Vercel Function, NOT Edge runtime)
import webpush from 'web-push';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv(); // reads KV_REST_API_URL / KV_REST_API_TOKEN, auto-injected by the Marketplace integration

webpush.setVapidDetails(
  'mailto:you@example.com', // or an https: URL — required "subject" claim
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export default async function handler(req, res) {
  // 1. Auth: bearer token check (see next section)
  const auth = req.headers.authorization;
  if (auth !== `Bearer ${process.env.PUSH_TRIGGER_TOKEN}`) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const { summary } = req.body; // the day's sector narrative, sent in the POST body — see trigger section for why
  const subs = await redis.hgetall('push:subscriptions'); // { [endpointHash]: JSON string }

  const results = await Promise.allSettled(
    Object.entries(subs || {}).map(async ([id, subJson]) => {
      const subscription = JSON.parse(subJson);
      try {
        await webpush.sendNotification(subscription, JSON.stringify({
          title: 'AI QuickCap — Resumen diario',
          body: summary,
          url: '/',
        }));
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          // subscription expired or was revoked by the browser — prune it
          await redis.hdel('push:subscriptions', id);
        }
        throw err;
      }
    })
  );

  return res.status(200).json({ sent: results.filter(r => r.status === 'fulfilled').length });
}
```

`sendNotification()` returns a Promise resolving to `{ statusCode, headers, body }` on success and rejects with a `WebPushError` (which carries `.statusCode`) on failure. A `404`/`410` means the push service says the subscription is gone (user uninstalled, cleared data, or the endpoint expired) — this is the standard signal to delete it from storage, not a bug to retry. Confidence: HIGH, documented in the `web-push` README.

## KV Storage Schema

Store subscriptions in a single Redis **hash**, not a set of individual keys and not `KEYS`/`SCAN` over the whole keyspace:

```
HSET push:subscriptions <sha256(endpoint)> <JSON.stringify(subscription)>
```

- **Key:** a hash (e.g., SHA-256) of `subscription.endpoint`, so re-subscribing the same browser overwrites instead of duplicating.
- **Value:** the full `PushSubscription.toJSON()` object as a JSON string — `{ endpoint, expirationTime, keys: { p256dh, auth } }`. This is exactly what `webpush.sendNotification()` expects as its first argument, so no reshaping is needed between storage and send.
- **Read "all active subscriptions":** `HGETALL push:subscriptions` — one command, returns every subscription in one round trip. At the scale implied by this project (a single-page site's opt-in daily digest, not a mass-market app), this comfortably stays within Upstash's free-tier command budget even sent once a day.
- **Unsubscribe:** `HDEL push:subscriptions <sha256(endpoint)>`, called both (a) explicitly, when a visitor clicks "turn off notifications," and (b) implicitly, by the send function itself when a push bounces with 404/410 — do both, don't rely on only one path.
- Why a hash over a Redis `SET` of raw JSON strings: a set can't be updated in place (you'd have to find-and-remove the old string by value, which requires the full value, not just the endpoint), and it can't dedupe by endpoint if `expirationTime` or key material ever differs between two subscribe calls from the same browser. A hash keyed by endpoint hash makes upsert/delete O(1) and idempotent.
- Confidence: HIGH for the general pattern (standard Redis usage); MEDIUM for "definitely fits the free tier" since exact daily subscriber counts aren't known yet — flag as something to sanity-check once real opt-in numbers exist, not a blocker now.

## Triggering the Send: Python Pipeline → Vercel Function (not Vercel Cron)

**Recommendation: a bearer-token-protected Vercel Function endpoint, called via HTTPS from the existing GitHub Actions pipeline — not a separate Vercel Cron Job.**

Reasons, in order of importance:

1. **Vercel Cron on the Hobby (free) tier is capped at once per day with timing only guaranteed within the hour it's scheduled for** — it is not precise enough to reliably land at NYSE/Nasdaq close (4:00pm ET, which itself shifts between EST/EDT), and Vercel Cron always runs in UTC with no daylight-saving awareness. The existing Python pipeline already knows when its market-close-adjacent hourly run landed; piggybacking on that is both simpler and more accurate than fighting Vercel Cron's scheduling model. Confidence: HIGH, confirmed via Vercel's current cron docs and changelog.
2. **A second, independent Vercel Cron job reading `data.json` would duplicate the "is this the market-close run" logic** that the Python pipeline already has to determine before deciding to fetch OHLC/write the daily summary — two sources of truth for "is it time" is exactly the kind of drift this milestone should avoid, and PROJECT.md explicitly states "no new schedule/infra."
3. **Race condition avoidance:** if the Function instead re-read `data.json` from the deployed site after the pipeline's `git push`, it would need to wait for Vercel's redeploy to finish (static site rebuilds are not instant, and GitHub Actions has no visibility into Vercel's deploy completion without extra API polling). The clean fix: **have the Python job POST the day's summary text directly in the request body**, so the Function never needs to know whether the redeploy finished — it just sends what it was told.

**Concretely, in the GitHub Actions workflow, after the existing `git commit`/`git push` step (Python stdlib only, no new pipeline dependency needed):**

```python
import urllib.request, json, os

payload = json.dumps({"summary": daily_summary_text}).encode()
req = urllib.request.Request(
    "https://your-domain.vercel.app/api/send-daily-push",
    data=payload,
    headers={
        "Authorization": f"Bearer {os.environ['PUSH_TRIGGER_TOKEN']}",
        "Content-Type": "application/json",
    },
    method="POST",
)
urllib.request.urlopen(req, timeout=30)
```

- `PUSH_TRIGGER_TOKEN` is a new GitHub Actions secret (same mechanism already used for `ALPHAVANTAGE_API_KEY`/`FINNHUB_API_KEY`/`ANTHROPIC_API_KEY`), matched against the same value set as a Vercel environment variable. This keeps the endpoint from being callable by anyone who finds the URL.
- The pipeline should only make this call on the run it identifies as market-close (whatever gating logic already exists for "is this the closing-price run" — reuse it, don't add a second scheduling concept), and only send once — a duplicate call on a retry should be idempotent or guarded, e.g. by checking a `push:sent:{date}` key in Redis before sending (`SETNX`, or `SET ... NX EX 86400` for auto-expiry) so an accidental re-run of the GitHub Actions job doesn't double-push everyone.
- This uses **Python's own stdlib `urllib.request`** (already how the pipeline calls Finnhub/Alpha Vantage per the existing STACK.md — no `requests` dependency in the pipeline today, and this doesn't need to change that).

Confidence: HIGH for the mechanism (bearer-token webhook call is a standard, well-understood pattern); MEDIUM for the exact idempotency-guard implementation since it depends on the pipeline's existing market-close detection logic, which wasn't in scope to re-read here.

## Does This Force a `package.json` Onto the Project?

**Yes — but only for the `api/` directory, not the frontend.** This is worth flagging explicitly because PROJECT.md and the existing STACK.md both call out the zero-dependency status as a deliberate architectural choice.

- Vercel builds a project from **one `package.json` at the repo root** (or at whatever root directory is configured) — there is no way to give a Vercel Function its own isolated `package.json` scoped to just `api/`. Once you add `import webpush from 'web-push'` in any file under `api/`, Vercel needs a root `package.json` + `package-lock.json` (or the dependency won't resolve at build time) and, in CI/local dev, a `node_modules` folder.
- **This does not touch `index.html`/`app.js`/`styles.css` or introduce a bundler.** The frontend stays exactly as-is — no build step, no transpilation, nothing served to the browser changes in kind. The new `package.json` only exists to tell Vercel what to install for the two serverless functions (`api/subscribe.js`, `api/unsubscribe.js`, `api/send-daily-push.js`).
- **Minimal footprint:** two direct dependencies (`web-push`, `@upstash/redis`), pulling in a handful of small transitive packages (`jws`, `asn1.js`, `http_ece`, `minimist`, `https-proxy-agent` for `web-push`; `uncrypto` for `@upstash/redis`). No dev dependencies, no test runner, no linter — none of that is required for two dependencies used by three small serverless functions. `npm install` and commit the lockfile; that's the entire footprint.
- **Runtime constraint:** these functions must run on Vercel's **Node.js serverless runtime**, not the Edge runtime — `web-push` signs VAPID JWTs using Node's `crypto` module internally (via its ECDSA/asn1 dependencies), and Vercel's Edge runtime does not support the Node `crypto` module. This is the default for files under `api/` unless explicitly configured with `export const config = { runtime: 'edge' }`, so no special action is needed — just don't opt into Edge for these routes.

Confidence: HIGH — Vercel's documented build behavior (single root `package.json`) and the Edge/Node crypto incompatibility are both independently confirmed (Vercel docs + multiple community reports of the exact `web-push`-in-Edge failure mode).

## Installation

```bash
# At repo root — this IS the first package.json this repo will ever have
npm init -y

npm install web-push @upstash/redis

# No dev dependencies strictly required; optional for local testing:
npm install -D vercel
```

```bash
# One-time VAPID keypair generation (not a runtime dependency, just uses the installed web-push CLI)
npx web-push generate-vapid-keys
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|--------------------------|
| `web-push` (npm) | Firebase Cloud Messaging (FCM) Web SDK | If the project already used Firebase for something else, or needed iOS/Android native push unification via a single vendor. Explicitly ruled out here — PROJECT.md states the whole point of moving to Vercel was avoiding a second platform/account for one feature; standard Web Push (RFC 8030/8291/8292) needs no third-party push vendor account at all. |
| `web-push` (npm) | OneSignal / third-party push SaaS | If the team wanted a hosted dashboard for send analytics/segmentation without writing any backend code. Explicitly ruled out in PROJECT.md's constraints ("avoid paid third-party notification services," "lo más simple posible"). |
| Upstash for Redis (Marketplace) | Vercel Postgres / Neon / Supabase | If subscription data needed relational queries (e.g., joins with a user accounts table). Not applicable — this project has no accounts, and the entire dataset is "one hash of endpoint → subscription JSON." A KV store is architecturally the right shape, not just the cheapest. |
| Bearer-token Function call from GitHub Actions | Vercel Cron Job reading `data.json` independently | If the project ever drops the Python pipeline entirely and wants push scheduling to live purely on Vercel's side. Not applicable now — the pipeline is the sole source of truth for "is it market close," and PROJECT.md explicitly says no new schedule/infra. |
| Node.js Vercel Function runtime | Edge Runtime | Only if you rewrite the push-sending logic to use Web Crypto directly instead of `web-push` (nontrivial: you'd be re-implementing RFC 8291 payload encryption and VAPID JWT signing by hand). Not worth it for a once-a-day, low-volume send — Node runtime cold starts are irrelevant at this call frequency. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|--------------|
| `@vercel/kv` npm package as a "new" choice | It's the legacy wrapper around the now-discontinued Vercel KV product; it still technically works (proxies to Upstash) for already-migrated stores, but new setup docs point at `@upstash/redis` directly, and using the old package name in new code/roadmap docs will confuse whoever sets up the Marketplace integration later. | `@upstash/redis`, installed via the "Upstash for Redis" Marketplace integration |
| Rotating VAPID keys on any kind of schedule (e.g., "rotate monthly for security") | Instantly breaks every existing subscription — there's no rollback, every opted-in visitor silently stops receiving pushes until they re-subscribe, and nothing in the UI would tell them why. | Generate once, store as a long-lived secret, rotate only on confirmed key compromise |
| A second Vercel Cron Job to decide "should we send today" | Duplicates the market-close detection the Python pipeline already does; Hobby-tier Cron's once-a-day/within-the-hour precision isn't tight enough for a market-close-timed send anyway | Trigger from the pipeline's existing market-close run via an authenticated HTTPS POST |
| `KEYS` or unbounded `SCAN` over the Redis keyspace to "get all subscriptions" | Slow/blocking pattern that doesn't matter at this scale today but is bad habit-forming; also Upstash's REST-based `KEYS` command has practical result-size caveats | A single Redis hash (`push:subscriptions`) + `HGETALL` |
| Silently retrying failed sends indefinitely | A 404/410 from the push service means the subscription is permanently gone (uninstalled app, cleared browser data, or a stale test subscription) — retrying wastes the daily command budget and pollutes error logs | Delete on 404/410 inside the same send loop, as shown above |
| Adding Express, a router framework, or a validation library for these 3 endpoints | Total overkill for 3 small handlers with `{summary}`, `{subscription}`, and an empty body respectively; adds dependency surface for no benefit on Vercel, which already gives you routing via the `api/` filesystem convention | Plain Vercel Function handlers with manual `if` checks |

## Stack Patterns by Variant

**If push volume ever grows beyond a few thousand subscribers and a single `HGETALL` + sequential `sendNotification` loop starts taking noticeably long (Vercel Function default timeout is 10s on Hobby, up to 60s configurable on Pro):**
- Batch the sends with `Promise.allSettled` in chunks (already shown above) rather than sequentially awaiting each one.
- If it still doesn't fit in one invocation, this becomes a genuine job-queue problem (e.g., trigger a Vercel Cron that drains a queue) — not needed at this milestone's scale, flagged here only so a future "why is the daily push timing out" investigation has a starting point.

**If Safari/iOS support becomes a support burden (users on iOS < 16.4, or users who haven't added the PWA to their home screen — iOS requires "Add to Home Screen" before Web Push works at all, unlike Chrome/Android):**
- This is a platform limitation, not a stack choice — there's no library-level workaround. Worth a PITFALLS-doc callout (out of scope for this STACK doc) so the opt-in UI can set expectations correctly for iOS visitors.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|------------------|-------|
| `web-push@3.6.7` | Node >= 16 (per its `engines` field) | Vercel's current Node runtimes (20.x/22.x as of 2025–2026) comfortably exceed this; no compatibility concern. |
| `web-push@3.6.7` | Vercel Node.js serverless runtime | Compatible. NOT compatible with Vercel Edge runtime (see crypto note above). |
| `@upstash/redis@1.38.2` | Any environment with `fetch` (REST-based client) | Works identically in Vercel Node or Edge runtime — the constraint here is `web-push`, not this package. |
| VAPID public key (client) | VAPID private key (server) | Must be generated as a matched pair and never mixed across environments (e.g., a Preview-deploy key pair vs. Production) — if the frontend's hardcoded public key doesn't match the private key the Function signs with, every send fails with a 401/403 from the push service. |

## Sources

- [Redis on Vercel — official docs](https://vercel.com/docs/redis) — HIGH confidence, confirms Vercel KV → Marketplace transition
- [Upstash joins the Vercel Marketplace — Vercel changelog](https://vercel.com/changelog/upstash-joins-the-vercel-marketplace) — HIGH confidence
- [Alternatives to Vercel KV? — Vercel Community](https://community.vercel.com/t/alternatives-to-vercel-kv/43233) — MEDIUM, community corroboration of the deprecation
- [web-push npm package](https://www.npmjs.com/package/web-push) + npm registry API (`registry.npmjs.org/web-push`) — HIGH confidence, verified version 3.6.7, `engines.node >= 16`, dependency list directly from registry metadata
- [web-push-libs/web-push GitHub repo](https://github.com/web-push-libs/web-push) — HIGH confidence, verified API shape (`generateVAPIDKeys`, `setVapidDetails`, `sendNotification`) and confirmed release history
- [@upstash/redis npm package](https://www.npmjs.com/package/@upstash/redis) + npm registry API — HIGH confidence, verified version 1.38.2 (published Aug 2026), single dependency (`uncrypto`)
- [Cron jobs now support 100 per project on every plan — Vercel changelog](https://vercel.com/changelog/cron-jobs-now-support-100-per-project-on-every-plan) — HIGH confidence
- [Vercel Limits docs](https://vercel.com/docs/limits) — HIGH confidence, confirms Hobby-tier once-per-day cron cadence and within-the-hour timing precision
- [Push API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Push_API) — HIGH confidence, `userVisibleOnly` requirement and general Push API mechanics
- [Re-engageable Notifications & Push — MDN js13kGames tutorial](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Tutorials/js13kGames/Re-engageable_Notifications_Push) — MEDIUM, general best-practice corroboration
- [Edge runtime crypto module discussion — vercel/next.js GitHub](https://github.com/vercel/next.js/discussions/51753) — MEDIUM, corroborates Edge/Node crypto incompatibility relevant to `web-push`
- [Upstash Redis pricing/limits](https://upstash.com/pricing/redis) — MEDIUM confidence (pricing pages change; re-verify exact numbers at implementation time), confirms free tier (256MB, 500K commands/month as of March 2025 update) comfortably covers this use case

---
*Stack research for: Web Push notifications on a static PWA (Vercel Functions + KV backend, triggered by an existing Python pipeline)*
*Researched: 2026-08-12*
