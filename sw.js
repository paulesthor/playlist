const CACHE_NAME = 'spotiflow-v1';
const STATIC_ASSETS = [
    '/playlist/',
    '/playlist/index.html',
];

// Install: cache shell
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
    );
    self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
            )
        )
    );
    self.clients.claim();
});

// Fetch: network-first for API, cache-first for static
self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url);

    // Never cache Spotify API or auth requests
    if (
        url.hostname === 'api.spotify.com' ||
        url.hostname === 'accounts.spotify.com' ||
        url.hostname === 'i.scdn.co'
    ) {
        return;
    }

    e.respondWith(
        caches.match(e.request).then((cached) => {
            const fetched = fetch(e.request).then((response) => {
                // Update cache with fresh response
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
                }
                return response;
            });
            return cached || fetched;
        })
    );
});
