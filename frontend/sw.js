/* ============ 鲜眸（FreshEye）根作用域 Service Worker ============ */
/* HTML 网络优先；静态资源 stale-while-revalidate。 */

const CACHE_NAME = "fresheye-v25";
const CORE_URLS = [
  "./",
  "./index.html",
  "./about.html",
  "./guide.html",
  "./fish.html",
  "./404.html",
  "./assets/style.css",
  "./assets/css/base.css",
  "./assets/css/components.css",
  "./assets/css/results.css",
  "./assets/css/responsive.css",
  "./assets/css/technical.css",
  "./assets/css/polish.css",
  "./assets/css/pdf-report.css",
  "./assets/css/page-404.css",
  "./assets/ui.js",
  "./assets/site.js",
  "./assets/app.js",
  "./assets/config.js",
  "./assets/locale-zh.js",
  "./assets/locale-en.js",
  "./assets/i18n.js",
  "./assets/pdf-report.js",
  "./assets/manifest.json",
  "./assets/icon-192.png",
  "./assets/icon-512.png"
];
const SAMPLE_URLS = [
  "./assets/samples/highly-fresh_thumb.webp",
  "./assets/samples/fresh_thumb.webp",
  "./assets/samples/not-fresh_thumb.webp",
  "./assets/samples/highly-fresh.webp",
  "./assets/samples/fresh.webp",
  "./assets/samples/not-fresh.webp"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_URLS))
      .then(() => Promise.allSettled(
        SAMPLE_URLS.map((url) => caches.open(CACHE_NAME).then((cache) => cache.add(url)))
      ))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith("fresheye-") && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = event.request.url;
  if (url.includes("hf.space") || url.includes("/predict") || url.includes("/health")) return;
  if (event.request.method !== "GET") return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          return cached || caches.match("./index.html");
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response.status === 200 && new URL(url).origin === self.location.origin) {
            const clone = response.clone();
            event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)));
          }
          return response;
        })
        .catch(() => new Response("", { status: 504, statusText: "Offline" }));
      if (cached) {
        event.waitUntil(network);
        return cached;
      }
      return network;
    })
  );
});
