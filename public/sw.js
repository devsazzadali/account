/* AccountStoreOne service worker (PWA, ধাপ ৫ঙ) — hand-rolled, minimal.
 *
 * MONEY-SAFETY POLICY — what this worker will and will not cache:
 *
 *   CACHE (cache-first, versioned cache below):
 *     - /_next/static/*        hashed framework JS/CSS — immutable by name
 *     - /covers/*              product cover images (public catalog art)
 *     - /manifest.webmanifest, /icon, /icon-*.png   PWA identity assets
 *     - /offline               the branded offline fallback page
 *
 *   NEVER CACHE (always straight to network, no exceptions):
 *     - /api/*                 every API response (orders, wallet, auth…)
 *     - /sw.js                 the worker itself
 *     - any HTML navigation    pages can carry account / order / wallet
 *                              data (dashboard, admin, checkout, invoice,
 *                              orders…). Navigations are network-first;
 *                              only when the network FAILS does the user
 *                              get /offline — never a cached page copy.
 *
 * Bump CACHE_VERSION on any policy/asset change: activate deletes every
 * other cache, so a new deploy can never be served stale app data.
 */
const CACHE_VERSION = "aso-static-v1";
const OFFLINE_URL = "/offline";

const PRECACHE_URLS = [
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/icon",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-512.png",
];

function isCacheableStatic(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/covers/") ||
    PRECACHE_URLS.includes(url.pathname)
  );
}

/* Read the root layout's hashed CSS/JS chunk URLs out of a page's HTML.
 * Route-level chunks are deliberately NOT discovered this way: precaching
 * e.g. the dashboard chunk would let an offline navigation boot the
 * account app from cache — account data must never be reachable offline.
 * The offline fallback page's chunk is the single exception (below). */
function frameworkAssetsFromHtml(html) {
  const found = new Set();
  const re = /(?:src|href)="(\/_next\/static\/[^"]+)"/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    if (m[1].includes("/chunks/app/layout-") || m[1].startsWith("/_next/static/css/")) {
      found.add(m[1]);
    }
  }
  return [...found];
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_VERSION);
      await cache.addAll(PRECACHE_URLS);
      // Warm the root-layout chunk + CSS set (shared framework assets,
      // no route data) so the precached /offline page can actually
      // render when the network is gone.
      try {
        const offlineRes = await cache.match(OFFLINE_URL);
        if (offlineRes) {
          const assets = frameworkAssetsFromHtml(await offlineRes.text());
          await Promise.all(
            assets.map((a) => cache.add(a).catch(() => {}))
          );
        }
      } catch {
        /* precache of the identity assets above still stands */
      }
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // API responses and the worker itself: network only, never intercepted
  // into a cache.
  if (url.pathname.startsWith("/api/") || url.pathname === "/sw.js") return;

  // Navigations: network-first. Offline → the branded fallback page,
  // never a cached copy of a page (pages can carry account data).
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        let response;
        try {
          response = await fetch(request);
        } catch {
          const cached = await caches.match(OFFLINE_URL, { ignoreSearch: true });
          return (
            cached ||
            new Response("You are offline.", {
              status: 503,
              headers: { "Content-Type": "text/plain" },
            })
          );
        }
        // After ANY successful navigation, warm the offline fallback's
        // route chunk (discovered from the freshly cached /offline HTML).
        // Next keys client navigation off the *target* route's chunk, so
        // a soft (Link/router) navigation to an unvisited route while
        // offline needs its chunk cached even though the document itself
        // is served from the fallback. This is the ONLY route chunk ever
        // precached this way — /offline carries no account data by design.
        event.waitUntil(
          (async () => {
            try {
              const cache = await caches.open(CACHE_VERSION);
              if (url.pathname === OFFLINE_URL && response.ok) {
                await cache.put(OFFLINE_URL, response.clone());
              }
              const offlineRes = await cache.match(OFFLINE_URL);
              if (!offlineRes) return;
              const html = await offlineRes.clone().text();
              const chunkRe = /\/(_next\/static\/chunks\/app\/offline\/[^"]+\.js)/g;
              const chunks = new Set();
              let cm;
              while ((cm = chunkRe.exec(html)) !== null) chunks.add("/" + cm[1]);
              await Promise.all(
                [...chunks].map((c) => cache.add(c).catch(() => {}))
              );
            } catch {
              /* warming is best-effort */
            }
          })()
        );
        return response;
      })()
    );
    return;
  }

  // Allow-listed static assets: cache-first, populate on first fetch.
  if (isCacheableStatic(url)) {
    event.respondWith(
      caches.match(request, { ignoreSearch: true }).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      })
    );
  }
  // Everything else: default browser fetch (network), untouched.
});
