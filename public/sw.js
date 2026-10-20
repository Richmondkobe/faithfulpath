// Faithful Path Community's service worker. It does one thing: when a page
// cannot be reached because there is no internet, it shows /offline.html.
//
// It caches nothing else. Every page, member or not, comes from the server as
// it always has; this only steps in when that request fails outright. So a
// new deploy is seen at once, and nothing a member opens is ever stored here.
//
// Left entirely alone (the browser handles them exactly as without this file):
// - anything that is not a page load: images, scripts, data, forms, audio;
// - anything on another site: Supabase (signed URLs), Stripe, Cal.com;
// - the members area, admin, sign-in, the API, course lessons, book samples,
//   downloads, certificates, recordings and thank-you pages.

const CACHE = "fp-offline-v1";
const OFFLINE_URL = "/offline.html";

const LEFT_ALONE = [
  /^\/members(\/|$)/,
  /^\/admin(\/|$)/,
  /^\/api(\/|$)/,
  /^\/auth(\/|$)/,
  /^\/login(\/|$)/,
  /^\/courses\/./,
  /^\/guides\/[^/]+\/sample(\/|$)/,
  /download/,
  /certificate/,
  /\/audio(\/|$)/,
  /thank-you/,
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.add(new Request(OFFLINE_URL, { cache: "reload" })))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((n) => n !== CACHE).map((n) => caches.delete(n)));
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.mode !== "navigate" || request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (LEFT_ALONE.some((pattern) => pattern.test(url.pathname))) return;

  event.respondWith(
    (async () => {
      try {
        const preloaded = await event.preloadResponse;
        if (preloaded) return preloaded;
        return await fetch(request);
      } catch {
        const offline = await caches.match(OFFLINE_URL);
        return offline || Response.error();
      }
    })()
  );
});
