/**
 * Service Worker — Weather Ultimate v2.0
 * Cache-first for static assets, network-first for API calls
 */

const CACHE_VERSION = 'weather-ultimate-v3';
const STATIC_ASSETS = [
    './',
    './index.html',
    './css/main.css',
    './js/core/config.js',
    './js/core/state.js',
    './js/core/cache.js',
    './js/core/weather-service.js',
    './js/core/ai-predictions.js',
    './js/core/ui-helpers.js',
    './js/core/ui-components.js',
    './js/core/forecast.js',
    './js/core/app.js',
    './js/core/init.js',
    './js/core/debug.js',
    './js/effects/weather-2d.js',
    './js/effects/weather-3d.js',
    './js/effects/sounds.js',
    './js/modules/moon.js',
    './manifest.json',
    './assets/favicon/favicon.svg',
    './assets/favicon/android-chrome-192x192.png',
    './assets/favicon/android-chrome-512x512.png'
];

// Install — pre-cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing v2...');
    event.waitUntil(
        caches.open(CACHE_VERSION)
            .then(cache => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
            .catch(err => console.error('[SW] Install failed:', err))
    );
});

// Activate — clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating v2...');
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys
                    .filter(key => key !== CACHE_VERSION)
                    .map(key => caches.delete(key))
            )
        ).then(() => self.clients.claim())
    );
});

// Fetch strategy
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // API calls → network-first with cache fallback
    if (url.hostname === 'api.openweathermap.org') {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const clone = response.clone();
                    caches.open(CACHE_VERSION).then(cache => {
                        cache.put(event.request, clone);
                    });
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // CDN (Three.js) → cache-first
    if (url.hostname === 'unpkg.com') {
        event.respondWith(
            caches.match(event.request).then(cached => {
                if (cached) return cached;
                return fetch(event.request).then(response => {
                    const clone = response.clone();
                    caches.open(CACHE_VERSION).then(cache => {
                        cache.put(event.request, clone);
                    });
                    return response;
                });
            })
        );
        return;
    }

    // Static assets → cache-first with network fallback
    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) return cached;
            return fetch(event.request).then(response => {
                if (response.ok && event.request.method === 'GET') {
                    const clone = response.clone();
                    caches.open(CACHE_VERSION).then(cache => {
                        cache.put(event.request, clone);
                    });
                }
                return response;
            });
        })
    );
});
