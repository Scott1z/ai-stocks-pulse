const CACHE_NAME = "ai-stocks-pulse-v14";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.json",
  "./icons/icon.svg",
  "./icons/icon-maskable.svg",
  "./fonts/GeneralSans-Regular.woff2",
  "./fonts/GeneralSans-Medium.woff2",
  "./fonts/GeneralSans-Semibold.woff2",
  "./fonts/GeneralSans-Bold.woff2",
  "./fonts/AzeretMono-Regular.woff2",
  "./fonts/AzeretMono-SemiBold.woff2",
  "./fonts/AzeretMono-Bold.woff2",
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
