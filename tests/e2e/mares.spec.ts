import { expect, test } from '@playwright/test'

const base = '/portfolio-web-design/mares/'
const detail = base + 'propiedades/patio-de-sant-jaume/'

test('los filtros guardan la URL y actualizan listado y mapa', async ({ page }) => {
  await page.goto(base + 'propiedades/')
  await page.getByLabel('Operación').selectOption('alquiler')
  await page.getByLabel('Barrio').selectOption('santa-catalina')
  await expect(page).toHaveURL(/operacion=alquiler&barrio=santa-catalina/)
  await expect(page.locator('[data-count]')).toHaveText('1 vivienda')
  await expect(page.getByRole('heading', { name: 'Casa del Mercat' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Ático del Molinar' })).toBeHidden()
  await page.getByRole('button', { name: 'Mapa', exact: true }).click()
  await expect(page).toHaveURL(/vista=mapa/)
  await page.reload()
  await expect(page.getByRole('button', { name: 'Mapa', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('[data-map-results] svg [data-pin]:visible')).toHaveCount(1)
})

test('la galería admite teclado y restaura el foco al cerrar con Esc', async ({ page }) => {
  await page.goto(detail)
  const opener = page.getByRole('button', { name: 'Ampliar imagen 1' })
  await opener.click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Shift+Tab')
  await expect(dialog.getByRole('button', { name: 'Imagen siguiente' })).toBeFocused()
  await page.keyboard.press('ArrowRight')
  await expect(dialog.locator('[data-frame-count]')).toHaveText('2 / 3')
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(opener).toBeFocused()
})

test('la cuota cambia al editar el interés y el plazo', async ({ page }) => {
  await page.goto(detail)
  const output = page.locator('[data-payment]')
  const initial = await output.textContent()
  await page.getByLabel('Interés anual (%)').fill('0')
  await expect(output).not.toHaveText(initial!)
  await page.getByLabel('Plazo (años)').fill('20')
  await expect(output).toHaveText('2.283 €/mes')
})

test('el valorador mantiene los datos de los pasos y muestra una horquilla', async ({ page }) => {
  await page.goto(base + 'vender/')
  await page.getByLabel('Barrio').selectOption('genova')
  await page.getByRole('button', { name: /Continuar/ }).click()
  await page.getByLabel('Superficie construida (m²)').fill('100')
  await page.getByRole('button', { name: /Continuar/ }).click()
  await page.getByRole('button', { name: /Calcular valoración/ }).click()
  await expect(page.locator('[data-range]')).toHaveText('520.800 € – 599.200 €')
  await expect(page.getByRole('button', { name: /Pedir una valoración personalizada/ })).toBeVisible()
})

test('los scripts se inicializan al navegar con ClientRouter y al volver', async ({ page }) => {
  await page.goto(base)
  await page.evaluate(() => Object.defineProperty(window, 'maresTestNavigation', { value: 'persistente' }))
  await page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Propiedades' }).click()
  await expect(page).toHaveURL(base + 'propiedades/')
  expect(await page.evaluate(() => Reflect.get(window, 'maresTestNavigation'))).toBe('persistente')
  await page.getByLabel('Barrio').selectOption('casco-antiguo')
  await expect(page.locator('[data-count]')).toHaveText('1 vivienda')
  await page.getByRole('link', { name: /Patio de Sant Jaume/ }).click()
  await page.getByRole('button', { name: 'Ampliar imagen 1' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await page.goBack()
  await expect(page.locator('[data-count]')).toHaveText('1 vivienda')
})

test('las fotos de la selección se descubren al entrar en pantalla', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'La cortinilla requiere animaciones')
  for (const width of [1440, 375]) {
    await page.setViewportSize({ width, height: 820 })
    await page.goto(base)
    const photo = page.locator('.stack-card .photo').first()
    await expect(photo).toHaveClass(/armed/)
    await photo.scrollIntoViewIfNeeded()
    await page.waitForTimeout(1500)
    expect(await photo.evaluate(element => {
      const img = element.querySelector('img')!
      const shutter = element.querySelector('.shutter')
      return img.complete && img.naturalWidth > 0 && (!shutter || getComputedStyle(shutter).opacity === '0')
    })).toBe(true)
  }
})

test('los filtros móviles aplican cambios al confirmar y devuelven el foco', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto(base + 'propiedades/')
  const opener = page.getByRole('button', { name: 'Filtros (0)' })
  await expect(page.getByLabel('Operación')).toBeHidden()
  await opener.click()
  const sheet = page.getByRole('dialog', { name: 'Filtros' })
  await sheet.getByLabel('Operación').selectOption('alquiler')
  await expect(page).not.toHaveURL(/operacion=/)
  await page.keyboard.press('Escape')
  await expect(opener).toBeFocused()
  await opener.click()
  await expect(sheet.getByLabel('Operación')).toHaveValue('')
  await sheet.getByLabel('Operación').selectOption('alquiler')
  await sheet.getByLabel('Barrio').selectOption('santa-catalina')
  await sheet.getByRole('button', { name: 'Aplicar' }).click()
  await expect(page.getByRole('button', { name: 'Filtros (2)' })).toBeFocused()
  await expect(page.locator('[data-count]')).toHaveText('1 vivienda')
  await page.getByRole('button', { name: 'Filtros (2)' }).click()
  await sheet.getByRole('button', { name: 'Limpiar' }).click()
  await expect(opener).toBeFocused()
  await expect(page).not.toHaveURL(/operacion=|barrio=/)
})
