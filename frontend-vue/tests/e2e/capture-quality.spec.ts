import { test, expect } from '@playwright/test'

test('explains HEIC and damaged files and permits a normal sample', async ({ page }) => {
  await page.route('**/health*', (route) => route.fulfill({ status: 200, json: { status: 'ok' } }))
  await page.goto('/')
  const dismiss = page.getByTestId('guide-dismiss')
  if (await dismiss.count()) await dismiss.click()
  const input = page.locator('input[type=file]').first()
  await input.setInputFiles({ name: 'photo.heic', mimeType: 'image/heic', buffer: Buffer.from('not a photo') })
  await expect(page.getByText('暂不支持 HEIC/HEIF 文件；请转换为 JPEG，或使用应用内相机重新拍摄。')).toBeVisible()
  await input.setInputFiles({ name: 'broken.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('not a jpeg') })
  await expect(page.locator('.upload-error')).toContainText('图像读取或处理失败')
  await page.locator('.sample-thumb').first().click()
  await expect(page.locator('#preview-card')).toBeVisible()
  await expect(page.locator('.preview-actions .btn').first()).toBeEnabled()
})
