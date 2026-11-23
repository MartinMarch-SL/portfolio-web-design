import { readFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'

const route = '/portfolio-web-design/halda/'

test('HALDA validates, previews local images, restores metadata and downloads a printable receipt', async ({ page }) => {
  await page.goto(route + 'contacto/')
  await page.getByRole('button', { name: 'Continuar' }).click()
  await expect(page.getByLabel('Tipo de problema')).toBeFocused()
  await expect(page.getByText('Selecciona el tipo de problema.')).toBeVisible()
  await page.getByLabel('Tipo de problema').selectOption('inspection')
  await page.getByLabel('Sector', { exact: true }).selectOption('Automoción Tier 1')
  await page.getByLabel('Cadencia (piezas/min)').fill('148')
  await page.getByLabel('Defecto mínimo (mm)').fill('0.2')
  await page.getByLabel('Ancho de pieza (mm)').fill('100')
  await page.getByLabel('Alto de pieza (mm)').fill('70')
  await page.getByLabel('Entorno (polvo, temperatura, vibración)').fill('Polvo y vibración de la cinta')
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.getByLabel('Imágenes de ejemplo (opcional)').setInputFiles({
    name: 'muestra.png', mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=', 'base64'),
  })
  await expect(page.getByAltText('Vista previa de muestra.png')).toHaveAttribute('src', /^blob:/)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Datos disponibles' })).toBeVisible()
  await expect(page.getByText(/muestra\.png.*Metadatos guardados/)).toBeVisible()
  await expect(page.getByAltText('Vista previa de muestra.png')).toHaveCount(0)
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.getByRole('button', { name: 'Ver resumen' }).click()
  await expect(page.getByLabel('Nombre y apellidos')).toBeFocused()
  await page.getByLabel('Nombre y apellidos').fill('Ane Prueba')
  await page.getByLabel('Empresa', { exact: true }).fill('Taller <Piloto>')
  await page.getByLabel('Correo profesional').fill('ane@example.com')
  await page.getByRole('button', { name: 'Ver resumen' }).click()
  await expect(page.getByRole('heading', { name: /Resumen y estimación/ })).toBeVisible()
  await expect(page.getByText('Inspección · 6 semanas')).toBeVisible()
  await expect(page.getByText('115 × 80,5 mm')).toBeVisible()
  const code = await page.locator('[data-reference]').textContent()
  expect(code).toMatch(/^HLD-26-[0-9A-Z]{4}$/)
  await page.reload()
  await expect(page.locator('[data-reference]')).toHaveText(code!)
  const downloaded = page.waitForEvent('download')
  await page.getByRole('button', { name: /Descargar justificante/ }).click()
  const receipt = await downloaded
  expect(receipt.suggestedFilename()).toBe(code + '.html')
  const html = await readFile((await receipt.path())!, 'utf8')
  expect(html).toContain('No se envía ninguna solicitud')
  expect(html).toContain('Taller &lt;Piloto&gt;')
  expect(html).toContain('muestra.png')
  expect(html).not.toContain('blob:')
  await page.getByRole('button', { name: 'Borrar borrador' }).click()
  await expect(page.getByLabel('Tipo de problema')).toHaveValue('')
})

test('HALDA switches all six case scenes and links to each selected case', async ({ page }) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      value(this: HTMLCanvasElement, type: string, ...args: unknown[]) {
        return type.startsWith('webgl') ? null : Reflect.apply(getContext, this, [type, ...args])
      },
    })
  })
  await page.goto(route)
  const selector = page.locator('[data-selector]')
  for (const [scene, slug] of [
    ['bin', 'bin-picking'], ['pcb', 'aoi-placas'], ['laser', 'metrologia-3d'], ['dpm', 'trazabilidad-dpm'],
    ['edge', 'hardware-edge'], ['surface', 'inspeccion-superficial'],
  ]) {
    const button = selector.locator('[data-case="' + scene + '"]')
    await button.click()
    await expect(button).toHaveAttribute('aria-pressed', 'true')
    await expect(selector.locator('[aria-pressed="true"]')).toHaveCount(1)
    const stage = selector.locator('[data-scene="' + scene + '"]')
    await expect(stage.locator('canvas')).toBeHidden()
    await expect(stage.locator('img')).toBeVisible()
    await expect(stage.locator('img')).toHaveAttribute('src', new RegExp('/' + scene + '\\.webp$'))
    await expect.poll(() => stage.locator('img').evaluate(img => (img as HTMLImageElement).naturalWidth)).toBe(1200)
    await expect(selector.getByRole('link', { name: /Ver ficha/ })).toHaveAttribute('href', route + 'casos/' + slug + '/')
  }
})

test.use({ launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } })

test('HALDA keeps rendered pixels in the station and all six use cases', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(route)
  const hero = page.locator('[data-scene="hero"]')
  const stage = page.locator('[data-selector] [data-stage]')

  async function expectPixels(canvas: ReturnType<typeof page.locator>) {
    await expect(canvas).toBeVisible()
    await expect.poll(() => canvas.evaluate((element: HTMLCanvasElement) => {
      const { width, height } = element
      const ctx = element.getContext('2d')!
      // Sample the model area, excluding the surrounding reticles and DOM labels.
      let lit = 0
      for (let y = 1; y < 12; y++) {
        for (let x = 1; x < 16; x++) {
          const pixel = ctx.getImageData(Math.floor(x * width / 16), Math.floor(y * height / 12), 1, 1).data
          if (Math.max(pixel[0], pixel[1], pixel[2]) > 45) lit++
        }
      }
      return lit
    })).toBeGreaterThan(5)
  }

  await expectPixels(hero.locator('canvas'))
  await stage.scrollIntoViewIfNeeded()
  await expectPixels(stage.locator('canvas'))
  for (const scene of ['bin', 'pcb', 'laser', 'dpm', 'edge', 'surface']) {
    await page.locator(`[data-case="${scene}"]`).click()
    await expect(stage).toHaveAttribute('data-scene', scene)
    await stage.scrollIntoViewIfNeeded()
    await expectPixels(stage.locator('canvas'))
  }
  await hero.scrollIntoViewIfNeeded()
  await expectPixels(hero.locator('canvas'))
})
