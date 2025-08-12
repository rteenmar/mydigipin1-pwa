// Minimal Service Worker for Development
self.addEventListener('install', () => {
  // Skip waiting to activate the new service worker immediately
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  // For development, just fetch from network
  event.respondWith(fetch(event.request));
});
