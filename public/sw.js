// Minimal service worker. Its main job is to make the app installable
// (Chrome requires a registered SW with a fetch handler) and to keep the
// shell working when offline. It intentionally does NOT cache Convex/API
// traffic so live time-tracking data always comes from the network.

const CACHE = "time-tracker-shell-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle same-origin GET navigations/assets. Let everything else
  // (Convex websocket/API, POSTs, cross-origin) go straight to the network.
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) {
    return;
  }

  // Network-first with a cache fallback so the app opens even offline.
  event.respondWith(
    (async () => {
      try {
        const response = await fetch(request);
        const cache = await caches.open(CACHE);
        cache.put(request, response.clone());
        return response;
      } catch {
        const cached = await caches.match(request);
        if (cached) return cached;
        throw new Error("Network error and no cached response");
      }
    })(),
  );
});
