import { readFile } from 'node:fs/promises'
import { expect, test, type Page } from '@playwright/test'

const base = '/portfolio-web-design/los-almendros/'

const dateFields = (page: Page) => [
  page.getByLabel('Año', { exact: true }),
  page.getByRole('combobox', { name: 'Mes', exact: true }),
  page.getByRole('combobox', { name: 'Día', exact: true }),
] as const

async function fillBirthDate(page: Page, date: string) {
  const [year, month, day] = date.split('-')
  const [yearField, monthField, dayField] = dateFields(page)
  await yearField.fill(year)
  await monthField.selectOption(month)
  await dayField.selectOption(day)
}

async function expectBirthDate(page: Page, date: string) {
  const values = date ? date.split('-') : ['', '', '']
  for (const [index, field] of dateFields(page).entries()) {
    await expect(field).toHaveValue(values[index])
  }
}

test('preinscribe desde el selector, restaura la ficha y descarga el justificante', async ({ page }) => {
  await page.goto(base)
  await page.getByLabel('Año de nacimiento').selectOption('2016')
  await expect(page.locator('output')).toHaveText('Alevín')
  await expect(page.locator('[data-quick-details]')).toContainText(/\d{2}:\d{2}.*280,00/)
  await page.getByRole('button', { name: 'Empezar preinscripción' }).click()
  const next = page.getByRole('button', { name: 'Continuar' })
  await expectBirthDate(page, '2016-01-01')
  await next.click()
  await expect(page.getByText('Confirma el día y el mes de nacimiento.')).toBeVisible()
  await fillBirthDate(page, '2016-02-29')
  await page.getByLabel('Sexo (opcional)').selectOption('si')
  await expect(page.locator('[data-category]')).toContainText(/Alevín femenino.*18:15.*280,00/)
  await next.click()
  await next.click()
  await expect(page.getByText('Escribe los apellidos.')).toBeVisible()
  await page.getByLabel('Nombre', { exact: true }).fill('Ada <Ruiz>')
  await page.getByLabel('Apellidos', { exact: true }).fill('García')
  await page.getByLabel('DNI o NIE (opcional)').fill('12345678A')
  await page.getByLabel('Centro educativo').fill('CEIP El Vivero')
  await page.getByLabel('Talla de equipación').selectOption('12')
  await page.getByLabel('¿Ha jugado antes?').selectOption('si')
  await page.getByLabel('¿Ya ha estado inscrito en el club?').selectOption('no')
  await page.getByLabel(/Es el segundo hermano/).check()
  await expect(page.locator('[data-ficha-player]')).toHaveText('Ada <Ruiz> García')
  await expect(page.locator('[data-ficha-fees] dd').last()).toContainText('292,00')
  await next.click()
  await expect(page.getByText('Comprueba el número y la letra del DNI o NIE.')).toBeVisible()
  await page.getByLabel('DNI o NIE (opcional)').fill('12345678Z')
  await page.reload()
  await expect(page.getByLabel('Nombre', { exact: true })).toHaveValue('Ada <Ruiz>')
  await expect(page.getByLabel(/Es el segundo hermano/)).toBeChecked()
  await page.getByRole('button', { name: 'Volver', exact: true }).click()
  await expectBirthDate(page, '2016-02-29')
  await next.click()
  await expect(page.getByLabel('Centro educativo')).toHaveValue('CEIP El Vivero')
  await next.click()
  const review = page.getByRole('button', { name: 'Ver resumen' })
  await review.click()
  await expect(page.getByText('Confirma la autorización médica.')).toBeVisible()
  await page.getByLabel('Nombre y apellidos del tutor o tutora').fill('Luis García')
  await page.getByLabel('Teléfono').fill('123')
  await page.getByLabel('Correo electrónico').fill('sin-arroba')
  await expect(page.getByText('Introduce un teléfono español válido.')).toBeVisible()
  await expect(page.getByText('Introduce un correo electrónico válido.')).toBeVisible()
  await page.getByLabel('Teléfono').fill('+34 612 345 678')
  await page.getByLabel('Correo electrónico').fill('luis@example.com')
  await page.getByLabel(/Autorizo al club a solicitar/).check()
  await page.getByLabel(/Autorizas al club a publicar/).selectOption('no')
  await page.getByLabel(/He leído cómo se guardan/).check()
  await review.click()
  await expect(page.getByText('Demostración: no se envía ningún dato')).toBeVisible()
  await expect(page.locator('[data-enrollment]')).toContainText('40,00')
  await expect(page.locator('[data-discount]')).toContainText('-28,00')
  await expect(page.locator('[data-total]')).toContainText('292,00')
  await page.getByLabel('Forma de pago').selectOption('3')
  await expect(page.locator('[data-payments] li')).toHaveText([/97,34/, /97,33/, /97,33/])
  const code = page.locator('[data-code]')
  await expect(code).toHaveText(/^ALM-26-[A-Z0-9]{5}$/)
  const value = await code.textContent()
  await page.reload()
  await expect(code).toHaveText(value!)
  await expect(page.getByLabel('Forma de pago')).toHaveValue('3')
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Descargar justificante' }).click()
  const file = await download
  expect(file.suggestedFilename()).toBe(value + '.html')
  const html = await readFile((await file.path())!, 'utf8')
  expect(html).toContain('Ada &lt;Ruiz&gt; García')
  expect(html).toContain('292,00')
  expect(html).toContain('<svg')
  await page.getByRole('button', { name: 'Empezar de nuevo' }).click()
  await expectBirthDate(page, '')
  await page.reload()
  await expectBirthDate(page, '')
})

test('mantiene el balón y el formulario utilizables sin WebGL ni almacenamiento', async ({ page }) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, options?: unknown) {
      return type.startsWith('webgl') ? null : Reflect.apply(getContext, this, [type, options])
    } as typeof getContext
    Object.defineProperty(window, 'localStorage', { get: () => { throw new Error('Almacenamiento deshabilitado') } })
  })
  await page.goto(base)
  await expect(page.locator('[data-ball] img')).toBeVisible()
  await page.getByRole('link', { name: 'Preinscripción 2026/27' }).click()
  await fillBirthDate(page, '2014-06-20')
  await page.getByRole('button', { name: 'Continuar' }).click()
  await expect(page.getByRole('heading', { name: 'Jugador o jugadora' })).toBeVisible()
})

test('dibuja el balón y sirve todas las noticias y sus imágenes', async ({ page, request }) => {
  await page.goto(base)
  await expect(page.locator('[data-ball] canvas')).toBeVisible()
  await page.getByRole('link', { name: 'Todas las noticias' }).click()
  const stories = page.locator('.story')
  await expect(stories).toHaveCount(6)
  for (const story of await stories.all()) {
    expect((await request.get((await story.getAttribute('href'))!)).ok()).toBe(true)
    expect((await request.get((await story.locator('img').getAttribute('src'))!)).ok()).toBe(true)
  }
})

test('el menú móvil conserva el foco y se cierra con Escape', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto(base)
  const header = page.locator('header.mast')
  const open = header.getByRole('button', { name: 'Menú', exact: true })
  await expect(header.getByRole('link', { name: 'Preinscripción' })).toBeVisible()
  await open.click()
  const menu = page.getByRole('dialog', { name: 'Menú principal' })
  const close = menu.getByRole('button', { name: 'Cerrar menú' })
  await expect(close).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(menu.getByRole('link', { name: 'Preinscripción' })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(close).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(menu).toBeHidden()
  await expect(open).toBeFocused()
})
