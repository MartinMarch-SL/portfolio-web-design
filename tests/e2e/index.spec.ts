import { expect, test } from '@playwright/test'

test('el catálogo solo muestra los proyectos publicados', async ({ page }) => {
  await page.goto('/portfolio-web-design/')
  const rows = page.locator('[data-project]')
  await expect(rows).toHaveCount(6)
  await expect(page.locator('a[href$="/ruido/"]')).toHaveCount(1)
  await expect(page.locator('a[href$="/bar-caribe/"]')).toHaveCount(1)
  await expect(page.locator('a[href$="/ines-arranz/"]')).toHaveCount(1)
  await expect(page.locator('a[href$="/mares/"]')).toHaveCount(1)
  await expect(page.locator('a[href$="/simon-lera/"]')).toHaveCount(1)
  await expect(page.locator('a[href$="/lia-ferro/"]')).toHaveCount(1)
  const pending = rows.filter({ hasText: 'En preparación' })
  await expect(pending).toHaveCount(0)
})

test('el catálogo cabe en 375 px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/portfolio-web-design/')
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375)
})
