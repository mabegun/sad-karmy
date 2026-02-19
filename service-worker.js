const CACHE_NAME = 'saddharma-app-v4'; // Меняйте v4 на v5, v6 при обновлении кода

// ВАЖНО: Пути для GitHub Pages должны включать имя репозитория!
const ASSETS = [
  '/sad-karmy/',
  '/sad-karmy/index.html',
  '/sad-karmy/manifest.json',
  '/sad-karmy/icons/icon-72x72.png',
  '/sad-karmy/icons/icon-96x96.png',
  '/sad-karmy/icons/icon-128x128.png',
  '/sad-karmy/icons/icon-144x144.png',
  '/sad-karmy/icons/icon-152x152.png',
  '/sad-karmy/icons/icon-192x192.png',
  '/sad-karmy/icons/icon-384x384.png',
  '/sad-karmy/icons/icon-512x512.png'
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
  // Игнорируем запросы к другим доменам
  if (!event.request.url.startsWith(self.location.origin)) return;
  
  // Игнорируем non-GET запросы
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request)
          .then((response) => {
            // Не кэшируем ошибочные ответы
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            // Кэшируем успешный ответ
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
            return response;
          })
          .catch(() => {
            // Если нет сети и нет в кэше - можно вернуть fallback
            console.log('⚠️ Нет сети и нет в кэше:', event.request.url);
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
