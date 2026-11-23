const PREVIOUS_CACHE = 'fresheye-vue-v3'

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(PREVIOUS_CACHE)
    await cache.put(
      new URL('/private-user-image.jpg', self.registration.scope),
      new Response('fixture-only previous-cache entry', { headers: { 'Content-Type': 'image/jpeg' } })
    )
    await self.skipWaiting()
  })())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})
