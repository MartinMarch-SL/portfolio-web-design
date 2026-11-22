import { readFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'

const base = '/portfolio-web-design/lia-ferro/'

test('lleva un flash al cuerpo, ajusta el tamaño y confirma una cita', async ({ page }) => {
  await page.goto(base + 'flash/')
  await page.getByRole('article').filter({ hasText: 'Umbral' }).getByRole('link', { name: 'Llevar al cuerpo' }).click()
  await expect(page).toHaveURL(/encargo\/\?flash=mandala$/)
  const next = page.getByRole('button', { name: 'Continuar' })
  await next.click()
  await expect(page.getByRole('status').filter({ hasText: 'Elige una zona' })).toBeVisible()
  await page.locator('.zone-list').getByRole('button', { name: 'Tobillo 7 cm' }).click()
  await expect(page.locator('.scan-label')).toContainText('Tobillo · 7 × 7 cm')
  await next.click()
  await expect(page.getByRole('combobox', { name: 'Flash', exact: true })).toHaveValue('mandala')
  await next.click()
  const size = page.getByLabel('Lado mayor (cm)')
  await size.fill('20')
  await expect(size).toHaveValue('7')
  await next.click()
  await expect(page.getByText('Rango estimado')).toBeVisible()
  await next.click()
  await page.locator('input[name=slot]:enabled').first().check()
  await page.getByLabel('Nombre').fill('Ada Ruiz')
  await page.getByLabel('Correo electrónico').fill('ada@example.com')
  await next.click()
  await expect(page.getByText('No se cobra nada.', { exact: false })).toBeVisible()
  await page.getByLabel('Tarjeta de prueba').fill('4242 4242 4242 4242')
  await page.getByRole('button', { name: 'Simular pago y reservar' }).click()
  const code = page.locator('[data-code]')
  await expect(code).toHaveText(/^LF-\d{4}-[A-Z0-9]{7}$/)
  const value = await code.textContent()
  const summary = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Descargar resumen' }).click()
  expect((await summary).suggestedFilename()).toBe(value + '.txt')
  await page.reload()
  await expect(code).toHaveText(value!)
})

test('descarga el calendario de curación', async ({ page }) => {
  await page.goto(base + 'cuidados/')
  await page.getByLabel('Fecha del tatuaje').fill('2026-12-29')
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Descargar calendario (.ics)' }).click()
  const file = await download
  expect(file.suggestedFilename()).toBe('lia-ferro-cuidados.ics')
  expect(await readFile((await file.path())!, 'utf8')).toContain('DTSTART;VALUE=DATE:20270127')
})

test('permite escoger zona desde la silueta sin WebGL', async ({ page }) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, options?: unknown) {
      return type.startsWith('webgl') ? null : Reflect.apply(getContext, this, [type, options])
    } as typeof getContext
  })
  await page.goto(base + 'encargo/')
  const fallback = page.locator('[data-fallback]')
  await expect(fallback).toBeVisible()
  await fallback.getByRole('button', { name: 'Espalda alta' }).click()
  await expect(fallback.getByRole('button', { name: 'Espalda alta' })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Continuar' }).click()
  await expect(page.getByRole('heading', { name: 'Diseño', exact: true })).toBeVisible()
})

test('dibuja el escáner WebGL y permite elegir una zona sobre el cuerpo', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(base + 'encargo/?flash=polilla')
  const scan = page.locator('[data-scan]')
  await expect(scan.locator('canvas')).toBeVisible()
  const biceps = scan.locator('[data-markers]').getByRole('button', { name: 'Bíceps' })
  await biceps.click()
  await expect(biceps).toHaveAttribute('aria-pressed', 'true')
  await expect(scan.locator('output')).toContainText('Bíceps · 10 × 10 cm')
  await page.getByRole('button', { name: 'Acercar' }).click()
  expect(errors).toEqual([])
})
