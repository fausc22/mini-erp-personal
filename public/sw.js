// Service Worker para Mini ERP Personal PWA
const CACHE_NAME = 'mini-erp-v1';
const urlsToCache = [
  '/',
  '/dashboard',
  '/transacciones',
  '/cuentas',
  '/articulos',
  '/categorias',
  '/login',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Eliminando cache antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interceptar peticiones de red
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - devolver respuesta
        if (response) {
          return response;
        }

        return fetch(event.request).then((response) => {
          // Verificar que tenemos una respuesta válida
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Importante: clonar la respuesta porque es un stream
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        // Si falla todo, mostrar página offline si existe
        if (event.request.destination === 'document') {
          return caches.match('/offline.html');
        }
      })
  );
});

// Manejo de mensajes del cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Notificaciones push (para futuras implementaciones)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Nueva notificación',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('Mi ERP Personal', options)
  );
});

// Click en notificación
self.addEventListener('notificationclick', (event) => {
  console.log('Notificación clickeada: ', event.notification.tag);
  event.notification.close();

  event.waitUntil(
    clients.openWindow('/')
  );
});