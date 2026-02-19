const CACHE_NAME = 'saddharma-app-v1'; // Меняйте v1 на v2, v3 при обновлении кода
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
  // Если добавите иконки, раскомментируйте строки ниже:
  // '/icons/icon-192x192.png',
  // '/icons/icon-512x512.png'
];

// Установка: кэшируем файлы
self.addEventListener('install', (event) => {
  console.log('👷‍♂️ SW устанавливается...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Кэшируем файлы...');
        return cache.addAll(ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Активация: чистим старый кэш и захватываем управление
self.addEventListener('activate', (event) => {
  console.log('⚡ SW активируется...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Удаляем старый кэш:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('🌟 SW готов!');
      return self.clients.claim(); 
    })
  );
});

// Перехват запросов (работа офлайн)
self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith(self.location.origin)) return;
  
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(event.request)
          .then((response) => {
            if (!response || response.status !== 200 || response.type !== 'basic') return response;
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              if (event.request.method === 'GET') cache.put(event.request, responseToCache);
            });
            return response;
          });
      })
  );
});

// Слушаем команду "Пропустить ожидание" (для обновления по кнопке)
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    console.log('🚀 Пропускаем ожидание...');
    self.skipWaiting();
  }
});