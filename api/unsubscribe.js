// api/unsubscribe.js
//
// Vercel Function (runtime Node.js por defecto, sin `export const config`):
// borra una PushSubscription previamente guardada en Redis, identificada
// solo por su endpoint. Satisface OPTIN-05 ("desuscribirse borra la
// suscripción server-side en Redis, no solo localmente").
//
// El esquema de Redis (clave del hash, derivación del campo) es el mismo
// fijado en la Fase 1 por scripts/push_redis.py — ver el docstring de ese
// archivo (líneas 11-33).
import { Redis } from "@upstash/redis";
import { createHash } from "node:crypto";

// Redis.fromEnv() cae automáticamente al par de nombres de env vars que
// realmente provisiona la integración de Upstash for Redis en este
// proyecto (los mismos que usa scripts/push_redis.py) — nunca hardcodear
// esos nombres acá.
const redis = Redis.fromEnv();

const SUBSCRIPTIONS_KEY = "push:subscriptions";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const endpoint = req.body?.endpoint;
  if (typeof endpoint !== "string" || !endpoint) {
    return res.status(400).json({ error: "invalid endpoint" });
  }

  const field = createHash("sha256").update(endpoint).digest("hex");

  // HDEL sobre un campo inexistente devuelve 0, no un error — "ya estaba
  // desuscripto" es un resultado normal, no un error del cliente. Se
  // devuelve 200 sin importar el conteo. Este mismo contrato idempotente lo
  // va a reusar la Function de envío de la Fase 3 para podar suscripciones
  // muertas defensivamente, así que el 200 idempotente es un requisito que
  // trasciende esta fase.
  await redis.hdel(SUBSCRIPTIONS_KEY, field);

  return res.status(200).json({ ok: true });
}
