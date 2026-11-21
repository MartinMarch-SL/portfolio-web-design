import { expect, test } from '@playwright/test'

const home = '/portfolio-web-design/ruido/'

test.use({ launchOptions: { args: ['--disable-webgl'] } })

test('preserves product photography without console errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto(`${home}tienda/`)
  const image = page.locator('[data-distort-image]').first()
  await image.hover()
  await expect(image.locator('img')).toBeVisible()
  await expect.poll(() => image.locator('img').evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0)
  await expect(image.locator('canvas')).toHaveCount(0)
  expect(errors).toEqual([])
})
