import { expect, test } from '@playwright/test'

const root = '/portfolio-web-design/bar-caribe/'

test('la pizarra cambia con el día en Madrid', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-24T12:00:00Z'))
  await page.goto(root)
  await expect(page.locator('[data-chalkboard]')).toContainText('Lentejas estofadas')
  await page.clock.setFixedTime(new Date('2026-11-22T23:30:00Z'))
  await page.reload()
  await expect(page.locator('[data-weekday]')).toHaveText('Hoy cerrado, vuelva mañana')
  await expect(page.locator('[data-menu-price]')).toBeHidden()
})

test('la comanda en móvil suma, conserva y quita platos', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto(root + 'carta/')
  await page.getByRole('button', { name: 'Añadir Croquetas de jamón', exact: true }).click()
  await page.getByRole('button', { name: 'Añadir Pincho de tortilla', exact: true }).click()
  await expect(page.locator('[data-order-summary]')).toHaveText(/11,70/)
  await page.reload()
  await page.getByRole('button', { name: /Comanda 11,70/ }).click()
  await page.getByRole('button', { name: 'Quitar Pincho de tortilla de la comanda' }).click()
  await expect(page.locator('[data-order-total]')).toHaveText(/7,50/)
  await page.getByRole('button', { name: 'Pedir la cuenta' }).click()
  await expect(page.locator('[data-order-empty]')).toContainText('La cuenta está saldada')
  await expect(page.locator('[data-order-total]')).toHaveText(/0,00/)
})

test('la reserva rechaza el lunes y emite un ticket para el martes', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-21T12:00:00Z'))
  await page.goto(root + 'reservas/')
  await page.getByLabel('Nombre').fill('Ana')
  await page.getByLabel('Teléfono').fill('612345678')
  await page.getByLabel('Día', { exact: true }).fill('2026-11-23')
  await page.getByRole('combobox', { name: 'Hora', exact: true }).selectOption('13:30')
  await page.getByRole('button', { name: 'Reservar mesa' }).click()
  await expect(page.getByRole('alert')).toHaveText(/Los lunes cerramos/)
  await page.getByLabel('Día', { exact: true }).fill('2026-11-24')
  await page.getByRole('button', { name: 'Reservar mesa' }).click()
  await expect(page.locator('[data-confirmation]')).toContainText('Ana')
  await expect(page.locator('[data-confirmation]')).toContainText('13:30')
})

test('la vitrina carga las fotos y comparte los nombres con la carta', async ({ page }) => {
  const photos = [
    ['tapa-04', 'Pimientos de Padrón'],
    ['tapa-05', 'Bombas de la casa'],
    ['tapa-08', 'Pinchos de la vitrina'],
  ] as const

  await page.goto(root)
  const images = page.locator('.tapa img')
  await expect(images).toHaveCount(8)
  await expect.poll(() => images.evaluateAll(nodes => nodes.every(node =>
    node instanceof HTMLImageElement && node.loading === 'eager' && node.complete && node.naturalWidth > 0,
  ))).toBe(true)
  for (const [photo, dish] of photos) {
    await expect(page.getByAltText(dish, { exact: true })).toHaveAttribute('src', new RegExp(photo))
    await expect(page.locator('.tapa figcaption').getByText(dish, { exact: true })).toBeVisible()
  }

  await page.goto(root + 'carta/')
  for (const [, dish] of photos) {
    await expect(page.getByRole('button', { name: `Añadir ${dish}`, exact: true })).toBeVisible()
  }
})
