import { test, expect, type Page } from '@playwright/test'

function responseFor(): object {
  return {
    prediction: {
      freshness_level: 0,
      freshness_label: 0,
      confidence_score: 0.96,
      all_probabilities: { 0: 0.96, 1: 0.03, 2: 0.01 },
      description: 'Deterministic report fixture',
      model_version: 'v2',
      timestamp: '2026-08-20T12:34:56.000Z'
    },
    heatmap_image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAAJUlEQVR4nGMUWbCAgYFBTu4NAwMDEwMSYPywypyBgeHNdH50GQC+SgXm21VQBAAAAABJRU5ErkJggg=='
  }
}

async function mockApi(page: Page): Promise<void> {
  await page.route('**/health*', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ status: 'ok' })
  }))
  await page.route('**/predict_with_gradcam**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(responseFor())
  }))
}

async function dismissGuide(page: Page): Promise<void> {
  const dismiss = page.getByTestId('guide-dismiss')
  if (await dismiss.count()) await dismiss.click()
}

async function analyze(page: Page): Promise<void> {
  await page.locator('.sample-thumb').first().click()
  await expect(page.locator('#preview-card')).toBeVisible()
  await page.locator('.preview-actions .btn').first().click()
  await expect(page.locator('#result-section')).toBeVisible()
}

async function exportReport(page: Page): Promise<import('@playwright/test').Page> {
  const popupPromise = page.waitForEvent('popup')
  await page.locator('#result-section .btn').first().click()
  const popup = await popupPromise
  await popup.waitForLoadState('domcontentloaded')
  return popup
}

test('exports a self-contained Chinese and English single-page report', async ({ page }) => {
  await page.addInitScript(() => localStorage.clear())
  await mockApi(page)
  await page.goto('/')
  await dismissGuide(page)
  await analyze(page)

  const zhPopup = await exportReport(page)
  const zhRemoteRequests: string[] = []
  zhPopup.on('request', (request) => { if (/^https?:/i.test(request.url())) zhRemoteRequests.push(request.url()) })
  await expect(zhPopup.locator('.pdf-page')).toHaveCount(1)
  await expect(zhPopup.locator('html')).toHaveAttribute('lang', 'zh-CN')
  await expect(zhPopup.locator('.pdf-page')).toContainText('高精度版（推荐）')
  await expect(zhPopup.locator('.pdf-page')).toContainText('高度新鲜')
  await expect(zhPopup.locator('.pdf-page')).toContainText('第 1 页 / 共 1 页')
  await expect(zhPopup.locator('img')).toHaveCount(2)
  expect(zhRemoteRequests).toEqual([])
  await zhPopup.close()

  await page.locator('button.lang-switch:visible').first().click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  const enPopup = await exportReport(page)
  const enRemoteRequests: string[] = []
  enPopup.on('request', (request) => { if (/^https?:/i.test(request.url())) enRemoteRequests.push(request.url()) })
  await expect(enPopup.locator('.pdf-page')).toHaveCount(1)
  await expect(enPopup.locator('html')).toHaveAttribute('lang', 'en')
  await expect(enPopup.locator('.pdf-page')).toContainText('High-accuracy model (recommended)')
  await expect(enPopup.locator('.pdf-page')).toContainText('Highly Fresh')
  await expect(enPopup.locator('.pdf-page')).toContainText('Page 1 / 1')
  await expect(enPopup.locator('.pdf-page')).toContainText('does not replace statutory food inspection')
  await expect(enPopup.locator('img')).toHaveCount(2)
  expect(enRemoteRequests).toEqual([])
  await expect(enPopup.locator('#close-report')).toBeVisible()
  await enPopup.locator('#close-report').click()
})
