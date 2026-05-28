const CACHE_VERSION = '9.6.1';
const CACHE_NAME = 'click-opticx-v' + CACHE_VERSION;
const OFFLINE_URL = '/offline.html';

// ONLY cache static shell assets — never auth or API
const STATIC_ASSETS = [
  '/offline.html',
  '/manifest.json',
  '/favicon.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Routes that must NEVER be cached
const EXCLUDED_PATTERNS = [
  '/api/',
  '/auth/',
  '/login',
  '/socket.io/',
  'supabase',
  'firestore',
  'googleapis'
];

function isExcluded(url) {
  return EXCLUDED_PATTERNS.some(p => url.includes(p));
}

// ─── INSTALL: Pre-cache static shell only ────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log(`[SW v${CACHE_VERSION}] Pre-caching static shell`);
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// ─── ACTIVATE: Purge ALL old caches ──────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log(`[SW v${CACHE_VERSION}] Purging stale cache: ${name}`);
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// ─── FETCH: Network-first, NEVER cache auth/api ──────────────────────────────
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = event.request.url;

  // HARD EXCLUDE: Auth, API, WebSocket — always go to network, never cache
  if (isExcluded(url)) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Network-first for everything else
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Only cache successful responses for static assets
        if (response.status === 200 && url.includes('/assets/')) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          return cached || caches.match(OFFLINE_URL);
        });
      })
  );
});

// ─── MESSAGE: Handle logout cache purge from main thread ─────────────────────
self.addEventListener('message', (event) => {
  if (event.data === 'LOGOUT_PURGE') {
    console.log(`[SW v${CACHE_VERSION}] Received LOGOUT_PURGE — clearing all caches`);
    caches.keys().then((names) => {
      names.forEach((name) => caches.delete(name));
    });
  }

  if (event.data === 'FORCE_UPDATE') {
    self.skipWaiting();
  }
});
