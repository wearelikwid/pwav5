const CACHE_NAME = 'workout-app-v1.3';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/workout.html',
    '/styles/index.css',
    '/styles/workout.css',
    '/scripts/index.js',
    '/scripts/workout.js',
    '/scripts/pwa.js',
    '/manifest.json',
    '/icons/icon.svg',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'
];

// Helper function to check if URL is valid for caching
function isValidUrl(url) {
    try {
        const urlObj = new URL(url);
        return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
        return false;
    }
}

// Helper function to handle failed requests
function handleFetchError(error) {
    console.error('Fetch failed:', error);
    return new Response('App is offline. Please check your connection.', {
        status: 503,
        statusText: 'Service Unavailable'
    });
}

// Install event
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Caching static assets');
                // Cache each asset individually
                return Promise.all(
                    ASSETS_TO_CACHE.map(url => {
                        return fetch(url)
                            .then(response => {
                                if (!response.ok) {
                                    throw new Error(`Failed to fetch ${url}`);
                                }
                                return cache.put(url, response);
                            })
                            .catch(error => {
                                console.warn(`Failed to cache ${url}:`, error);
                            });
                    })
                );
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch event
self.addEventListener('fetch', event => {
    // Ignore non-GET requests and invalid URLs
    if (event.request.method !== 'GET' || !isValidUrl(event.request.url)) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(event.request.clone())
                    .then(response => {
                        // Check if we received a valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Don't cache chrome-extension URLs
                        if (!event.request.url.startsWith('chrome-extension://')) {
                            const responseToCache = response.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(event.request, responseToCache);
                                })
                                .catch(error => {
                                    console.warn('Cache put error:', error);
                                });
                        }

                        return response;
                    })
                    .catch(handleFetchError);
            })
    );
});

// Background sync
self.addEventListener('sync', event => {
    if (event.tag === 'sync-workouts') {
        event.waitUntil(
            // Implement your sync logic here
            Promise.resolve()
        );
    }
});

// Message handling
self.addEventListener('message', event => {
    if (event.data && event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});
