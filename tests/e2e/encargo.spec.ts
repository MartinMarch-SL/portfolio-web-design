import { readFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'

const base = '/portfolio-web-design/'

test('completes and restores the brief, then downloads it and offers email delivery', async ({ page }) => {
  await page.goto(base)
  await page.getByRole('link', { name: 'Encargo', exact: true }).click()
  await expect(page).toHaveURL(base + 'encargo/')
  await expect(page.locator('[data-flat]')).toHaveAttribute('role', 'img')
  const next = page.getByRole('button', { name: 'Siguiente' })
  await page.getByRole('textbox', { name: /Nombre del negocio/ }).fill('Taller Ébano')
  await page.getByRole('radio', { name: 'Cultura y diseño' }).check()
  await page.getByRole('radio', { name: 'Ventas' }).check()
  await next.click()
  await page.getByRole('radio', { name: 'A diseñar' }).check()
  await page.getByRole('textbox', { name: 'Referencias visuales o enlaces' }).fill('Cuadernos de taller')
  await page.getByRole('button', { name: 'Atrás' }).click()
  await expect(page.getByRole('textbox', { name: /Nombre del negocio/ })).toHaveValue('Taller Ébano')
  await next.click()
  await expect(page.getByRole('radio', { name: 'A diseñar' })).toBeChecked()
  await page.reload()
  await expect(page.getByRole('textbox', { name: 'Referencias visuales o enlaces' })).toHaveValue('Cuadernos de taller')
  await next.click()
  await page.getByRole('radio', { name: 'Arcilla' }).check()
  await page.getByRole('radio', { name: 'Oscuro' }).check()
  await page.getByRole('radio', { name: 'Madera' }).check()
  await next.click()
  await expect(page.locator('[data-business-name]').first()).toHaveText('Taller Ébano')
  await page.getByRole('radio', { name: /^De autor/ }).check()
  await next.click()
  await page.getByRole('checkbox', { name: 'Inicio', exact: true }).check()
  await page.getByRole('checkbox', { name: 'Tienda', exact: true }).check()
  await page.getByRole('checkbox', { name: /^Plano vivo/ }).check()
  await page.getByRole('checkbox', { name: /^Mesa de luz/ }).check()
  await expect(page.getByRole('checkbox', { name: /^Anamorfosis/ })).toBeDisabled()
  await next.click()
  await page.getByRole('radio', { name: 'Propias' }).check()
  await page.getByRole('checkbox', { name: 'Español' }).check()
  await page.getByRole('textbox', { name: /Email/ }).fill('contacto@example.com')
  await page.getByRole('button', { name: 'Ver mi encargo' }).click()
  await expect(page.getByRole('heading', { name: 'Tu encargo' })).toBeVisible()
  await expect(page.locator('[data-prompt]')).toContainText('Taller Ébano')
  await expect(page.locator('[data-prompt]')).toContainText('Mesa de luz')
  await expect(page.getByRole('link', { name: 'Escribir por email' })).toHaveAttribute('href', /^mailto:.+subject=/)
  const downloaded = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Enviar al estudio' }).click()
  const file = await downloaded
  expect(file.suggestedFilename()).toMatch(/^\d{4}-\d\d-\d\d-taller-ebano\.md$/)
  expect(await readFile((await file.path())!, 'utf8')).toContain('Taller Ébano')
  await page.reload()
  await expect(page.locator('[data-prompt]')).toContainText('Taller Ébano')
})

test('draws a live 2D fallback when WebGL is unavailable', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      value(this: HTMLCanvasElement, kind: string, options?: object) {
        if (/webgl/i.test(kind)) return null
        return Reflect.apply(getContext, this, [kind, options])
      },
    })
  })
  await page.goto(base + 'encargo/')
  const desktop = page.locator('canvas[data-desktop]')
  await expect(desktop).toBeVisible()
  await expect(page.locator('[data-scene]')).toBeHidden()
  const before = await desktop.evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL())
  await page.getByRole('textbox', { name: /Nombre del negocio/ }).fill('Librería de Piedra')
  await expect(page.getByRole('complementary', { name: /Maqueta viva de Librería de Piedra/ })).toBeVisible()
  expect(await desktop.evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL())).not.toBe(before)
})
