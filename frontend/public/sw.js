const CACHE_NAME = 'portosinfiltro-v1';
const APP_SHELL = ['/', '/manifest.json', '/icon-192.png', '/icon-512.png'];

// cache.addAll() es atómico: si una sola URL falla (ej. una fuente externa
// lenta o caída), cancela TODO el batch, incluido lo crítico. Cacheamos cada
// URL por separado para que una falla aislada no tumbe el resto.
function cachearCadaUna(cache, urls) {
  return Promise.allSettled(urls.map(url => cache.add(url)));
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cachearCadaUna(cache, APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

// La primera visita carga el JS/CSS con hash (ej. /assets/index-abc123.js)
// antes de que el SW llegue a registrarse, así que nunca pasan por el
// fetch handler de abajo. main.jsx nos manda esas URLs ya conocidas por
// la página para cachearlas de una vez, sin esperar a una segunda visita.
self.addEventListener('message', event => {
  if (event.data?.type === 'CACHE_URLS' && Array.isArray(event.data.urls)) {
    event.waitUntil(
      caches.open(CACHE_NAME).then(cache => cachearCadaUna(cache, event.data.urls))
    );
  }
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/'))
    );
    return;
  }

  event.respondWith(
    // Se matchea por URL (no por el Request tal cual) e ignorando Vary:
    // el request real del navegador (ej. <script crossorigin>) puede traer
    // headers algo distintos a los que uso cache.add() para guardarlo, y
    // eso basta para que el matching estricto por Request falle.
    caches.match(request.url, { ignoreVary: true }).then(cached => {
      if (cached) return cached;
      return fetch(request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return response;
        })
        // Sin red y sin nada en caché para esto (ej. una imagen que nunca
        // se visitó): no hay nada razonable que devolver, pero al menos
        // no dejamos la promesa rechazada sin manejar.
        .catch(() => new Response('', { status: 504, statusText: 'Offline' }));
    })
  );
});
