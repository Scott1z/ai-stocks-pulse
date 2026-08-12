#!/usr/bin/env python3
"""
push_redis.py

CLI stdlib-only (sin dependencias externas) para inspeccionar y probar el
almacenamiento de suscripciones push en Redis (Upstash for Redis, via su REST
API). Este script fija el esquema canónico que usarán las Functions de Vercel
en fases posteriores (api/subscribe.js, api/unsubscribe.js, api/send-daily-push.js)
y sirve como herramienta de depuración/verificación manual.

Esquema canónico (una sola estructura, un solo hash):
  - Clave del hash: "push:subscriptions" (ver SUBSCRIPTIONS_KEY).
  - Campo dentro del hash: el hex digest SHA-256 de subscription.endpoint. Usar
    el hash del endpoint (y no el endpoint crudo) como campo garantiza que una
    misma suscripción vuelta a registrar pise el valor anterior en vez de
    duplicarse, sin exponer el endpoint completo como nombre de campo.
  - Valor: el JSON compacto (separators sin espacios, claves ordenadas) de
    exactamente PushSubscription.toJSON():
      { "endpoint": str, "expirationTime": null | number,
        "keys": { "p256dh": str, "auth": str } }
    Este es el mismo objeto que espera webpush.sendNotification() como primer
    argumento, así que no hace falta transformar nada entre el guardado y el
    envío.
  - Alta/actualización: HSET push:subscriptions <sha256hex(endpoint)> <json>
  - Lectura puntual: HGET push:subscriptions <sha256hex(endpoint)>
  - Lectura de todas: HGETALL push:subscriptions — UN solo comando, siempre.
    Está terminantemente prohibido enumerar suscripciones recorriendo el
    keyspace completo (nada de KEYS ni de SCAN): con potencialmente miles de
    suscriptores, esos patrones son O(n) sobre todo el keyspace y pueden
    agotar el presupuesto de comandos del free tier de Upstash en un solo
    llamado. HGETALL sobre este hash dedicado es siempre un único comando,
    sin importar cuántas suscripciones haya.
  - Baja: HDEL push:subscriptions <sha256hex(endpoint)>

Variables de entorno requeridas (ya provistas por la integración de Upstash
for Redis vía Vercel Marketplace, tanto en Vercel como en .env.local local):
  KV_REST_API_URL    URL base del REST endpoint de Upstash para este proyecto.
  KV_REST_API_TOKEN  Token bearer con permiso de lectura/escritura.

Subcomandos:
  put <path-a-subscription.json>   Valida y guarda una suscripción (upsert).
  get <endpoint>                    Imprime el JSON crudo guardado para ese
                                     endpoint, o nada si no existe.
  list                              Lista TODAS las suscripciones guardadas,
                                     una línea "<field>\\t<endpoint>" por
                                     suscripción (nunca imprime p256dh/auth).
  del <endpoint>                    Borra la suscripción de ese endpoint.
  selftest                          Prueba de punta a punta contra el Redis
                                     real: escribe, lee, verifica el upsert
                                     por hash de endpoint, enumera con
                                     HGETALL y borra, sin dejar residuos.

Uso:
  python3 scripts/push_redis.py selftest
"""

from __future__ import annotations

import hashlib
import json
import os
import sys
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

# --- Config -----------------------------------------------------------------

SUBSCRIPTIONS_KEY = "push:subscriptions"
ENV_FILE = ".env.local"

REQUEST_TIMEOUT_SECONDS = 15


# --- Entorno ------------------------------------------------------------------


def _load_env() -> None:
    """Si faltan las credenciales en el entorno, las carga desde .env.local
    en la raíz del repo (formato KEY=VALUE simple, con comillas opcionales).
    No pisa variables que ya estén presentes en el entorno del proceso —
    esto hace que el script funcione igual localmente (leyendo .env.local) y
    en una shell de Vercel/CI donde las variables ya vienen inyectadas."""
    if os.environ.get("KV_REST_API_URL") and os.environ.get("KV_REST_API_TOKEN"):
        return

    project_root = Path(__file__).resolve().parent.parent
    env_path = project_root / ENV_FILE
    if env_path.is_file():
        for raw_line in env_path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            key = key.strip()
            value = value.strip()
            if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
                value = value[1:-1]
            os.environ.setdefault(key, value)

    if not os.environ.get("KV_REST_API_URL") or not os.environ.get("KV_REST_API_TOKEN"):
        sys.exit("Falta KV_REST_API_URL/KV_REST_API_TOKEN en el entorno.")


# --- Cliente REST de Upstash --------------------------------------------------


def _command(*args: str) -> object:
    """Ejecuta un único comando de Redis contra el REST endpoint de Upstash:
    un POST cuyo body es un array JSON [comando, *args] y devuelve el campo
    "result" de la respuesta. Lanza una excepción si la respuesta no es 200."""
    _load_env()
    url = os.environ["KV_REST_API_URL"]
    token = os.environ["KV_REST_API_TOKEN"]

    body = json.dumps(list(args)).encode("utf-8")
    request = Request(
        url,
        data=body,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urlopen(request, timeout=REQUEST_TIMEOUT_SECONDS) as response:
            raw = response.read().decode("utf-8")
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", "replace") if hasattr(exc, "read") else ""
        raise RuntimeError(f"Upstash devolvió HTTP {exc.code}: {detail}") from exc
    except URLError as exc:
        raise RuntimeError(f"No se pudo conectar a Upstash: {exc}") from exc

    payload = json.loads(raw)
    return payload.get("result")


# --- Esquema push:subscriptions ----------------------------------------------


def endpoint_field(endpoint: str) -> str:
    """Campo del hash push:subscriptions para un endpoint dado: su hex digest
    SHA-256. Usar este hash (y no el endpoint crudo) como campo hace que una
    misma suscripción, vuelta a registrar, pise el valor anterior."""
    return hashlib.sha256(endpoint.encode("utf-8")).hexdigest()


def put(subscription: dict) -> str:
    """Valida la forma mínima de una PushSubscription.toJSON() y la guarda
    con HSET. Lanza ValueError si falta endpoint, keys.p256dh o keys.auth —
    esta es la barrera de validación de datos no confiables provenientes del
    cliente (Fase 2), aplicada desde el día uno en la capa de almacenamiento."""
    endpoint = subscription.get("endpoint")
    keys = subscription.get("keys") or {}
    p256dh = keys.get("p256dh") if isinstance(keys, dict) else None
    auth = keys.get("auth") if isinstance(keys, dict) else None

    if not isinstance(endpoint, str) or not endpoint:
        raise ValueError("La suscripción no tiene un 'endpoint' válido.")
    if not isinstance(p256dh, str) or not p256dh:
        raise ValueError("La suscripción no tiene un 'keys.p256dh' válido.")
    if not isinstance(auth, str) or not auth:
        raise ValueError("La suscripción no tiene un 'keys.auth' válido.")

    field = endpoint_field(endpoint)
    value = json.dumps(subscription, separators=(",", ":"), sort_keys=True)
    _command("HSET", SUBSCRIPTIONS_KEY, field, value)
    return field


def get(endpoint: str) -> str | None:
    """Devuelve el JSON crudo (str) guardado para ese endpoint, o None si no
    hay ninguna suscripción registrada con ese endpoint."""
    field = endpoint_field(endpoint)
    result = _command("HGET", SUBSCRIPTIONS_KEY, field)
    if result is None:
        return None
    return str(result)


def list_all() -> dict:
    """Enumera TODAS las suscripciones guardadas en un único HGETALL —
    nunca recorrer el keyspace completo para esto. Devuelve un mapa
    field -> JSON crudo (str)."""
    result = _command("HGETALL", SUBSCRIPTIONS_KEY)
    if result is None:
        return {}
    if isinstance(result, dict):
        return result
    if isinstance(result, list):
        # El REST API de Upstash puede devolver HGETALL como un array plano
        # [field1, value1, field2, value2, ...] en vez de un objeto — se
        # normaliza acá para que el resto del script trabaje siempre con un
        # dict, sin importar la forma exacta de la respuesta.
        return {result[i]: result[i + 1] for i in range(0, len(result) - 1, 2)}
    return {}


def delete(endpoint: str) -> int:
    """Borra la suscripción de ese endpoint con HDEL. Devuelve la cantidad de
    campos eliminados (0 o 1) — este es el camino que también debe recorrer
    el envío en la Fase 3 cuando un push rebota con 404/410."""
    field = endpoint_field(endpoint)
    result = _command("HDEL", SUBSCRIPTIONS_KEY, field)
    try:
        return int(result)
    except (TypeError, ValueError):
        return 0


# --- Selftest ------------------------------------------------------------------


def selftest() -> int:
    """Prueba de punta a punta contra el Redis real, en orden:
      1. PING -> debe responder PONG (credenciales y alcanzabilidad).
      2. Arma una PushSubscription.toJSON() sintética de prueba.
      3. put() la guarda; el campo devuelto debe ser endpoint_field(endpoint),
         64 caracteres hex.
      4. get() la lee de vuelta; el JSON crudo debe ser idéntico byte a byte
         al que se guardó.
      5. put() la misma fixture una segunda vez; list_all() debe seguir
         teniendo exactamente un campo para ese endpoint (upsert, no
         duplicado).
      6. list_all() debe ser un dict que incluya ese campo (enumeración por
         HGETALL en un solo comando).
      7. delete() debe borrar exactamente 1, y get() debe devolver None
         después.
    Imprime "selftest OK" y devuelve 0 si todo pasa. Ante cualquier fallo,
    imprime un "Aviso: ..." a stderr describiendo qué paso falló y devuelve 1.
    """
    endpoint = "https://fcm.googleapis.com/fcm/send/gsd-phase1-selftest"
    try:
        pong = _command("PING")
        if pong != "PONG":
            print(f"Aviso: selftest paso 1 (PING) falló, respuesta: {pong!r}", file=sys.stderr)
            return 1

        fixture = {
            "endpoint": endpoint,
            "expirationTime": None,
            "keys": {
                "p256dh": "gsd-phase1-selftest-p256dh-placeholder",
                "auth": "gsd-phase1-selftest-auth-placeholder",
            },
        }

        field = put(fixture)
        expected_field = endpoint_field(endpoint)
        if field != expected_field or len(field) != 64:
            print(f"Aviso: selftest paso 3 (put) falló, campo inesperado: {field!r}", file=sys.stderr)
            return 1

        stored = get(endpoint)
        expected_json = json.dumps(fixture, separators=(",", ":"), sort_keys=True)
        if stored != expected_json:
            print(
                "Aviso: selftest paso 4 (get) falló, el JSON leído no es idéntico al guardado.",
                file=sys.stderr,
            )
            return 1

        put(fixture)  # segunda escritura: debe pisar, no duplicar
        after_second_put = list_all()
        if list(after_second_put.keys()).count(expected_field) != 1:
            print(
                "Aviso: selftest paso 5 (upsert) falló, no hay exactamente un campo para el endpoint.",
                file=sys.stderr,
            )
            return 1

        if expected_field not in after_second_put:
            print(
                "Aviso: selftest paso 6 (list_all/HGETALL) falló, el campo no está presente.",
                file=sys.stderr,
            )
            return 1

        removed = delete(endpoint)
        if removed != 1:
            print(f"Aviso: selftest paso 7 (delete) falló, se esperaba 1 y se obtuvo {removed!r}", file=sys.stderr)
            return 1

        if get(endpoint) is not None:
            print(
                "Aviso: selftest paso 7 (delete) falló, get() todavía devuelve datos tras el borrado.",
                file=sys.stderr,
            )
            return 1
    except Exception as exc:  # noqa: BLE001 - selftest debe reportar cualquier falla, no solo las esperadas
        print(f"Aviso: selftest falló con una excepción: {exc}", file=sys.stderr)
        return 1

    print("selftest OK")
    return 0


# --- CLI -----------------------------------------------------------------------


def _print_usage() -> None:
    print(
        "Usage / Uso: python3 push_redis.py <comando> [args]\n"
        "  put <path-a-subscription.json>   Guarda una suscripción (upsert por endpoint)\n"
        "  get <endpoint>                    Imprime el JSON guardado para ese endpoint\n"
        "  list                              Lista todas las suscripciones (field<TAB>endpoint)\n"
        "  del <endpoint>                    Elimina la suscripción de ese endpoint\n"
        "  selftest                          Prueba de punta a punta contra el Redis real",
        file=sys.stderr,
    )


def main(argv: list[str]) -> int:
    if not argv:
        _print_usage()
        return 2

    command = argv[0]

    if command == "put" and len(argv) == 2:
        path = Path(argv[1])
        try:
            subscription = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            print(f"Aviso: no se pudo leer/parsear {path}: {exc}", file=sys.stderr)
            return 1
        try:
            field = put(subscription)
        except ValueError as exc:
            print(f"Aviso: {exc}", file=sys.stderr)
            return 1
        print(field)
        return 0

    if command == "get" and len(argv) == 2:
        result = get(argv[1])
        if result is None:
            print("Aviso: no hay ninguna suscripción guardada para ese endpoint.", file=sys.stderr)
            return 1
        print(result)
        return 0

    if command == "list" and len(argv) == 1:
        for field, raw_value in list_all().items():
            try:
                endpoint = json.loads(raw_value).get("endpoint", "")
            except (json.JSONDecodeError, AttributeError):
                endpoint = "(valor inválido)"
            print(f"{field}\t{endpoint}")
        return 0

    if command == "del" and len(argv) == 2:
        print(delete(argv[1]))
        return 0

    if command == "selftest" and len(argv) == 1:
        return selftest()

    _print_usage()
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
