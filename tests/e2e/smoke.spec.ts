import { expect, test } from '@playwright/test'

test('el catálogo responde en la ruta base y contiene la etiqueta noindex', async ({ page }) => {
  const response = await page.goto('/portfolio-web-design/')

  expect(response?.status()).toBe(200)
  await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(1)
})
