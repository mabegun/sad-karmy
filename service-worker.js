const CACHE_NAME = 'saddharma-app-v1.1.0';

const ASSETS = [
  '/sad-karmy/',
  '/sad-karmy/index.html',
  '/sad-karmy/manifest.json',
  '/sad-karmy/icon.svg'
];

self.addEventListener('install', (event) => {
  console.log('SW v1.1.0: установка...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  console.log('SW v1.1.0: активация...');
  event.waitUntil(
    caches.keys().then((keys) => 
      Promise.all(keys.map(key => {
        if (key !== CACHE_NAME) {
          console.log('SW: удаляем старый кэш:', key);
          return caches.delete(key);
        }
      }))
    ).then(() => self.clients.claim())
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
  if (event.data === 'skipWaiting') {
    console.log('SW: skipWaiting получен');
    self.skipWaiting();
  }
});
