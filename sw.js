// Versión de la app: la cambia tools/nueva-version.mjs (también pone ?v= en index.html y en los import).
const ASSET_VERSION = "75";
const CACHE_VERSION = `v${ASSET_VERSION}`;
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const HTML_CACHE = `html-${CACHE_VERSION}`;

const PRECACHE_ASSETS = [
  "/",
  "/index.html",
  "/css/styles.css",
  "/css/programas.css",
  "/css/videos.css",
  "/css/tema-azul-nocturno.css",
  "/js/app.js",
  "/js/pwa-installer.js",
  "/js/modules.js",
  "/js/DOM/actualizar-app.js",
  "/js/DOM/boton-scroll.js",
  "/js/DOM/chat-flotante.js",
  "/js/DOM/programas.js",
  "/js/DOM/en-vivo.js",
  "/js/DOM/avisos.js",
  "/js/DOM/publicidad.js",
  "/js/DOM/saludos.js",
  "/js/DOM/revelar.js",
  "/js/DOM/videos.js",
  "/js/DOM/menu.js",
  "/js/DOM/conexion.js",
  "/js/DOM/anunciantes.js",
  "/js/anunciantes-data.js",
  "/js/programas-data.js",
  "/img/icon-512.png?v=4",
  "/img/icon-192.png?v=4",
  "/img/favicon-32.png?v=4",
  "/img/icon-maskable-512.png?v=4",
  "/img/mytuner_logo.png",
  "/img/logo-listener.png",
  "/manifest.webmanifest"
];

// CSS y JS se piden con ?v=versión (igual que en index.html), así la copia offline coincide.
const conVersion = (url) => (/\.(css|js)$/.test(url) ? `${url}?v=${ASSET_VERSION}` : url);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      // "reload" evita guardar copias viejas de la caché HTTP del navegador.
      cache.addAll(PRECACHE_ASSETS.map((url) => new Request(conVersion(url), { cache: "reload" })))
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

// Servicios dinámicos (p. ej. últimos videos de YouTube): siempre de la red, nunca de caché.
function isApi(url) {
  return new URL(url, self.location.origin).pathname.startsWith("/api/");
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
  if (isRadioStream(url) || isMusic(url) || (isSameOrigin(url) && isApi(url))) {
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

  // CSS y JS: SIEMPRE red primero (así nunca se ve la página nueva con estilos viejos).
  // La caché solo se usa sin conexión.
  if (isSameOrigin(url) && /\.(?:css|js)$/i.test(new URL(url).pathname)) {
    event.respondWith(
      fetch(request, { cache: "no-cache" })
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => (await caches.match(request)) || caches.match(request, { ignoreSearch: true }))
    );
    return;
  }

  // Imágenes: de la caché al instante y se actualizan en segundo plano.
  if (isSameOrigin(url)) {
    if (/\.(?:png|jpg|jpeg|gif|webp|svg)$/i.test(new URL(url).pathname)) {
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
