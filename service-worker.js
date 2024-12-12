const CACHE_NAME = 'workout-app-v1.4';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/workout.html',
    '/auth.html',
    '/styles/index.css',
    '/styles/workout.css',
    '/styles/auth.css',
    '/scripts/index.js',
    '/scripts/workout.js',
    '/scripts/auth.js',
    '/scripts/firebase-config.js',
    '/scripts/pwa.js',
    '/manifest.json',
    '/icons/icon.svg',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    'https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js',
    'https://www.gstatic.com/firebasejs/8.10.0/firebase-auth.js',
    'https://www.gstatic.com/firebasejs/8.10.0/firebase-firestore.js'
];

// Network-first URLs (always try network first, fall back to cache)
const NETWORK_FIRST_URLS = [
    '/auth.html',
    'https://www.googleapis.com',
    'https://accounts.google.com'
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
    return new Response(
        `<html>
            <body>
                <div style="padding: 20px; text-align: center;">
                    <h2>App is offline</h2>
                    <p>Please check your internet connection.</p>
                    <button onclick="window.location.reload()">Retry</button>
                </div>
            </body>
        </html>`,
        {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/html' })
        }
    );
}

// Install event
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Caching static assets');
                return Promise.allSettled(
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
        Promise.all([
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
                }),
            self.clients.claim()
        ])
    );
});

// Fetch event
self.addEventListener('fetch', event => {
    // Handle non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Check if URL is valid
    if (!isValidUrl(event.request.url)) {
        return;
    }

    // Check if this is a navigation request
    const isNavigationRequest = event.request.mode === 'navigate';

    // Network-first strategy for specific URLs
    if (NETWORK_FIRST_URLS.some(url => event.request.url.includes(url))) {
        event.respondWith(
            fetch(event.request)
                .catch(() => caches.match(event.request))
                .catch(handleFetchError)
        );
        return;
    }

    // Cache-first strategy for other requests
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    // Return cached response and update cache in background
                    if (navigator.onLine) {
                        fetch(event.request)
                            .then(response => {
                                if (response.ok) {
                                    caches.open(CACHE_NAME)
                                        .then(cache => cache.put(event.request, response));
                                }
                            })
                            .catch(console.warn);
                    }
                    return cachedResponse;
                }

                return fetch(event.request.clone())
                    .then(response => {
                        if (!response || response.status !== 200) {
                            return response;
                        }

                        // Don't cache chrome-extension URLs
                        if (!event.request.url.startsWith('chrome-extension://')) {
                            const responseToCache = response.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(event.request, responseToCache);
                                })
                                .catch(console.warn);
                        }

                        return response;
                    })
                    .catch(error => {
                        if (isNavigationRequest) {
                            return caches.match('/offline.html');
                        }
                        return handleFetchError(error);
                    });
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

// Push notification handling
self.addEventListener('push', event => {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-192x192.png',
            vibrate: [100, 50, 100],
            data: {
                url: data.url || '/'
            }
        };

        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

// Notification click handling
self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});

// Message handling
self.addEventListener('message', event => {
    if (event.data && event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});
