const CACHE_VERSION = "v45";
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const HTML_CACHE = `html-${CACHE_VERSION}`;

const PRECACHE_ASSETS = [
  "/",
  "/index.html",
  "/css/styles.css",
  "/js/app.js",
  "/js/modules.js",
  "/js/DOM/actualizar-app.js",
  "/js/DOM/boton-scroll.js",
  "/js/DOM/reloj.js",
  "/js/DOM/chat-flotante.js",
  "/img/icon-512.png?v=2",
  "/img/icon-192.png?v=2",
  "/img/favicon-32.png?v=2",
  "/img/logo-vos.png",
  "/img/mytuner_logo.png",
  "/img/logo-listener.png",
  "/img/headervideo1.jpg",
  "/manifest.webmanifest"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      // "reload" evita guardar copias viejas de la caché HTTP del navegador.
      cache.addAll(PRECACHE_ASSETS.map((url) => new Request(url, { cache: "reload" })))
    )
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

// Manifest e iconos de la app: SIEMPRE red primero. Si se sirven desde la caché,
// el navegador nunca ve el ícono nuevo y la PWA instalada no se actualiza.
function isAppIdentity(url) {
  const { pathname } = new URL(url, self.location.origin);
  return pathname === "/manifest.webmanifest" ||
    /^\/img\/(icon-|apple-touch-icon|favicon)/.test(pathname);
}

function isMusic(url) {
  // Audio de respaldo y su lista: siempre desde la red, sin cachear.
  return /\/musica\//.test(url);
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = request.url;

  // No interceptar el stream de radio ni el audio de respaldo: dejar que
  // el navegador los maneje evita errores "Failed to fetch" y datos obsoletos.
  if (isRadioStream(url) || isMusic(url)) {
    return;
  }

  if (isSameOrigin(url) && isAppIdentity(url)) {
    event.respondWith(
      fetch(request, { cache: "no-cache" })
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
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
