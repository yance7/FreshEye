import { test, expect, type Page, type Route } from '@playwright/test'
import { resolve } from 'node:path'

type Fixture = {
  freshness_level: 0 | 1 | 2
  confidence_score: number
  description?: string
}

const samplePath = resolve(process.cwd(), 'public/assets/samples/fresh.webp')

function responseFor(fixture: Fixture): object {
  return {
    prediction: {
      freshness_level: fixture.freshness_level,
      freshness_label: fixture.freshness_level,
      confidence_score: fixture.confidence_score,
      all_probabilities: fixture.freshness_level === 0
        ? { 0: fixture.confidence_score, 1: 0.08, 2: 0.02 }
        : fixture.freshness_level === 1
          ? { 0: 0.12, 1: fixture.confidence_score, 2: 0.08 }
          : { 0: 0.08, 1: 0.32, 2: fixture.confidence_score },
      description: fixture.description ?? 'Deterministic browser fixture',
      model_version: 'v2',
      timestamp: '2026-08-20T12:34:56.000Z'
    },
    heatmap_image: 'data:image/png;base64,aGVhdG1hcA=='
  }
}

async function mockApi(page: Page, fixture: Fixture): Promise<string[]> {
  const models: string[] = []
  await page.route('**/health*', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ status: 'ok' })
  }))
  await page.route('**/predict_with_gradcam**', (route) => {
    models.push(new URL(route.request().url()).searchParams.get('model_version') ?? '')
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(responseFor(fixture))
    })
  })
  return models
}

async function dismissGuide(page: Page): Promise<void> {
  const dismiss = page.getByTestId('guide-dismiss')
  if (await dismiss.count()) await dismiss.click()
}

async function prepareSample(page: Page, index = 1): Promise<void> {
  await page.locator('.sample-thumb').nth(index).click()
  await expect(page.locator('#preview-card')).toBeVisible()
}

async function analyze(page: Page): Promise<void> {
  await page.locator('.preview-actions .btn').first().click()
  await expect(page.locator('#result-section')).toBeVisible()
}

test('completes the mocked analysis workflow and protects interaction state', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  const models = await mockApi(page, { freshness_level: 2, confidence_score: 0.42 })

  await page.goto('/')
  await expect(page.getByTestId('guide-dismiss')).toBeVisible()
  await dismissGuide(page)

  await page.locator('.advanced-settings summary').click()
  await page.locator('#model-version-select').selectOption('v1')
  await expect(page.locator('#model-version-select')).toHaveValue('v1')
  await prepareSample(page)
  await analyze(page)
  await expect.poll(() => models.length).toBe(1)
  expect(models[0]).toBe('v1')

  await expect(page.locator('#result-section')).toContainText('不新鲜')
  await expect(page.locator('[role="dialog"]')).toContainText('AI 对这张图片的判断不够确定')
  await page.getByTestId('low-confidence-view').click()
  await expect(page.locator('[role="dialog"]')).toHaveCount(0)

  await page.getByRole('tab', { name: 'AI视觉分析' }).click()
  await expect(page.locator('.compare-slider')).toBeVisible()
  await page.locator('.compare-slider').press('ArrowLeft')
  await expect(page.locator('.compare-slider')).toHaveAttribute('aria-valuenow', '45')

  await page.getByRole('tab', { name: '详细报告' }).click()
  const detail = page.locator('#detail-toggle-appearance')
  await expect(detail).toHaveAttribute('aria-expanded', 'true')
  await detail.click()
  await expect(detail).toHaveAttribute('aria-expanded', 'false')

  const historyItem = page.locator('.history-item').first()
  await expect(historyItem).toBeVisible()
  await historyItem.locator('.icon-btn').first().click()
  await expect(historyItem.locator('.icon-btn').first()).toHaveClass(/active/)
  await historyItem.locator('.icon-btn.del').click()
  await expect(page.locator('.history-list')).toHaveCount(0)

  await page.locator('.preview-actions .btn.alt').click()
  await expect(page.locator('#preview-card')).toHaveCount(0)
  await prepareSample(page, 0)
  await analyze(page)
  await page.getByTestId('low-confidence-retry').click()
  await expect(page.locator('#preview-card')).toHaveCount(0)
  expect(errors).toEqual([])
})

test('ignores a stale response after a replacement file starts a newer analysis', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  await page.route('**/health*', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ status: 'ok' })
  }))
  const pending: Route[] = []
  await page.route('**/predict_with_gradcam**', (route) => { pending.push(route) })

  await page.goto('/')
  await dismissGuide(page)
  await prepareSample(page, 0)
  await page.locator('.preview-actions .btn').first().click()
  await expect.poll(() => pending.length).toBe(1)

  await page.locator('input[type="file"]').first().setInputFiles(samplePath)
  await expect(page.locator('#preview-card')).toBeVisible()
  await page.locator('.preview-actions .btn').first().click()
  await expect.poll(() => pending.length).toBe(2)

  await pending[1].fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(responseFor({ freshness_level: 0, confidence_score: 0.96 }))
  })
  await expect(page.locator('#result-section')).toContainText('高度新鲜')

  await pending[0].fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(responseFor({ freshness_level: 2, confidence_score: 0.42 }))
  })
  await page.waitForTimeout(150)
  await expect(page.locator('[role="dialog"]')).toHaveCount(0)
  expect(errors).toEqual([])
})
