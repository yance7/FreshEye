import { test, expect, type Page } from '@playwright/test'

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
  expect(await page.evaluate(() => localStorage.getItem('fresheye-language'))).toBe('en')
  expect(errors).toEqual([])
})

test('public evidence identifies dataset scope and links primary sources', async ({ page }) => {
  await page.goto('/about.html')
  await expect(page.locator('#evidence-card')).toContainText('4°C')
  await expect(page.locator('#evidence-card')).toContainText('数据集内')
  await expect(page.locator('#references a[href="https://data.mendeley.com/datasets/67nmx3mhwh/2"]')).toBeVisible()
  await page.locator('button.lang-switch:visible').first().click()
  await expect(page.locator('#evidence-card')).toContainText('in-dataset')
  await page.goto('/fish.html')
  await expect(page.locator('main')).toContainText('for education only')
  await expect(page.locator('main a[href="https://data.mendeley.com/datasets/67nmx3mhwh/2"]')).toBeVisible()
})
