import { test, expect } from '@playwright/test'

test('first visit scroll captures all three sample corners without a dark overlay', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => localStorage.setItem('fresheye-language', 'en'))
  await page.route('**/health*', route => route.fulfill({ status: 200, json: { status: 'ok' } }))
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.getByTestId('guide-dismiss').click()
  await page.mouse.move(1400, 400)
  let geometry: { x: number; y: number; width: number; height: number }[] = []
  for (let step = 0; step < 20; step++) {
    await page.mouse.wheel(0, 120)
    await page.waitForTimeout(100)
    geometry = await page.locator('.sample-thumb img').evaluateAll(nodes => nodes.map(node => {
      const r = node.getBoundingClientRect()
      return { x: r.x, y: r.y, width: r.width, height: r.height }
    }))
    if (geometry.length === 3 && geometry.every(r => r.y >= 0 && r.y + r.height < 900)) break
  }
  expect(geometry).toHaveLength(3)
  expect(geometry.every(r => r.y >= 0 && r.y + 30 < 900)).toBe(true)
  await page.screenshot({ path: testInfo.outputPath('first-visible-viewport.png') })
  await expect.poll(async () => page.evaluate(() => window.scrollY), { timeout: 5000, intervals: [200, 200, 200] }).toBe(await page.evaluate(() => window.scrollY))
  await page.waitForTimeout(800)
  geometry = await page.locator('.sample-thumb img').evaluateAll(nodes => nodes.map(node => { const r = node.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height } }))
  const capture = await page.screenshot({ path: testInfo.outputPath('first-scroll-viewport.png') })
  const differences = await page.evaluate(async ({ screenshot, boxes }) => {
    const image = new Image()
    image.src = screenshot
    await image.decode()
    const viewport = document.createElement('canvas')
    viewport.width = image.naturalWidth; viewport.height = image.naturalHeight
    const actual = viewport.getContext('2d')!
    actual.drawImage(image, 0, 0)
    return [...document.querySelectorAll<HTMLImageElement>('.sample-thumb img')].map((source, index) => {
      if (!source.complete || !source.naturalWidth) return Infinity
      const box = boxes[index]!
      const expectedCanvas = document.createElement('canvas')
      expectedCanvas.width = Math.round(box.width); expectedCanvas.height = Math.round(box.height)
      const expected = expectedCanvas.getContext('2d')!
      const scale = Math.max(expectedCanvas.width / source.naturalWidth, expectedCanvas.height / source.naturalHeight)
      const w = source.naturalWidth * scale, h = source.naturalHeight * scale
      expected.drawImage(source, (expectedCanvas.width - w) / 2, (expectedCanvas.height - h) / 2, w, h)
      let difference = 0, count = 0
      for (let y = 5; y < 20; y++) for (let x = expectedCanvas.width - 12; x < expectedCanvas.width - 5; x++) {
        const a = actual.getImageData(Math.round(box.x) + x, Math.round(box.y) + y, 1, 1).data
        const b = expected.getImageData(x, y, 1, 1).data
        for (let c = 0; c < 3; c++) { difference += Math.abs(a[c]! - b[c]!); count++ }
      }
      return difference / count
    })
  }, { screenshot: `data:image/png;base64,${capture.toString('base64')}`, boxes: geometry })
  // Mean RGB error in a 7×15 CSS-pixel patch; allow small colour-rendering differences.
  expect(differences).toHaveLength(3)
  for (const difference of differences) expect(difference).toBeLessThan(12)
})
