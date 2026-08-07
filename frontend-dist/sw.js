/* 鲜眸 FreshEye · Vue PWA 缓存层
 * HTML 网络优先，本站静态资源 stale-while-revalidate；API 请求永不缓存。
 */
const CACHE_NAME = 'fresheye-vue-v1'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(['./', './index.html', './manifest.json', './favicon.svg']))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key.startsWith('fresheye-') && key !== CACHE_NAME)
        .map((key) => caches.delete(key))
    )).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin) return
  if (url.pathname.includes('/predict') || url.pathname.endsWith('/health')) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then((response) => {
        const copy = response.clone()
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
        return response
      }).catch(() => caches.match(request).then((cached) => cached || caches.match('./index.html')))
    )
    return
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const fresh = fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
        }
        return response
      })
      if (cached) {
        event.waitUntil(fresh.catch(() => undefined))
        return cached
      }
      return fresh
    })
  )
})
