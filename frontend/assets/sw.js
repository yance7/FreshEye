/* ============ FreshEye Service Worker ============ */
/* 缓存策略：HTML 网络优先；静态资源 stale-while-revalidate（缓存立即返回 + 后台更新） */

const CACHE_NAME = 'fresheye-v10';
const CORE_URLS = [
  './',
  './index.html',
  './about.html',
  './guide.html',
  './fish.html',
  './404.html',
  './assets/style.css',
  './assets/ui.js',
  './assets/manifest.json'
];
const SAMPLE_URLS = [
  './assets/samples/highly-fresh_thumb.webp',
  './assets/samples/fresh_thumb.webp',
  './assets/samples/not-fresh_thumb.webp',
  './assets/samples/highly-fresh.webp',
  './assets/samples/fresh.webp',
  './assets/samples/not-fresh.webp'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_URLS))
      .then(() => Promise.allSettled(
        SAMPLE_URLS.map((u) => caches.open(CACHE_NAME).then((c) => c.add(u)))
      ))
      .then(() => self.skipWaiting())
      .catch((err) => console.warn('SW 预缓存失败（部分资源可能离线不可用）:', err))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k.startsWith('fresheye-') && k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  if (url.includes('hf.space') || url.includes('/predict') || url.includes('/health')) {
    return;
  }
  if (event.request.method !== 'GET') {
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          return cached || caches.match('./index.html');
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request).then((response) => {
        if (response.status === 200 && new URL(url).origin === self.location.origin) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        return new Response('', { status: 504, statusText: 'Offline' });
      });
      if (cached) {
        event.waitUntil(fetchPromise);
        return cached;
      }
      return fetchPromise;
    })
  );
});
