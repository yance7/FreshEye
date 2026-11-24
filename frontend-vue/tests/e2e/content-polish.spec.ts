import { expect, test } from '@playwright/test'

test('footer omits contestant badge in both languages and keeps the remaining badges', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/about.html')
  const footer = page.locator('footer.competition-footer')
  await expect(footer.locator('.competition-info .badge')).toHaveCount(2)
  await expect(footer).not.toContainText('参赛者 · 祈雨柒')
  await page.locator('.lang-switch:visible').first().click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(footer).not.toContainText('Contestant · Qiyuqi')
  await expect(footer.locator('.competition-info .badge')).toHaveCount(2)
})

test('narrow About comparison tables are keyboard-focusable scroll regions', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 })
  await page.goto('/about.html')
  const table = page.locator('#comparison .table-wrap')
  await expect(table).toHaveAttribute('tabindex', '0')
  await expect(table).toHaveAttribute('role', 'region')
  await expect(table).toHaveAttribute('aria-label', /.+/)
  await table.focus()
  await expect(table).toBeFocused()
  await expect.poll(() => table.evaluate(node => node.scrollWidth > node.clientWidth)).toBe(true)
  await page.keyboard.press('ArrowRight')
  await expect.poll(() => table.evaluate(node => node.scrollLeft)).toBeGreaterThan(0)
})
