import { expect, test, type Page } from '@playwright/test'

const home = '/portfolio-web-design/ruido/'

async function addRonda(page: Page) {
  await page.goto(`${home}producto/ronda/`)
  const add = page.getByRole('button', { name: /Añadir al carrito/i })
  await expect(add).toBeDisabled()
  await expect(page.getByRole('button', { name: 'M', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: 'S', exact: true }).click()
  await add.click()
}

test('filters the shop by category', async ({ page }) => {
  await page.goto(`${home}tienda/`)
  await page.getByRole('button', { name: 'Sudaderas', exact: true }).click()
  await expect(page.locator('[data-shop-grid] [data-category]:visible')).toHaveCount(3)
  await expect(page.locator('[data-shop-grid] [data-category="sudaderas"]:visible')).toHaveCount(3)
})

test('requires an available size, then persists the cart', async ({ page }) => {
  await addRonda(page)
  await expect(page.locator('[data-cart-count]')).toHaveText('1')
  await page.reload()
  await expect(page.getByRole('button', { name: /Carrito/i }).locator('[data-cart-count]')).toHaveText('1')
})

test('checks out locally, confirms the order number and empties the cart', async ({ page }) => {
  await addRonda(page)
  await page.getByRole('link', { name: 'Finalizar compra' }).click()
  await page.getByLabel('Nombre completo').fill('Cliente de prueba')
  await page.getByLabel('Correo electrónico').fill('prueba@example.com')
  await page.getByLabel('Dirección').fill('Carrer de la Riera, 15')
  await page.getByLabel('Código postal').fill('08001')
  await page.getByLabel('Ciudad').fill('Barcelona')

  const requests: string[] = []
  page.on('request', request => requests.push(request.url()))
  await page.getByRole('button', { name: 'Confirmar pedido' }).click()
  await expect(page.locator('[data-order-number]')).toHaveText(/^RD-\d{6}$/)
  await expect(page.locator('[data-cart-count]')).toHaveText('0')
  expect(requests).toEqual([])
  await page.reload()
  await expect(page.getByRole('link', { name: 'Volver a la tienda' })).toBeVisible()
})

test('links back to the shop when checkout is empty', async ({ page }) => {
  await page.goto(`${home}checkout/`)
  await expect(page.getByRole('link', { name: 'Volver a la tienda' })).toHaveAttribute('href', `${home}tienda/`)
})
