#!/usr/bin/env node
// scripts/api-selftest.mjs
//
// El Vercel CLI no está instalado y `vercel dev` no está disponible en este
// entorno, así que este harness prueba api/subscribe.js y api/unsubscribe.js
// importando directamente sus exports por default e invocándolos con objetos
// req/res mínimos, contra la instancia real de Upstash Redis. Es el
// equivalente en Node del `python3 scripts/push_redis.py selftest` de la
// Fase 1.
//
// El llamante debe exportar KV_REST_API_URL/KV_REST_API_TOKEN al entorno
// antes de correr este script (por ejemplo sourceando .env.local), tal como
// hace scripts/send-test-push.sh — este script no lee .env.local por sí
// mismo.
//
// Uso:
//   set -a; . ./.env.local; set +a; node scripts/api-selftest.mjs

import { createHash, randomUUID } from "node:crypto";

const SUBSCRIPTIONS_KEY = "push:subscriptions";

// Chequear las env vars ANTES de importar los handlers/el cliente Redis:
// tanto api/subscribe.js como api/unsubscribe.js llaman a Redis.fromEnv()
// a nivel de módulo, así que un import estático arriba del archivo
// ejecutaría esa construcción (y sus warnings) antes de este chequeo.
// Import dinámico después del chequeo evita ese ruido y falla rápido y
// limpio, igual que push_redis.py:101-102.
if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
  console.error(
    "Error: faltan KV_REST_API_URL/KV_REST_API_TOKEN en el entorno. Corré: set -a; . ./.env.local; set +a; node scripts/api-selftest.mjs"
  );
  process.exit(1);
}

const { Redis } = await import("@upstash/redis");
const { default: subscribeHandler } = await import("../api/subscribe.js");
const { default: unsubscribeHandler } = await import("../api/unsubscribe.js");

const redis = Redis.fromEnv();

function makeRes() {
  const res = {
    statusCode: undefined,
    body: undefined,
    ended: false,
    status(code) {
      res.statusCode = code;
      return res;
    },
    json(body) {
      res.body = body;
      return res;
    },
    end() {
      res.ended = true;
      return res;
    },
  };
  return res;
}

function endpointField(endpoint) {
  return createHash("sha256").update(endpoint).digest("hex");
}

const fakeEndpoint = `https://fcm.googleapis.com/fcm/send/aisp-selftest-${randomUUID()}`;
const fakeSubscription = {
  endpoint: fakeEndpoint,
  expirationTime: null,
  keys: {
    p256dh: "aisp-selftest-p256dh-placeholder-base64",
    auth: "aisp-selftest-auth-placeholder-b64",
  },
};

let passCount = 0;
let failCount = 0;

function report(name, ok, detail) {
  if (ok) {
    passCount += 1;
    console.log(`PASS: ${name}`);
  } else {
    failCount += 1;
    console.error(`FAIL: ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function run() {
  // 1. subscribe con method GET -> 405
  {
    const res = makeRes();
    await subscribeHandler({ method: "GET" }, res);
    report("subscribe GET -> 405", res.statusCode === 405);
  }

  // 2. subscribe con body faltando keys.auth -> 400
  {
    const res = makeRes();
    await subscribeHandler(
      {
        method: "POST",
        body: {
          subscription: {
            endpoint: fakeEndpoint,
            keys: { p256dh: "x" },
          },
        },
      },
      res
    );
    report("subscribe missing keys.auth -> 400", res.statusCode === 400);
  }

  // 3. subscribe con endpoint no-URL -> 400
  {
    const res = makeRes();
    await subscribeHandler(
      {
        method: "POST",
        body: {
          subscription: {
            endpoint: "not-a-url",
            keys: { p256dh: "x", auth: "y" },
          },
        },
      },
      res
    );
    report("subscribe endpoint not-a-url -> 400", res.statusCode === 400);
  }

  // 4. subscribe con endpoint http (no https) -> 400
  {
    const res = makeRes();
    await subscribeHandler(
      {
        method: "POST",
        body: {
          subscription: {
            endpoint: "http://example.com/x",
            keys: { p256dh: "x", auth: "y" },
          },
        },
      },
      res
    );
    report("subscribe endpoint http (non-https) -> 400", res.statusCode === 400);
  }

  // 5. subscribe con la fixture válida -> 200 { ok: true }
  {
    const res = makeRes();
    await subscribeHandler(
      { method: "POST", body: { subscription: fakeSubscription } },
      res
    );
    report(
      "subscribe valid fixture -> 200 {ok:true}",
      res.statusCode === 200 && res.body && res.body.ok === true
    );
  }

  // 6. lectura directa en Redis: hget devuelve el endpoint bajo sha256hex(endpoint)
  {
    const field = endpointField(fakeEndpoint);
    const raw = await redis.hget(SUBSCRIPTIONS_KEY, field);
    let parsedEndpoint;
    try {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      parsedEndpoint = parsed?.endpoint;
    } catch {
      parsedEndpoint = undefined;
    }
    report(
      "redis hget(sha256hex(endpoint)) round-trips endpoint",
      parsedEndpoint === fakeEndpoint,
      `got ${JSON.stringify(parsedEndpoint)}`
    );
  }

  // 7. unsubscribe con method GET -> 405
  {
    const res = makeRes();
    await unsubscribeHandler({ method: "GET" }, res);
    report("unsubscribe GET -> 405", res.statusCode === 405);
  }

  // 8. unsubscribe con {} (sin endpoint) -> 400
  {
    const res = makeRes();
    await unsubscribeHandler({ method: "POST", body: {} }, res);
    report("unsubscribe missing endpoint -> 400", res.statusCode === 400);
  }

  // 9. unsubscribe con el endpoint fake -> 200; luego hget devuelve null/undefined
  {
    const res = makeRes();
    await unsubscribeHandler(
      { method: "POST", body: { endpoint: fakeEndpoint } },
      res
    );
    const okFirst = res.statusCode === 200 && res.body && res.body.ok === true;

    const field = endpointField(fakeEndpoint);
    const raw = await redis.hget(SUBSCRIPTIONS_KEY, field);
    report(
      "unsubscribe known endpoint -> 200, then hget is empty",
      okFirst && (raw === null || raw === undefined),
      `status=${res.statusCode} raw=${JSON.stringify(raw)}`
    );
  }

  // 10. unsubscribe de nuevo con el MISMO endpoint ya borrado -> 200 (idempotencia)
  {
    const res = makeRes();
    await unsubscribeHandler(
      { method: "POST", body: { endpoint: fakeEndpoint } },
      res
    );
    report(
      "unsubscribe already-deleted endpoint -> 200 (idempotent)",
      res.statusCode === 200 && res.body && res.body.ok === true
    );
  }
}

try {
  await run();
} finally {
  // Limpieza defensiva: si algún paso falló a mitad de camino, garantizar
  // que no quede una fila de selftest en Redis.
  try {
    const field = endpointField(fakeEndpoint);
    await redis.hdel(SUBSCRIPTIONS_KEY, field);
  } catch (cleanupErr) {
    console.error(`Aviso: falló la limpieza final: ${cleanupErr}`);
  }
}

console.log(`\n${passCount} PASS, ${failCount} FAIL`);
process.exit(failCount === 0 ? 0 : 1);
