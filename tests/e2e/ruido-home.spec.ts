import { expect, test } from '@playwright/test'

const home = '/portfolio-web-design/ruido/'

test('renders the campaign and confirms newsletter signup locally at 375 px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto(home)
  for (const section of ['hero', 'ticker', 'countdown', 'drop', 'manifesto', 'lookbook', 'workshop', 'newsletter']) {
    await expect(page.locator(`[data-section="${section}"]`)).toBeVisible()
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375)
  const requests: string[] = []
  page.on('request', request => {
    if (request.isNavigationRequest() || ['fetch', 'xhr'].includes(request.resourceType())) requests.push(request.url())
  })
  await page.getByRole('textbox', { name: 'Tu email' }).fill('prueba@example.com')
  await page.getByRole('button', { name: 'Avísame' }).click()
  await expect(page.getByRole('status')).toHaveText('Apuntado. Nos vemos en la próxima tirada.')
  await expect(page.getByRole('textbox', { name: 'Tu email' })).toHaveCount(0)
  expect(requests).toEqual([])
})

test('respects motion preferences on hover and clears the canvas on navigation', async ({ page, reducedMotion }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto(`${home}tienda/`)
  const image = page.locator('[data-distort-image]').first()
  await expect(image.locator('img')).toBeVisible()
  await image.hover()
  if (reducedMotion === 'reduce') {
    await expect(image.locator('canvas')).toHaveCount(0)
  } else {
    await expect(image.locator('canvas')).toBeVisible()
  }
  await page.getByRole('link', { name: 'RUIDO, inicio' }).click()
  await expect(page.locator('[data-section="hero"]')).toBeVisible()
  await expect(page.locator('[data-distort-image] canvas')).toHaveCount(0)
  expect(errors).toEqual([])
})
