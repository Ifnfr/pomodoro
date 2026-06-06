self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('focus-popup-store').then((cache) => cache.addAll([
      '/',
      '/index.html',
      '/icon.svg',
      '/manifest.json'
    ])),
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
