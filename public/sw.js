const CACHE_NAME = 'tbh-static-v1';
const ASSETS = [
  '/',
  '/favicon.ico',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).catch(() => caches.match('/'))),
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'tbh-sync') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        for (const client of clients) {
          client.postMessage({ type: 'flush-pending' });
        }
      }),
    );
  }
});

self.addEventListener('message', (event) => {
  // allow messages from clients to trigger actions
  // e.g., { type: 'skipWaiting' }
  if (!event.data) return;
  if (event.data.type === 'skipWaiting') self.skipWaiting();
});
