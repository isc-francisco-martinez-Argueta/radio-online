const CACHE_VERSION = "v1";
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const HTML_CACHE = `html-${CACHE_VERSION}`;

const PRECACHE_ASSETS = [
  "/",
  "/index.html",
  "/css/styles.css",
  "/css/estilos.css",
  "/js/app.js",
  "/js/modules.js",
  "/js/DOM/boton-scroll.js",
  "/js/DOM/reloj.js",
  "/img/icon-vos.png",
  "/img/logo.gif",
  "/img/mytuner_logo.png",
  "/img/logo-listener.png",
  "/img/headervideo1.png",
  "/manifest.webmanifest"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => ![STATIC_CACHE, HTML_CACHE].includes(key))
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

function isSameOrigin(url) {
  try {
    const u = new URL(url, self.location.origin);
    return u.origin === self.location.origin;
  } catch {
    return false;
  }
}

function isRadioStream(url) {
  return /shoutcast-stream/.test(url);
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = request.url;

  if (isRadioStream(url)) {
    event.respondWith(fetch(request));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request);
          const cache = await caches.open(HTML_CACHE);
          cache.put(request, networkResponse.clone());
          return networkResponse;
        } catch {
          const cachedIndex = await caches.match("/index.html");
          return cachedIndex || new Response("Sin conexión", { status: 503 });
        }
      })()
    );
    return;
  }

  if (isSameOrigin(url)) {
    if (/\.(?:css|js|png|jpg|jpeg|gif|webp|svg)$/i.test(url)) {
      event.respondWith(
        caches.match(request).then((cached) => {
          const network = fetch(request)
            .then((response) => {
              const copy = response.clone();
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
              return response;
            })
            .catch(() => cached);
          return cached || network;
        })
      );
      return;
    }
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
