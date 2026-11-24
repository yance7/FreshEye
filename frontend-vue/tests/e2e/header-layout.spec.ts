import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear())
  await page.route('**/health*', route => route.fulfill({ status: 200, json: { status: 'ok' } }))
})

test('desktop header separates the brand, navigation and language control in both languages', async ({ page }) => {
  for (const width of [1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/guide.html')
    for (const language of ['zh-CN', 'en']) {
      await expect(page.locator('html')).toHaveAttribute('lang', language)
      const brand = page.locator('.navbar .brand')
      const links = page.locator('.navbar .nav-links')
      const tools = page.locator('.navbar .nav-tools')
      await expect(brand).toBeVisible()
      await expect(links).toBeVisible()
      await expect(tools.locator('.lang-switch')).toBeVisible()
      await expect(links.locator('a')).toHaveCount(5)
      await expect(links.locator('a[aria-current="page"]')).toHaveAttribute('href', '/guide.html')
      await expect(links.locator('a[href="https://github.com/yance7/FreshEye"]')).toHaveAttribute('target', '_blank')
      const box = await page.evaluate(() => {
        const rect = (selector: string) => document.querySelector(selector)!.getBoundingClientRect().toJSON()
        return { brand: rect('.navbar .brand'), links: rect('.navbar .nav-links'), tools: rect('.navbar .nav-tools'), nav: rect('.navbar') }
      })
      expect(box.brand.right).toBeLessThanOrEqual(box.links.left)
      expect(box.links.right).toBeLessThanOrEqual(box.tools.left)
      expect((box.links.left + box.links.right) / 2 / box.nav.width).toBeGreaterThan(0.40)
      expect((box.links.left + box.links.right) / 2 / box.nav.width).toBeLessThan(0.50)
      if (language === 'zh-CN') await tools.locator('.lang-switch').click()
    }
    await page.locator('.nav-tools .lang-switch').click()
  }
})

test('mobile language and menu remain accessible, with a trapped menu and restored focus', async ({ page }) => {
  for (const width of [320, 390, 430]) {
    await page.setViewportSize({ width, height: 844 })
    await page.goto('/guide.html')
    const toggle = page.locator('.nav-toggle')
    const language = page.locator('.navbar .lang-switch')
    await expect(language).toBeVisible()
    await expect(toggle).toBeVisible()
    await expect(page.locator('.nav-links')).toBeHidden()
    await language.click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await toggle.click()
    const dialog = page.locator('#navOverlay')
    await expect(dialog).toBeVisible()
    await expect(dialog.locator('a[aria-current="page"]')).toHaveAttribute('href', '/guide.html')
    await expect(dialog.locator('.lang-switch')).toHaveCount(0)
    await expect(dialog.locator('a').first()).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(dialog.locator('button').last()).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(toggle).toBeFocused()
    await expect(dialog).toHaveCount(0)
  }
})

test('closes the mobile menu and restores scrolling when the viewport becomes desktop', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 844 })
  await page.goto('/guide.html')
  await page.locator('.nav-toggle').click()
  await expect(page.locator('#navOverlay')).toBeVisible()
  await expect(page.locator('body')).toHaveCSS('overflow', 'hidden')
  await page.setViewportSize({ width: 901, height: 844 })
  await expect(page.locator('#navOverlay')).toHaveCount(0)
  await expect(page.locator('.nav-links')).toBeVisible()
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden')
})
