;
//asignar un nombre y versión al cache
const CACHE_NAME = 'v1_cache_programador_fitness',
  urlsToCache = [
    './',
    './css/styles.css',
    './css/estilos.css',
    './script.js',
    './js/DOM/boton-scroll.js',
    './js/DOM/reloj.js',
    './js/modules.js',
    './img/anunciate.png',
    './img/anunciate2.png',
    './img/anunciate3.png',
    './img/baner-listo.png',
    './img/favicon.png',
    './img/footer.jpg',
    './img/headervideo1.mp4',
    './img/headervideo1.png',
    './img/icon-vos.png',
    './img/img-10.jpg',
    './img/img-11.jpg',
    './img/img-12.jpg',
    './img/img-14.jpg',
    './img/img-16.jpg',
    './img/img-17.jpg',
    './img/img-18.jpg',
    './img/img-19.jpg',
     './img/img-2.jpg',
    './img/img-20.jpg',
    './img/img-21.jpg',
    './img/img-3.jpg',
    './img/img-4.jpg',
    './img/img-5.jpg',
    './img/img-7.jpg',
    './img/img-8.jpg',
    './img/img-9.jpg',
    './img/logo-listener.png',
    './img/logo.gif',
    './img/LogoVosFM-black.png',
    './img/LogoVosFM-white.png',
    './img/mytuner_logo.png',
    './img/pause.gif',
    './img/peaple-1.jpg',
    './img/play.png',
    './img/tarjeta.jpg'
  ]

//durante la fase de instalación, generalmente se almacena en caché los activos estáticos
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache)
          .then(() => self.skipWaiting())
      })
      .catch(err => console.log('Falló registro de cache', err))
  )
})

//una vez que se instala el SW, se activa y busca los recursos para hacer que funcione sin conexión
self.addEventListener('activate', e => {
  const cacheWhitelist = [CACHE_NAME]

  e.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            //Eliminamos lo que ya no se necesita en cache
            if (cacheWhitelist.indexOf(cacheName) === -1) {
              return caches.delete(cacheName)
            }
          })
        )
      })
      // Le indica al SW activar el cache actual
      .then(() => self.clients.claim())
  )
})

//cuando el navegador recupera una url
self.addEventListener('fetch', e => {
  //Responder ya sea con el objeto en caché o continuar y buscar la url real
  e.respondWith(
    caches.match(e.request)
      .then(res => {
        if (res) {
          //recuperar del cache
          return res
        }
        //recuperar de la petición a la url
        return fetch(e.request)
      })
  )
})