/* FreshEye production Service Worker template. Vite replaces the build and URL tokens. */
const BUILD_ID = '__BUILD_ID__'
const CACHE_PREFIX = 'fresheye-vue-'
const CACHE_NAME = `${CACHE_PREFIX}${BUILD_ID}`
const PRECACHE_URLS = __PRECACHE_URLS__
const SCOPE_URL = new URL(self.registration.scope)
const NAVIGATION_PATHS = new Set(PRECACHE_URLS
  .filter((path) => path === './' || /\.html$/i.test(path))
  .map((path) => new URL(path, SCOPE_URL).pathname))
const STATIC_PATHS = new Set(PRECACHE_URLS
  .filter((path) => path !== './' && !/\.html$/i.test(path))
  .map((path) => new URL(path, SCOPE_URL).pathname))

function isInferenceEndpoint(pathname) {
  return /(?:^|\/)(?:predict(?:_with_gradcam)?|health)(?:\/|$)/i.test(pathname)
}

function offlineResponse() {
  const homeUrl = new URL('./', SCOPE_URL).href
  const html = '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline · FreshEye</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;box-sizing:border-box;background:#04162b;color:#ecfeff;font:16px/1.7 system-ui,sans-serif}main{max-width:36rem;padding:32px;border:1px solid #255366;border-radius:18px;background:#08213a}a{display:inline-block;margin-top:16px;padding:10px 18px;border-radius:24px;background:#14b8a6;color:#042a38;font-weight:700}</style><main><h1>You are offline</h1><p>This page is not available in the offline cache. Reconnect and try again.</p><p>FreshEye analysis requires a network connection.</p><p lang="zh-CN">当前页面没有离线副本，请联网后重试。已缓存的 FreshEye 页面和设备历史仍可访问；分析需要网络连接。</p><a href="' + homeUrl + '">FreshEye home · 首页</a></main></html>'
  return new Response(html, {
    status: 503,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }
  })
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME)
    await cache.addAll(PRECACHE_URLS.map((path) => new URL(path, SCOPE_URL).href))
    await self.skipWaiting()
  })())
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys()
    await Promise.all(names
      .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
      .map((name) => caches.delete(name)))
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== SCOPE_URL.origin || isInferenceEndpoint(url.pathname)) return

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request)
        const contentType = response.headers.get('content-type') || ''
        if (response.ok && NAVIGATION_PATHS.has(url.pathname) && contentType.includes('text/html')) {
          const cache = await caches.open(CACHE_NAME)
          await cache.put(request, response.clone())
        }
        return response
      } catch {
        const cache = await caches.open(CACHE_NAME)
        const cached = await cache.match(request, { ignoreSearch: true })
        return cached || offlineResponse()
      }
    })())
    return
  }

  // Only build-emitted files enter this allowlist. Blob/data uploads and arbitrary URLs are never cached.
  if (!STATIC_PATHS.has(url.pathname)) return

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME)
    const cached = await cache.match(request, { ignoreSearch: true })
    const refresh = fetch(request).then(async (response) => {
      if (response.ok) await cache.put(request, response.clone())
      return response
    })
    if (cached) {
      event.waitUntil(refresh.catch(() => undefined))
      return cached
    }
    try {
      return await refresh
    } catch {
      return new Response('', { status: 504, headers: { 'Cache-Control': 'no-store' } })
    }
  })())
})
