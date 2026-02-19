// === ВЕРСИЯ ПРИЛОЖЕНИЯ (менять только здесь!) ===
const APP_VERSION = '1.2.0';
const CACHE_NAME = `saddharma-app-v${APP_VERSION}`;

const ASSETS = [
  '/sad-karmy/',
  '/sad-karmy/index.html',
  '/sad-karmy/manifest.json',
  '/sad-karmy/icon.svg',
  '/sad-karmy/version.json'
];

self.addEventListener('install', (event) => {
  console.log(`SW v${APP_VERSION}: установка...`);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  console.log(`SW v${APP_VERSION}: активация...`);
  event.waitUntil(
    caches.keys().then((keys) => 
      Promise.all(keys.map(key => {
        if (key !== CACHE_NAME) {
          console.log('SW: удаляем старый кэш:', key);
          return caches.delete(key);
        }
      }))
    ).then(() => self.clients.claim())
    .then(() => {
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'VERSION', version: APP_VERSION });
        });
      });
    })
  );
});

self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith(self.location.origin)) return;
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request)
      .then((cached) => cached || fetch(event.request))
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
  if (event.data === 'GET_VERSION') {
    event.ports[0].postMessage({ version: APP_VERSION });
  }
});
