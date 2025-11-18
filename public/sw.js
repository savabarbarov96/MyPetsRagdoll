// Advanced Service Worker with Enhanced Caching Strategies
const CACHE_VERSION = '2.0.0';
const STATIC_CACHE = `mypetsragdoll-static-v${CACHE_VERSION}`;
const DYNAMIC_CACHE = `mypetsragdoll-dynamic-v${CACHE_VERSION}`;
const IMAGE_CACHE = `mypetsragdoll-images-v${CACHE_VERSION}`;
const API_CACHE = `mypetsragdoll-api-v${CACHE_VERSION}`;

// Cache durations
const STATIC_CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days
const DYNAMIC_CACHE_DURATION = 24 * 60 * 60 * 1000; // 1 day
const IMAGE_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
const API_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Critical static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/ragdoll-logo.png',
  '/radanov-pride-logo.png',
  '/hero-image.jpg',
  '/favicon.ico',
  '/site.webmanifest'
];

// Regular expressions for different asset types
const STATIC_ASSET_PATTERNS = [
  /\.(js|css|woff|woff2|ttf|eot)$/i,
  /\/assets\//
];

const IMAGE_PATTERNS = [
  /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i
];

const API_PATTERNS = [
  /\/api\//,
  /convex/
];

// Max cache sizes to prevent storage bloat
const MAX_CACHE_SIZES = {
  [STATIC_CACHE]: 50,
  [DYNAMIC_CACHE]: 100,
  [IMAGE_CACHE]: 200,
  [API_CACHE]: 50
};

// Helper function to determine cache name for a URL
function getCacheNameForUrl(url) {
  if (STATIC_ASSET_PATTERNS.some(pattern => pattern.test(url))) {
    return STATIC_CACHE;
  }
  if (IMAGE_PATTERNS.some(pattern => pattern.test(url))) {
    return IMAGE_CACHE;
  }
  if (API_PATTERNS.some(pattern => pattern.test(url))) {
    return API_CACHE;
  }
  return DYNAMIC_CACHE;
}

// Helper function to get cache duration for a URL
function getCacheDurationForUrl(url) {
  if (STATIC_ASSET_PATTERNS.some(pattern => pattern.test(url))) {
    return STATIC_CACHE_DURATION;
  }
  if (IMAGE_PATTERNS.some(pattern => pattern.test(url))) {
    return IMAGE_CACHE_DURATION;
  }
  if (API_PATTERNS.some(pattern => pattern.test(url))) {
    return API_CACHE_DURATION;
  }
  return DYNAMIC_CACHE_DURATION;
}

// Helper function to limit cache size
async function limitCacheSize(cacheName, maxSize) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxSize) {
    // Remove oldest entries (FIFO)
    const keysToDelete = keys.slice(0, keys.length - maxSize);
    await Promise.all(keysToDelete.map(key => cache.delete(key)));
  }
}

// Install event - cache critical static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      // Cache critical static assets
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('Service Worker: Caching critical static assets');
        return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { 
          cache: 'reload',
          mode: 'cors'
        })));
      }),
      // Pre-cache shell routes
      caches.open(DYNAMIC_CACHE).then((cache) => {
        console.log('Service Worker: Pre-caching shell routes');
        return cache.addAll([
          '/about',
          '/news',
          '/admin'
        ].map(url => new Request(url, { cache: 'reload' })));
      })
    ]).catch((error) => {
      console.error('Service Worker: Failed to cache assets during install', error);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches and limit cache sizes
self.addEventListener('activate', (event) => {
  const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE, API_CACHE];
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!currentCaches.includes(cacheName)) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Limit cache sizes
      ...Object.entries(MAX_CACHE_SIZES).map(([cacheName, maxSize]) =>
        limitCacheSize(cacheName, maxSize)
      )
    ])
  );
  self.clients.claim();
});

// Advanced fetch event with multiple caching strategies
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests (except for CDN assets)
  const requestUrl = new URL(event.request.url);
  const isOriginRequest = requestUrl.origin === self.location.origin;
  const isCDNRequest = requestUrl.hostname.includes('cdn') || requestUrl.hostname.includes('cloudflare');
  
  if (!isOriginRequest && !isCDNRequest) {
    return;
  }

  // Different strategies for different types of requests
  if (API_PATTERNS.some(pattern => pattern.test(event.request.url))) {
    event.respondWith(networkFirstStrategy(event.request));
  } else if (IMAGE_PATTERNS.some(pattern => pattern.test(event.request.url))) {
    event.respondWith(cacheFirstStrategy(event.request));
  } else if (STATIC_ASSET_PATTERNS.some(pattern => pattern.test(event.request.url))) {
    event.respondWith(cacheFirstStrategy(event.request));
  } else {
    event.respondWith(staleWhileRevalidateStrategy(event.request));
  }
});

// Cache-first strategy (good for static assets and images)
async function cacheFirstStrategy(request) {
  const cacheName = getCacheNameForUrl(request.url);
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse && !isExpired(cachedResponse, request.url)) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
      await limitCacheSize(cacheName, MAX_CACHE_SIZES[cacheName]);
    }
    return networkResponse;
  } catch (error) {
    if (cachedResponse) {
      return cachedResponse;
    }
    return createFallbackResponse(request);
  }
}

// Network-first strategy (good for API calls)
async function networkFirstStrategy(request) {
  const cacheName = getCacheNameForUrl(request.url);
  const cache = await caches.open(cacheName);
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
      await limitCacheSize(cacheName, MAX_CACHE_SIZES[cacheName]);
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    if (cachedResponse && !isExpired(cachedResponse, request.url)) {
      return cachedResponse;
    }
    throw error;
  }
}

// Stale-while-revalidate strategy (good for HTML pages)
async function staleWhileRevalidateStrategy(request) {
  const cacheName = getCacheNameForUrl(request.url);
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Always try to fetch in the background
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
      limitCacheSize(cacheName, MAX_CACHE_SIZES[cacheName]);
    }
    return networkResponse;
  }).catch(() => null);
  
  // Return cached response immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // If no cache, wait for network
  try {
    return await fetchPromise;
  } catch (error) {
    return createFallbackResponse(request);
  }
}

// Check if cached response is expired
function isExpired(response, url) {
  const dateHeader = response.headers.get('date');
  if (!dateHeader) return false;
  
  const cachedDate = new Date(dateHeader);
  const now = new Date();
  const cacheAge = now.getTime() - cachedDate.getTime();
  const maxAge = getCacheDurationForUrl(url);
  
  return cacheAge > maxAge;
}

// Create fallback responses for offline scenarios
function createFallbackResponse(request) {
  if (request.destination === 'document') {
    return caches.match('/').then(response => 
      response || new Response('Offline', { status: 503, statusText: 'Service Unavailable' })
    );
  }
  
  if (IMAGE_PATTERNS.some(pattern => pattern.test(request.url))) {
    return new Response(
      '<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f3f4f6"/><text x="50%" y="50%" text-anchor="middle" fill="#9ca3af" font-family="Arial, sans-serif" font-size="16">Image unavailable offline</text></svg>',
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  }
  
  return new Response('Resource not available offline', { 
    status: 503, 
    statusText: 'Service Unavailable' 
  });
}

// Cache preloading for critical resources
async function preloadCriticalResources() {
  const criticalImages = [
    '/hero-image.jpg',
    '/ragdoll-logo.png',
    '/radanov-pride-logo.png'
  ];
  
  const cache = await caches.open(IMAGE_CACHE);
  
  for (const imageUrl of criticalImages) {
    try {
      const response = await fetch(imageUrl);
      if (response.ok) {
        await cache.put(imageUrl, response);
      }
    } catch (error) {
      console.warn('Failed to preload critical resource:', imageUrl, error);
    }
  }
}

// Enhanced background sync for offline actions
if ('sync' in self.registration) {
  self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
      event.waitUntil(handleBackgroundSync());
    } else if (event.tag === 'preload-critical') {
      event.waitUntil(preloadCriticalResources());
    }
  });
}

async function handleBackgroundSync() {
  try {
    // Handle any pending offline actions
    console.log('Service Worker: Background sync triggered');
    
    // Example: Sync contact form submissions, analytics, etc.
    const offlineActions = await getOfflineActions();
    for (const action of offlineActions) {
      await processOfflineAction(action);
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Placeholder functions for offline action handling
async function getOfflineActions() {
  // In a real implementation, this would retrieve actions from IndexedDB
  return [];
}

async function processOfflineAction(action) {
  // In a real implementation, this would process the action
  console.log('Processing offline action:', action);
}

// Enhanced push notifications with action buttons
if ('push' in self.registration) {
  self.addEventListener('push', (event) => {
    if (event.data) {
      const data = event.data.json();
      const options = {
        body: data.body,
        icon: '/ragdoll-logo.png',
        badge: '/favicon.ico',
        tag: data.tag || 'default',
        requireInteraction: data.requireInteraction || false,
        actions: data.actions || [],
        data: data.data || {}
      };
      
      event.waitUntil(
        self.registration.showNotification(data.title, options)
      );
    }
  });

  // Handle notification clicks
  self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    const action = event.action;
    const notificationData = event.notification.data;
    
    if (action === 'view') {
      event.waitUntil(
        clients.openWindow(notificationData.url || '/')
      );
    } else if (action === 'dismiss') {
      // Just close the notification
    } else {
      // Default action
      event.waitUntil(
        clients.openWindow('/')
      );
    }
  });
}
