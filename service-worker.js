// === ВЕРСИЯ ПРИЛОЖЕНИЯ (менять только здесь!) ===
const APP_VERSION = '2.7.4';
const CACHE_NAME = `saddharma-app-v${APP_VERSION}`;

const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './js/db.js',
  './js/events.js',
  './js/goals.js',
  './js/meditation.js',
  './js/modals.js',
  './js/render.js',
  './js/seeds.js',
  './js/settings.js',
  './js/utils.js',
  './js/version.js',
  './manifest.json',
  './icon.svg',
  './icon-192x192.png',
  './icon-512x512.png',
  './version.json'
];

// Установка
self.addEventListener('install', (event) => {
  console.log(`SW v${APP_VERSION}: установка...`);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
  );
});

// Активация
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
          client.postMessage({
            type: 'VERSION',
            version: APP_VERSION
          });
        });
      });
    })
  );
});

// Перехват запросов
self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith(self.location.origin)) return;
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  const isHtml = url.pathname === '/' || url.pathname.endsWith('.html') || url.pathname.endsWith('.json');
  
  if (isHtml) {
    // HTML и version.json — network-first (всегда свежие, без HTTP-кэша)
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then((response) => {
          // Успешно получили с сети — кэшируем и отдаём
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    // CSS, JS, SVG — cache-first (быстрая загрузка)
    event.respondWith(
      caches.match(event.request)
        .then((cached) => cached || fetch(event.request))
    );
  }
});

// Обработка сообщений от клиента
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    console.log('SW: skipWaiting от пользователя');
    self.skipWaiting();
  }
  
  if (event.data === 'GET_VERSION') {
    event.ports[0].postMessage({
      version: APP_VERSION
    });
  }
});
