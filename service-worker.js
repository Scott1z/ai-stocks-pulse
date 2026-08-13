const CACHE_NAME = "ai-stocks-pulse-v48";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.json",
  "./icons/icon.svg",
  "./icons/icon-maskable.svg",
  "./fonts/Montserrat-Regular.woff2",
  "./fonts/Montserrat-Medium.woff2",
  "./fonts/Montserrat-SemiBold.woff2",
  "./fonts/Montserrat-Bold.woff2",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// data.json cambia cada corrida del pipeline: siempre intentar la red primero
// y solo caer al cache si no hay conexión, para no servir noticias/precios viejos.
function isDataRequest(request) {
  return new URL(request.url).pathname.endsWith("/data.json");
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  if (isDataRequest(event.request)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // App shell: cache-first, red como respaldo.
  event.respondWith(
    caches.match(event.request).then(
      (cached) =>
        cached ||
        fetch(event.request)
          .then((response) => {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
            return response;
          })
          .catch(() => cached)
    )
  );
});

// El payload de un push es opcional y no confiable: si falta o viene mal formado
// igual hay que mostrar una notificación (nunca lanzar), y se reusa el icono de
// marca de la PWA (ya precacheado en CORE_ASSETS) tanto para icon como para badge.
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || "AI QuickCap", {
      body: data.body || "",
      icon: "./icons/icon.svg",
      badge: "./icons/icon.svg",
      data: { url: data.url || "./" },
    })
  );
});

// Si ya hay una pestaña de la app abierta, se enfoca en vez de abrir una nueva
// (la app es de una sola página, así que enfocar alcanza). includeUncontrolled
// es necesario porque tras un bump de CACHE_NAME una pestaña abierta puede seguir
// controlada por el service worker anterior y matchAll no la vería sin esta opción.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = new URL(
    (event.notification.data && event.notification.data.url) || "./",
    self.registration.scope
  ).href;
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        const existing = clientList.find((client) => client.url.startsWith(self.registration.scope));
        if (existing && "focus" in existing) return existing.focus();
        return self.clients.openWindow(targetUrl);
      })
  );
});
