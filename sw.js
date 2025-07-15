/**
 * Service Worker pro Weather Ultimate
 * Offline podpora a cache management
 */

const CACHE_NAME = 'weather-ultimate-v1';
const API_CACHE_NAME = 'weather-api-cache-v1';

// Soubory pro offline cache
const STATIC_FILES = [
    './',
    './index.html',
    './styles.css',
    './config.js',
    './js/ultimate.js',
    './js/weather-effects.js',
    './js/weather-3d-effects.js',
    './js/weather-sounds.js',
    './manifest.json',
    './favicon/favicon-32x32.png',
    './favicon/favicon-16x16.png',
    './favicon/favicon-48x48.png',
    './favicon/apple-touch-icon.png',
    './favicon/android-chrome-192x192.png',
    './favicon/android-chrome-512x512.png',
    'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
];

// Install event - cache static files
self.addEventListener('install', event => {
    console.log('🔧 Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 Service Worker: Caching static files');
                return cache.addAll(STATIC_FILES.map(url => {
                    return new Request(url, { mode: 'cors' });
                }));
            })
            .then(() => {
                console.log('✅ Service Worker: Static files cached');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('❌ Service Worker: Error caching static files:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('🚀 Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
                        console.log('🗑️ Service Worker: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('✅ Service Worker: Activated and ready');
            return self.clients.claim();
        })
    );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);
    
    // API requests (weather data)
    if (url.hostname === 'api.openweathermap.org') {
        event.respondWith(
            caches.open(API_CACHE_NAME)
                .then(cache => {
                    return fetch(request)
                        .then(response => {
                            // Store successful API responses
                            if (response.ok) {
                                cache.put(request, response.clone());
                            }
                            return response;
                        })
                        .catch(() => {
                            // If network fails, try to serve from cache
                            console.log('🔄 Service Worker: Serving API from cache');
                            return cache.match(request);
                        });
                })
        );
        return;
    }
    
    // Static files
    if (request.method === 'GET') {
        event.respondWith(
            caches.match(request)
                .then(response => {
                    if (response) {
                        console.log('📥 Service Worker: Serving from cache:', request.url);
                        return response;
                    }
                    
                    // If not in cache, fetch from network
                    return fetch(request)
                        .then(response => {
                            // Don't cache unsuccessful responses
                            if (!response || response.status !== 200 || response.type !== 'basic') {
                                return response;
                            }
                            
                            // Cache successful responses
                            const responseToCache = response.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(request, responseToCache);
                                });
                            
                            return response;
                        })
                        .catch(() => {
                            // If both cache and network fail, return offline page
                            if (request.destination === 'document') {
                                return caches.match('/index.html');
                            }
                        });
                })
        );
    }
});

// Background sync for failed API requests
self.addEventListener('sync', event => {
    if (event.tag === 'weather-sync') {
        console.log('🔄 Service Worker: Background sync triggered');
        event.waitUntil(
            // Retry failed weather requests
            retryFailedWeatherRequests()
        );
    }
});

// Push notifications (for future weather alerts)
self.addEventListener('push', event => {
    console.log('📱 Service Worker: Push received');
    
    const options = {
        body: event.data ? event.data.text() : 'Nová předpověď počasí je k dispozici!',
        icon: '/favicon/android-chrome-192x192.png',
        badge: '/favicon/favicon-96x96.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 'weather-update'
        },
        actions: [
            {
                action: 'explore',
                title: 'Zobrazit',
                icon: '/favicon/favicon-32x32.png'
            },
            {
                action: 'close',
                title: 'Zavřít'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('Weather Ultimate', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
    console.log('🔔 Service Worker: Notification clicked');
    
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Helper function to retry failed weather requests
async function retryFailedWeatherRequests() {
    try {
        const cache = await caches.open(API_CACHE_NAME);
        const keys = await cache.keys();
        
        for (const request of keys) {
            try {
                const response = await fetch(request);
                if (response.ok) {
                    await cache.put(request, response.clone());
                    console.log('✅ Service Worker: Retry successful for:', request.url);
                }
            } catch (error) {
                console.log('❌ Service Worker: Retry failed for:', request.url);
            }
        }
    } catch (error) {
        console.error('❌ Service Worker: Background sync error:', error);
    }
}

// Periodic weather data refresh
self.addEventListener('periodicsync', event => {
    if (event.tag === 'weather-refresh') {
        console.log('🔄 Service Worker: Periodic sync triggered');
        event.waitUntil(
            refreshWeatherData()
        );
    }
});

// Helper function to refresh weather data
async function refreshWeatherData() {
    try {
        // Get stored cities from IndexedDB and refresh their data
        const clients = await self.clients.matchAll();
        
        for (const client of clients) {
            client.postMessage({
                type: 'REFRESH_WEATHER_DATA'
            });
        }
        
        console.log('✅ Service Worker: Weather data refresh initiated');
    } catch (error) {
        console.error('❌ Service Worker: Weather refresh error:', error);
    }
}

// Error handling
self.addEventListener('error', event => {
    console.error('❌ Service Worker: Error:', event.error);
});

self.addEventListener('unhandledrejection', event => {
    console.error('❌ Service Worker: Unhandled promise rejection:', event.reason);
});

console.log('🔧 Service Worker: Script loaded');