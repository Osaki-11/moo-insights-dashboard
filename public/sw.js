const CACHE_NAME = 'moo-insights-v1';
const DATA_CACHE_NAME = 'moo-data-v1';

// Core app files to cache
const STATIC_CACHE_URLS = [
  '/',
  '/dashboard',
  '/auth',
  '/manifest.json',
  '/udderly-moolicious-logo.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('Service worker installed');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - handle network requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle Supabase API requests
  if (url.origin.includes('supabase.co')) {
    event.respondWith(
      caches.open(DATA_CACHE_NAME).then((cache) => {
        return fetch(request)
          .then((response) => {
            // Cache successful responses
            if (response.status === 200) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => {
            // Return cached data if network fails
            return cache.match(request);
          });
      })
    );
    return;
  }

  // Handle static assets
  event.respondWith(
    caches.match(request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(request);
      })
      .catch(() => {
        // Fallback for navigation requests when offline
        if (request.mode === 'navigate') {
          return caches.match('/');
        }
      })
  );
});

// Handle sync events for background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncPendingData());
  }
});

// Sync pending data when connection is restored
async function syncPendingData() {
  try {
    // This will be handled by the app's sync queue
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({ type: 'SYNC_DATA' });
    });
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}