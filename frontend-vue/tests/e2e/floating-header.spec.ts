import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.route('**/health*', route => route.fulfill({ status: 200, json: { status: 'ok' } }))
})

for (const width of [390, 1440]) {
  test(`keeps a stable floating header and control focus at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    await page.goto('/guide.html')
    const header = page.locator('.navbar')
    const language = header.locator('.lang-switch')
    await expect(header).not.toHaveClass(/is-scrolled/)
    await language.focus()
    await page.evaluate(() => { (document.querySelector('.lang-switch') as HTMLElement & { original?: boolean }).original = true; window.scrollTo(0, 100) })
    await expect(header).toHaveClass(/is-scrolled/)
    await expect(language).toBeFocused()
    expect(await language.evaluate((node: HTMLElement & { original?: boolean }) => node.original)).toBe(true)
    const geometry = await header.boundingBox()
    expect(geometry!.x).toBeGreaterThan(0)
    expect(geometry!.y).toBeGreaterThan(0)
    expect(geometry!.width).toBeLessThan(width)
    await page.evaluate(() => window.scrollTo(0, 50))
    await expect(header).toHaveClass(/is-scrolled/)
    await page.evaluate(() => window.scrollTo(0, 0))
    await expect(header).not.toHaveClass(/is-scrolled/)
    await expect(language).toBeFocused()
  })
}

test('mobile floating menu remains above the page and returns focus after Escape', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/guide.html')
  await page.evaluate(() => window.scrollTo(0, 300))
  await expect(page.locator('.navbar')).toHaveClass(/is-scrolled/)
  const toggle = page.locator('.nav-toggle')
  await toggle.click()
  await expect(page.locator('#navOverlay')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(toggle).toBeFocused()
})
