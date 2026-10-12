import { test, expect, type Page } from '@playwright/test'

const heatmap = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAAJUlEQVR4nGMUWbCAgYFBTu4NAwMDEwMSYPywypyBgeHNdH50GQC+SgXm21VQBAAAAABJRU5ErkJggg=='

async function prepareAnalysis(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.clear()
    localStorage.setItem('fresheye-onboarded', '1')
  })
  await page.route('**/health*', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ status: 'ok' })
  }))
  await page.route('**/predict_with_gradcam**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      prediction: {
        freshness_level: 1,
        freshness_label: 1,
        confidence_score: 0.95,
        all_probabilities: { 0: 0.08, 1: 0.95, 2: 0.02 },
        description: 'Browser UI fixture',
        model_version: 'v2',
        timestamp: '2026-10-12T12:00:00.000Z'
      },
      heatmap_image: heatmap
    })
  }))
  await page.goto('/')
  await page.locator('.sample-thumb').nth(1).click()
  await expect(page.locator('#preview-card')).toBeVisible()
  await page.locator('.preview-actions .btn').first().click()
  await expect(page.locator('#result-section')).toBeVisible()
  await page.getByRole('tab', { name: '详细报告' }).click()
}

test('accordion panels hide collapsed content and keep one report item open', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await prepareAnalysis(page)

  const firstToggle = page.locator('#detail-toggle-appearance')
  const secondToggle = page.locator('#detail-toggle-trend')
  const closedPanel = page.locator('#detail-panel-trend')

  await expect(firstToggle).toHaveAttribute('aria-expanded', 'true')
  await expect(secondToggle).toHaveAttribute('aria-expanded', 'false')
  await expect(closedPanel).toHaveAttribute('aria-hidden', 'true')
  await expect.poll(() => closedPanel.evaluate((element) => element.getBoundingClientRect().height)).toBeLessThan(2)
  await expect(closedPanel).toHaveCSS('visibility', 'hidden')

  await secondToggle.click()
  await expect(firstToggle).toHaveAttribute('aria-expanded', 'false')
  await expect(secondToggle).toHaveAttribute('aria-expanded', 'true')
  await expect(closedPanel).toHaveAttribute('aria-hidden', 'false')
  await expect.poll(() => closedPanel.evaluate((element) => element.getBoundingClientRect().height)).toBeGreaterThan(20)

  await secondToggle.click()
  await expect(secondToggle).toHaveAttribute('aria-expanded', 'false')
  await expect.poll(() => closedPanel.evaluate((element) => element.getBoundingClientRect().height)).toBeLessThan(2)
})

test('desktop footer uses a compact two-level layout', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => localStorage.setItem('fresheye-onboarded', '1'))
  await page.goto('/')

  const footer = page.locator('footer.competition-footer')
  await footer.scrollIntoViewIfNeeded()
  const box = await footer.boundingBox()
  expect(box?.height ?? Number.POSITIVE_INFINITY).toBeLessThan(380)
  await expect(page.locator('.footer-links')).toHaveCSS('flex-direction', 'row')
  await expect(page.locator('.footer-bottom')).toHaveCSS('flex-direction', 'row')
})

test('mobile footer remains compact without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript(() => localStorage.setItem('fresheye-onboarded', '1'))
  await page.goto('/')

  const footer = page.locator('footer.competition-footer')
  await footer.scrollIntoViewIfNeeded()
  const box = await footer.boundingBox()
  expect(box?.height ?? Number.POSITIVE_INFINITY).toBeLessThan(560)

  const widths = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth
  }))
  expect(widths.content).toBeLessThanOrEqual(widths.viewport)
})
