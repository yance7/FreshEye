import { test, expect, type Page } from '@playwright/test'

const viewports = [
  { width: 320, height: 568 },
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 844, height: 390 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1280, height: 720 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 }
]

async function mockHealth(page: Page): Promise<void> {
  await page.route('**/health*', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ status: 'ok' })
  }))
}

async function dismissGuide(page: Page): Promise<void> {
  const dismiss = page.getByTestId('guide-dismiss')
  if (await dismiss.count()) await dismiss.click()
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear())
  await mockHealth(page)
})

test('keeps the page within the viewport matrix and preserves touch target sizes', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })

  for (const viewport of viewports) {
    await page.setViewportSize(viewport)
    await page.goto('/')
    await dismissGuide(page)

    const dimensions = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth
    }))
    expect(dimensions.documentWidth, `${viewport.width}x${viewport.height}`).toBeLessThanOrEqual(dimensions.viewportWidth)

    const undersizedControls = await page.locator('.btn, .upload-cta, .nav-toggle, .lang-switch, .select-field__native').evaluateAll((elements) => elements
      .filter((element) => {
        const rect = element.getBoundingClientRect()
        return rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)
      })
      .map((element) => `${element.tagName}.${element.className}`))
    expect(undersizedControls, `${viewport.width}x${viewport.height}`).toEqual([])
  }

  expect(errors).toEqual([])
})

test('closes the mobile menu with Escape and restores focus', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await dismissGuide(page)

  const toggle = page.locator('.nav-toggle')
  await toggle.click()
  await expect(page.locator('#navOverlay')).toBeVisible()
  await page.locator('#navOverlay').press('Escape')
  await expect(page.locator('#navOverlay')).toHaveCount(0)
  await expect(toggle).toBeFocused()
})

test('keeps reduced motion final states and landscape dialogs reachable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 844, height: 390 })
  await page.goto('/')
  await dismissGuide(page)

  await expect.poll(() => page.locator('.reveal').first().evaluate((element) => getComputedStyle(element).opacity)).toBe('1')
  await expect(page.locator('.bubble')).toHaveCount(0)

  await page.locator('.upload-cta.alt').click()
  const dialog = page.locator('.app-dialog-surface')
  await expect(dialog).toBeVisible()
  await expect(dialog).toHaveCSS('overflow', 'auto')
  await page.locator('.camera-dialog-head .icon-btn').click()
  await expect(dialog).toHaveCount(0)
})
