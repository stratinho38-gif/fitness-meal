/* Service worker — Λίστα Σούπερ Μάρκετ (v8.8.0)
   Navigations: network-first με cache fallback (offline = τελευταία εκδοχή).
   Same-origin assets: cache-first. Cross-origin (Firebase, Google Fonts): ανέπαφα. */
'use strict';

const CACHE = 'lista-v8.12.0';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // Navigations: πρώτα δίκτυο (φρέσκια εκδοχή), αλλιώς cache (offline)
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./index.html', copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Same-origin assets: cache-first
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(req).then((hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
      )
    );
  }
  // Cross-origin: δεν κάνουμε τίποτα — περνάει κατευθείαν (Firebase realtime κ.λπ.)
});
