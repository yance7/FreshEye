import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

test('mobile hero keeps its primary action in view and long file names readable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.route('**/health*', route => route.fulfill({ status: 200, json: { status: 'ok' } }))
  await page.goto('/')
  const dismiss = page.getByTestId('guide-dismiss')
  if (await dismiss.isVisible()) await dismiss.click()
  const primary = page.locator('.hero-action-primary')
  const position = await primary.boundingBox()
  expect(position!.y + position!.height).toBeLessThanOrEqual(844)
  expect(position!.width).toBeGreaterThan(300)
  await primary.click()
  await expect(page.locator('#upload-title')).toBeInViewport()

  const name = 'fish-eye-very-long-file-name-for-mobile-layout-12345678901234567890.webp'
  const buffer = await readFile(resolve('public/assets/samples/fresh.webp'))
  await page.locator('input[type="file"]').first().setInputFiles({ name, mimeType: 'image/webp', buffer })
  await expect(page.locator('#preview-card')).toBeVisible()
  const filename = page.locator('.preview-info strong').first()
  await expect(filename).toHaveText(name)
  await expect(filename).toHaveCSS('white-space', 'normal')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
})
