import { expect, test } from '@playwright/test'

test('sample labels stay within their cards and selecting each loads its matching original', async ({ page }, testInfo) => {
  await page.addInitScript(() => localStorage.clear())
  await page.route('**/health*', route => route.fulfill({ status: 200, json: { status: 'ok' } }))
  const originals = ['highly-fresh.webp', 'fresh.webp', 'not-fresh.webp']
  for (const [index, original] of originals.entries()) {
    await page.goto('/')
    const dismiss = page.getByTestId('guide-dismiss')
    if (await dismiss.isVisible()) await dismiss.click()
    const card = page.locator('.sample-thumb').nth(index)
    const label = card.locator('.sample-tag')
    await card.scrollIntoViewIfNeeded()
    await expect(label).toHaveCSS('backdrop-filter', 'none')
    const boxes = await card.evaluate(element => {
      const outer = element.getBoundingClientRect()
      const inner = element.querySelector('.sample-tag')!.getBoundingClientRect()
      return { top: inner.top - outer.top, bottom: outer.bottom - inner.bottom, height: outer.height }
    })
    expect(boxes.top).toBeGreaterThan(boxes.height / 2)
    expect(boxes.bottom).toBeGreaterThanOrEqual(0)
    await card.screenshot({ path: testInfo.outputPath(`sample-${index}-rest.png`) })
    await card.hover()
    await card.screenshot({ path: testInfo.outputPath(`sample-${index}-hover.png`) })
    await card.focus()
    await expect(card).toBeFocused()
    const originalResponse = page.waitForResponse(response => new URL(response.url()).pathname.endsWith(`/samples/${original}`))
    await card.click()
    expect((await originalResponse).ok()).toBe(true)
    await expect(page.locator('#preview-card')).toBeVisible()
  }
})
