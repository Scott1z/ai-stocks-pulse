// Herramienta manual de verificación de la Fase 1 (push notifications).
// El flujo real de suscripción vive en app.js recién en la Fase 2 (OPTIN-*);
// esto es solo para probar que el par de claves VAPID y el service worker
// funcionan juntos antes de construir la UI. La salida (el objeto de
// suscripción) es material secreto por dispositivo — nunca commitear.
//
// Uso: pegar este bloque completo en la consola de DevTools de la página
// (con el service worker ya activo) y presionar Enter.
(async () => {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    console.error("Permiso de notificaciones no concedido:", permission);
    return;
  }

  const reg = await navigator.serviceWorker.ready;

  // Lee la constante global por nombre desde la página misma — esto es lo
  // que prueba que la clave que ya viaja con la app es la que se usa acá.
  const base64 = VAPID_PUBLIC_KEY;
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = padded.replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const applicationServerKey = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) applicationServerKey[i] = raw.charCodeAt(i);

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey,
  });

  const json = JSON.stringify(sub);
  console.log(json);
  if (typeof copy === "function") copy(json);
})();
