import { test, expect, type Browser, type Page } from '@playwright/test'

const routes = ['/', '/guide.html', '/fish.html', '/about.html', '/404.html']

function collectRuntimeErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`)
  })
  return errors
}

async function mockHealth(page: Page): Promise<void> {
  await page.route('**/health*', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ status: 'ok' })
  }))
}

async function dismissGuide(page: Page): Promise<void> {
  const dismiss = page.getByTestId('guide-dismiss')
  if (await dismiss.count()) {
    await dismiss.click()
  }
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('fresheye-e2e-clean') !== '1') {
      localStorage.clear()
      sessionStorage.setItem('fresheye-e2e-clean', '1')
    }
  })
  await mockHealth(page)
})

test('all public routes render canonical content without horizontal overflow', async ({ page }) => {
  const errors = collectRuntimeErrors(page)

  for (const route of routes) {
    const response = await page.goto(route)
    if (route === '/404.html') {
      expect(response?.status()).toBe(200)
      await expect(page.locator('main > .code')).toHaveText('404')
      await expect(page.locator('a[href="/"]')).toContainText('Back to home')
      await expect(page.locator('#app')).toHaveCount(0)
      await expect(page.locator('script')).toHaveCount(0)
    } else {
      await expect(page.locator('main#main-content')).toBeVisible()
    }
    await expect(page.locator('h1').first()).toBeVisible()
    await expect(page).toHaveTitle(/FreshEye|鲜眸|页面不存在|Page Not Found/)
    expect(page.url()).not.toContain('#')

    const dimensions = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth
    }))
    expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewportWidth)
  }

  expect(errors).toEqual([])
})

test('language toggle updates document metadata and persists after reload', async ({ page }) => {
  const errors = collectRuntimeErrors(page)
  await page.goto('/')
  await dismissGuide(page)

  const languageToggle = page.locator('button.lang-switch:visible').first()
  await languageToggle.click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page).toHaveTitle(/FreshEye/)
  await expect(page.locator('h1').first()).toContainText('See the eye')

  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.locator('h1').first()).toContainText('See the eye')
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://fresheye.yance.me/')
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://fresheye.yance.me/')
  expect(await page.evaluate(() => localStorage.getItem('fresheye-language'))).toBe('en')
  expect(errors).toEqual([])
})

test('publishes page-specific metadata and useful content without JavaScript', async ({ browser }: { browser: Browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  await context.route(/^https:\/\/fonts\./, (route) => route.fulfill({ status: 200, contentType: 'text/css', body: '' }))
  const page = await context.newPage()
  const pages = [
    { path: '/', canonical: 'https://fresheye.yance.me/', summary: 'home-summary', content: '上传鱼眼照片' },
    { path: '/guide.html', canonical: 'https://fresheye.yance.me/guide.html', summary: 'guide-summary', content: '正对鱼眼' },
    { path: '/fish.html', canonical: 'https://fresheye.yance.me/fish.html', summary: 'fish-summary', content: 'MFED' },
    { path: '/about.html', canonical: 'https://fresheye.yance.me/about.html', summary: 'about-summary', content: '4°C' }
  ]
  const descriptions = new Set<string>()

  for (const route of pages) {
    const response = await page.goto(route.path, { waitUntil: 'domcontentloaded' })
    expect(response?.status()).toBe(200)
    await expect(page.locator(`noscript main[data-noscript="${route.summary}"]`)).toBeVisible()
    await expect(page.locator(`noscript main[data-noscript="${route.summary}"]`)).toContainText(route.content)
    await expect(page.locator(`noscript main[data-noscript="${route.summary}"] h1`)).toBeVisible()
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', route.canonical)
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', route.canonical)
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://fresheye.yance.me/assets/og-cover.png')
    await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute('content', 'https://fresheye.yance.me/assets/og-cover.png')

    const description = await page.locator('meta[name="description"]').getAttribute('content')
    expect(description?.trim().length).toBeGreaterThan(20)
    expect(description).not.toMatch(/99%\+|99\.29%/)
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /.+/)
    await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute('content', /.+/)
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', description ?? '')
    await expect(page.locator('meta[name="twitter:description"]')).toHaveAttribute('content', description ?? '')
    descriptions.add(description ?? '')
  }

  expect(descriptions.size).toBe(pages.length)

  await page.goto('/404.html', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0)
  await expect(page.locator('meta[property="og:url"]')).toHaveCount(0)

  const robotsResponse = await page.request.get('/robots.txt')
  expect(robotsResponse.status()).toBe(200)
  const robots = await robotsResponse.text()
  expect(robots).toContain('User-agent: *')
  expect(robots).toContain('Sitemap: https://fresheye.yance.me/sitemap.xml')

  const sitemapResponse = await page.request.get('/sitemap.xml')
  expect(sitemapResponse.status()).toBe(200)
  const sitemap = await sitemapResponse.text()
  const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])
  expect(sitemapUrls).toEqual(pages.map((route) => route.canonical))
  expect(sitemap).not.toContain('/404.html')

  await context.close()
})

test('updates canonical and share URLs during in-app navigation', async ({ page }) => {
  await page.goto('/about.html')
  await page.locator('a[href="/guide.html"]').first().click()
  await expect(page).toHaveURL(/\/guide\.html$/)
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://fresheye.yance.me/guide.html')
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://fresheye.yance.me/guide.html')
})

test('loads the English language chunk only after the visitor switches languages', async ({ page }) => {
  await page.goto('/')
  await dismissGuide(page)
  const scriptPaths = () => page.evaluate(() => performance.getEntriesByType('resource')
    .map((entry) => new URL(entry.name).pathname)
    .filter((path) => path.endsWith('.js')))

  const initialScripts = await scriptPaths()
  expect(initialScripts.some((path) => /\/en-[^/]+\.js$/.test(path))).toBe(false)

  await page.locator('button.lang-switch:visible').first().click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect.poll(async () => (await scriptPaths()).some((path) => /\/en-[^/]+\.js$/.test(path))).toBe(true)
})

test('public evidence identifies dataset scope and links primary sources', async ({ page }) => {
  await page.goto('/about.html')
  await expect(page.locator('.pain-card.solution')).not.toContainText('99%+')
  await expect(page.locator('.pain-card.solution')).toContainText('98.88%')
  await expect(page.locator('.pain-card.solution')).toContainText('MFED')
  await expect(page.locator('#evidence-card')).toContainText('4°C')
  await expect(page.locator('#evidence-card')).toContainText('数据集内')
  await expect(page.locator('#references a[href="https://data.mendeley.com/datasets/67nmx3mhwh/2"]')).toBeVisible()
  await page.locator('button.lang-switch:visible').first().click()
  await expect(page.locator('.pain-card.solution')).not.toContainText('99%+')
  await expect(page.locator('.pain-card.solution')).toContainText('98.88%')
  await expect(page.locator('.pain-card.solution')).toContainText('MFED')
  await expect(page.locator('#evidence-card')).toContainText('in-dataset')
  await page.goto('/fish.html')
  await expect(page.locator('main')).toContainText('for education only')
  await expect(page.locator('main a[href="https://data.mendeley.com/datasets/67nmx3mhwh/2"]')).toBeVisible()
})

test('English remains selected across public pages and updates page metadata', async ({ page }) => {
  await page.goto('/')
  await dismissGuide(page)
  await page.locator('button.lang-switch:visible').first().click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  for (const [path, title] of [['/guide.html', /User Guide/], ['/fish.html', /Species Guide/], ['/about.html', /About FreshEye/]] as const) {
    await page.goto(path)
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(page).toHaveTitle(title)
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /[A-Za-z]{5}/)
    await expect(page.locator('body')).not.toContainText('nav.home')
  }
})

test('a failed English download leaves the current language usable', async ({ page }) => {
  await page.route(/\/en-[^/]+\.js$/, route => route.abort())
  await page.goto('/')
  await dismissGuide(page)
  await page.locator('button.lang-switch:visible').first().click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN')
  await expect(page.locator('nav.nav-links')).toContainText('首页')
  expect(await page.evaluate(() => localStorage.getItem('fresheye-language'))).toBe('zh')
})

test('the last rapid language selection wins while English is loading', async ({ page }) => {
  await page.route(/\/en-[^/]+\.js$/, async route => {
    await new Promise(resolve => setTimeout(resolve, 600))
    await route.continue()
  })
  await page.goto('/')
  await dismissGuide(page)
  const toggle = page.locator('button.lang-switch:visible').first()
  await toggle.click()
  await toggle.click()
  await page.waitForTimeout(900)
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN')
  expect(await page.evaluate(() => localStorage.getItem('fresheye-language'))).toBe('zh')
})
