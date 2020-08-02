const cacheName = 'knowyourzone-v1';
const offlineFallbackPage = 'offline.html';

self.addEventListener('install', e => {
    self.skipWaiting();
    e.waitUntil(
        caches.open(cacheName).then(cache => cache.add(offlineFallbackPage))
    );
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(keys.map(key => {
                if (key !== cacheName) return caches.delete(key);
            }));
        })
    );
});

self.addEventListener('fetch', e => {
    if (e.request.mode !== 'navigate') return;
    e.respondWith(
        fetch(e.request).catch(() => {
            return caches.open(cacheName).then(cache => {
                return cache.match(offlineFallbackPage);
            });
        })
    );
});