// api/subscribe.js
//
// Vercel Function (runtime Node.js por defecto, sin `export const config`):
// guarda o actualiza una PushSubscription del navegador en Redis. Satisface
// OPTIN-02 ("el visitante puede optar por notificaciones push del sitio").
//
// El esquema de Redis (clave del hash, derivación del campo, forma del
// valor) es el fijado en la Fase 1 por scripts/push_redis.py — ver el
// docstring de ese archivo (líneas 11-33) para el contrato canónico. Esta
// Function debe escribir exactamente ese mismo esquema para que
// scripts/push_redis.py y la futura Function de envío (Fase 3) lean lo
// mismo que esta escribe.
import { Redis } from "@upstash/redis";
import { createHash } from "node:crypto";

// Redis.fromEnv() intenta primero el par de nombres genérico de Upstash y,
// si no existen, cae al par que realmente provisiona la integración de
// Upstash for Redis vía Vercel Marketplace en este proyecto (los mismos
// nombres que usa scripts/push_redis.py) — por eso fromEnv() es la llamada
// correcta acá; nunca hardcodear los nombres de las env vars.
const redis = Redis.fromEnv();

const SUBSCRIPTIONS_KEY = "push:subscriptions";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  // req.body puede venir undefined o como string crudo si el cliente no
  // manda Content-Type: application/json — nunca asumir la forma, siempre
  // leer con optional chaining.
  const sub = req.body?.subscription;
  const endpoint = sub?.endpoint;
  const p256dh = sub?.keys?.p256dh;
  const auth = sub?.keys?.auth;

  // Misma validación que scripts/push_redis.py's put(): endpoint,
  // keys.p256dh y keys.auth deben ser strings no vacíos. Nada se escribe en
  // Redis si esto falla.
  if (
    typeof endpoint !== "string" ||
    !endpoint ||
    typeof p256dh !== "string" ||
    !p256dh ||
    typeof auth !== "string" ||
    !auth
  ) {
    return res.status(400).json({ error: "invalid subscription" });
  }

  // Control adicional (más estricto que push_redis.py, que confía en un
  // archivo autorado localmente): el endpoint debe parsear como una URL
  // https:. Esto acota lo que un llamante malicioso puede insertar en el
  // hash — control V5 de validación de entrada de 02-RESEARCH.md.
  try {
    const url = new URL(endpoint);
    if (url.protocol !== "https:") {
      return res.status(400).json({ error: "invalid subscription" });
    }
  } catch {
    return res.status(400).json({ error: "invalid subscription" });
  }

  const field = createHash("sha256").update(endpoint).digest("hex");

  // Nunca loguear el objeto de suscripción, endpoint, p256dh ni auth — es
  // material de cifrado por dispositivo (misma razón por la que
  // push-test-subscription.json está en .gitignore).
  await redis.hset(SUBSCRIPTIONS_KEY, { [field]: JSON.stringify(sub) });

  return res.status(200).json({ ok: true });
}
