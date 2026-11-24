import { test, expect } from '@playwright/test'

test('guide caption and fish reference copy are concise in both languages', async ({ page }) => {
  await page.goto('/guide.html')
  const caption = page.locator('.viewfinder-guide-note a')
  await expect(caption).toHaveText('鱼眼拍摄示意')
  await expect(caption).toHaveAttribute('href', /highly-fresh\.webp$/)
  await page.goto('/fish.html')
  await expect(page.locator('.intro-sub')).toContainText(['MFED 研究按鱼眼外观分为三个视觉等级。', /.+/, /.+/, '相关标准与指标'])
  await expect(page.locator('a[href*="nhc.gov.cn"]')).toBeVisible()
  await page.locator('.navbar .lang-switch').click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.locator('.intro-sub').first()).toHaveText('The MFED study groups fish-eye appearance into three visual grades.')
  await expect(page.locator('.intro-sub')).toContainText(['The MFED study groups fish-eye appearance into three visual grades.', /.+/, /.+/, 'Related standards and indicators'])
  await page.goto('/guide.html')
  await expect(caption).toHaveText('Fish-eye photo example')
})
