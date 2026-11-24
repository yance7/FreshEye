import { test, expect } from '@playwright/test'

test('serves a static HTTP 404 with a root home link at nested unknown paths', async ({ page }) => {
  const response = await page.goto('/unvisited/route/that-does-not-exist')
  expect(response?.status()).toBe(404)
  await expect(page.locator('h1')).toHaveText('页面不存在')
  await expect(page.locator('a[href="/"]')).toContainText('Back to home')
  await expect(page.locator('#app')).toHaveCount(0)
  await expect(page.locator('script')).toHaveCount(0)

  await page.locator('a[href="/"]').click()
  await expect(page).toHaveURL(/127\.0\.0\.1:4175\/$/)
  await expect(page.locator('#hero-title')).toBeVisible()
})

test('versions the production cache, keeps uncached pages honest offline, and isolates inference', async ({ page, context }) => {
  await page.goto('/seed-old-cache')
  await context.addCookies([{ name: 'fresheye-previous-worker', value: '1', url: 'http://127.0.0.1:4175/' }])
  await page.evaluate(async () => {
    await navigator.serviceWorker.register('/sw.js', { scope: '/' })
  })
  await page.waitForFunction(() => navigator.serviceWorker.controller?.scriptURL.endsWith('/sw.js'))
  const previousWorkerState = await page.evaluate(async () => {
    return {
      controller: navigator.serviceWorker.controller?.scriptURL || '',
      privateImagePresent: Boolean(await caches.match(`${location.origin}/private-user-image.jpg`))
    }
  })
  expect(previousWorkerState.controller).toContain('/sw.js')
  expect(previousWorkerState.privateImagePresent).toBe(true)

  await context.clearCookies()
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration('/')
    await registration?.update()
  })
  const upgradedCacheNames = await page.evaluate(async () => {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const registration = await navigator.serviceWorker.getRegistration('/')
      const cacheNames = await caches.keys()
      if (registration?.active?.state === 'activated'
        && cacheNames.some((name) => /^fresheye-vue-[a-f0-9]{16}$/.test(name))
        && !cacheNames.includes('fresheye-vue-v3')) return cacheNames
      await new Promise((resolve) => setTimeout(resolve, 250))
    }
    return await caches.keys()
  })
  expect(upgradedCacheNames.some((name) => /^fresheye-vue-[a-f0-9]{16}$/.test(name))).toBe(true)
  expect(upgradedCacheNames).not.toContain('fresheye-vue-v3')
  expect(await page.evaluate(() => navigator.serviceWorker.controller?.scriptURL || '')).toContain('/sw.js')

  const cacheState = await page.evaluate(async () => {
    const names = await caches.keys()
    const registration = await navigator.serviceWorker.getRegistration()
    const activeName = names.find((name) => /^fresheye-vue-[a-f0-9]{16}$/.test(name)) || ''
    const cache = await caches.open(activeName)
    const pagePaths = ['/', '/index.html', '/guide.html', '/fish.html', '/about.html', '/404.html']
    const pageAvailability = await Promise.all(pagePaths.map(async (path) => Boolean(await cache.match(`${location.origin}${path}`))))
    const keys = await cache.keys()
    return {
      names,
      activeName,
      controller: navigator.serviceWorker.controller?.scriptURL,
      activeWorker: registration?.active?.scriptURL,
      pageAvailability,
      assetCount: keys.filter((request) => /\.(?:css|js|png|svg|webp)(?:\?|$)/i.test(request.url)).length
    }
  })
  expect(cacheState.activeName).toMatch(/^fresheye-vue-[a-f0-9]{16}$/)
  expect(cacheState.activeName).not.toBe('fresheye-vue-v3')
  expect(cacheState.names).not.toContain('fresheye-vue-v3')
  expect(cacheState.pageAvailability).toEqual([true, true, true, true, true, true])
  expect(cacheState.assetCount).toBeGreaterThan(5)

  const apiAndBlobCache = await page.evaluate(async () => {
    const apiStatuses = await Promise.all([
      fetch('/health').then((response) => response.status).catch(() => 0),
      fetch('/predict_with_gradcam?model_version=v2', { method: 'POST', body: new FormData() }).then((response) => response.status).catch(() => 0)
    ])
    const photoUrl = URL.createObjectURL(new Blob(['private image bytes'], { type: 'image/jpeg' }))
    await fetch(photoUrl).catch(() => undefined)
    URL.revokeObjectURL(photoUrl)
    const cache = await caches.open((await caches.keys()).find((name) => name.startsWith('fresheye-vue-')) || '')
    return { apiStatuses, urls: (await cache.keys()).map((request) => request.url) }
  })
  expect(apiAndBlobCache.apiStatuses).toEqual([404, 404])
  expect(apiAndBlobCache.urls.some((url) => /\/(?:health|predict)(?:\/|\?|$)/i.test(new URL(url).pathname))).toBe(false)
  expect(apiAndBlobCache.urls.some((url) => url.startsWith('blob:'))).toBe(false)

  const onlineMissing = await page.goto('/unvisited/deep/path')
  expect(onlineMissing?.status()).toBe(404)
  await expect(page.locator('h1')).toHaveText('页面不存在')
  const missingWasCached = await page.evaluate(async () => {
    const cache = await caches.open((await caches.keys()).find((name) => name.startsWith('fresheye-vue-')) || '')
    return Boolean(await cache.match(`${location.origin}/unvisited/deep/path`))
  })
  expect(missingWasCached).toBe(false)

  await context.addCookies([{ name: 'fresheye-offline-test', value: '1', url: 'http://127.0.0.1:4175/' }])
  await context.setOffline(true)
  expect(await page.evaluate(() => navigator.onLine)).toBe(false)
  const cachedHome = await page.goto('/')
  expect(cachedHome?.status()).toBe(200)
  await expect(page.locator('#hero-title')).toBeVisible()
  const offlineReload = await page.reload()
  expect(offlineReload?.status()).toBe(200)
  const cachedGuide = await page.goto('/guide.html')
  expect(cachedGuide?.status()).toBe(200)
  await expect(page.locator('h1').first()).toBeVisible()

  const unavailableMissing = await page.goto('/unvisited/deep/path')
  expect(unavailableMissing?.status()).toBe(503)
  await expect(page.locator('h1')).toHaveText('You are offline')
  await expect(page.getByText('FreshEye analysis requires a network connection.')).toBeVisible()

  await context.setOffline(false)
  await context.clearCookies()
  const recoveredPage = await page.goto('/about.html')
  expect(recoveredPage?.status()).toBe(200)
  await expect(page.locator('h1').first()).toBeVisible()
})
