#!/usr/bin/env bash
# Harness de verificación manual de la Fase 1 — manda un push real de prueba
# a la suscripción capturada con make-test-subscription.js. Reusa exactamente
# el hand-off Redis -> envío que la Fase 3 va a usar en producción, para que
# un error de esquema aparezca ahora y no en el primer envío diario real.
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env.local ]; then
  echo "Error: no existe .env.local en la raíz del repo." >&2
  exit 1
fi
set -a
# shellcheck disable=SC1091
source .env.local
set +a

if [ -z "${VAPID_PUBLIC_KEY:-}" ] || [ -z "${VAPID_PRIVATE_KEY:-}" ] || [ -z "${VAPID_SUBJECT:-}" ]; then
  echo "Error: faltan VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT en .env.local." >&2
  exit 1
fi

SUBSCRIPTION_FILE="push-test-subscription.json"

if [ "${1:-}" = "--cleanup" ]; then
  if [ ! -f "$SUBSCRIPTION_FILE" ]; then
    echo "No hay $SUBSCRIPTION_FILE — nada que limpiar." >&2
    exit 0
  fi
  ENDPOINT=$(python3 -c "import json; print(json.load(open('$SUBSCRIPTION_FILE'))['endpoint'])")
  python3 scripts/push_redis.py del "$ENDPOINT"
  rm -f "$SUBSCRIPTION_FILE"
  echo "Limpieza completa: suscripción de prueba borrada de Redis y del disco."
  exit 0
fi

if [ ! -f "$SUBSCRIPTION_FILE" ]; then
  echo "Error: no existe $SUBSCRIPTION_FILE." >&2
  echo "Corré primero scripts/make-test-subscription.js en la consola del navegador." >&2
  exit 1
fi

ENDPOINT=$(python3 -c "import json; print(json.load(open('$SUBSCRIPTION_FILE'))['endpoint'])")

python3 scripts/push_redis.py put "$SUBSCRIPTION_FILE" > /dev/null

READBACK=$(python3 scripts/push_redis.py get "$ENDPOINT")

P256DH=$(python3 -c "import json,sys; print(json.loads(sys.argv[1])['keys']['p256dh'])" "$READBACK")
AUTH=$(python3 -c "import json,sys; print(json.loads(sys.argv[1])['keys']['auth'])" "$READBACK")

BODY="${1:-Prueba de Fase 1: los semis lideran el sector IA en el cierre de hoy.}"

PAYLOAD=$(python3 -c "
import json, sys
print(json.dumps({'title': 'AI QuickCap — Resumen diario', 'body': sys.argv[1], 'url': './'}))
" "$BODY")

npx --yes web-push send-notification \
  --endpoint="$ENDPOINT" \
  --key="$P256DH" \
  --auth="$AUTH" \
  --payload="$PAYLOAD" \
  --vapid-subject="$VAPID_SUBJECT" \
  --vapid-pubkey="$VAPID_PUBLIC_KEY" \
  --vapid-pvtkey="$VAPID_PRIVATE_KEY"

echo "Push enviado correctamente."
