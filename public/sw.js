const CACHE_NAME = 'elteam-v2';
const API_CACHE = 'elteam-api-v1';

// Pages & assets to pre-cache on install
const PRECACHE_URLS = [
  '/',
  '/dashboard',
  '/dashboard/power-consumption',
  '/dashboard/power-consumption/entry',
  '/dashboard/power-consumption/reports',
  '/dashboard/battery-inspection',
  '/dashboard/battery-inspection/new',
  '/dashboard/motors',
  '/dashboard/inspections',
  '/dashboard/mis',
  '/dashboard/equipment',
  '/dashboard/spare-parts',
  '/dashboard/upload',
  '/dashboard/analytics',
  '/dashboard/leaderboard',
  '/dashboard/profile',
  '/dashboard/chat',
  '/dashboard/search',
  '/dashboard/gallery',
  '/dashboard/history',
  '/dashboard/ai-assistant',
  '/manifest.json',
];

// API routes that are safe to cache (GET-only, read data)
const CACHEABLE_API_ROUTES = [
  '/api/power-readings/stats',
  '/api/motors',
  '/api/activities',
  '/api/leaderboard',
  '/api/dashboard/battery-stats',
  '/api/inspections',
  '/api/battery-inspections',
  '/api/spare-parts',
  '/api/equipment',
  '/api/user/profile',
  '/api/reports/monthly',
];

// ─── Install ───
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Don't fail install if some pages aren't built yet
      return cache.addAll(PRECACHE_URLS).catch(() => {
        console.warn('[SW] Some precache URLs failed, continuing...');
      });
    })
  );
  self.skipWaiting();
});

// ─── Activate ───
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME && key !== API_CACHE) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// ─── Fetch Strategy ───
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // API routes: stale-while-revalidate for cacheable APIs
  if (url.pathname.startsWith('/api/')) {
    const isCacheable = CACHEABLE_API_ROUTES.some(route => url.pathname.startsWith(route));
    
    if (isCacheable) {
      e.respondWith(
        caches.open(API_CACHE).then(async (cache) => {
          const cachedResponse = await cache.match(e.request);
          
          const fetchPromise = fetch(e.request).then((networkResponse) => {
            if (networkResponse.ok) {
              cache.put(e.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            // Offline — return cached if available
            return cachedResponse;
          });

          // Return cached immediately while revalidating in background
          return cachedResponse || fetchPromise;
        })
      );
      return;
    }

    // Non-cacheable API routes — just pass through
    return;
  }

  // Page/asset routes: network-first, fallback to cache
  e.respondWith(
    fetch(e.request)
      .then((response) => {
        const resClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, resClone);
        });
        return response;
      })
      .catch(() => {
        return caches.match(e.request).then((response) => {
          if (response) return response;

          // For navigation requests, return the cached dashboard shell
          if (e.request.mode === 'navigate') {
            return caches.match('/dashboard');
          }
        });
      })
  );
});

// ─── Push Notifications ───
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: data.icon || '/icons/icon-192x192.png',
      badge: data.badge || '/favicon.ico',
      vibrate: [100, 50, 100],
      data: {
        url: data.data?.url || '/dashboard/leaderboard'
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  } catch (err) {
    console.error('Push event error:', err);
  }
});

// ─── Notification Click ───
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data.url;
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
