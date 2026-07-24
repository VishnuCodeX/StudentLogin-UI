// Developed By: Vishnukarthick K

// Hand-written (not build-generated — see PWA notes) minimal service worker for the app
// shell. Deliberately narrow: only touches same-origin navigations (offline shell fallback)
// and hashed /assets/ files (safe to cache-first since a content change always gets a new
// filename). Every other request — most importantly every backend API call — is never
// intercepted (no event.respondWith call), so it passes through exactly as if there were no
// service worker at all.
const CACHE_NAME = "carmel-nexus-shell";
const BASE = "/CarmelNexus/";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add(BASE).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith(`${BASE}assets/`)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request).then((res) => {
          caches.open(CACHE_NAME).then((c) => c.put(request, res.clone()));
          return res;
        });
        return cached || network;
      })
    );
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          caches.open(CACHE_NAME).then((c) => c.put(request, res.clone()));
          return res;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match(BASE)))
    );
  }
});
