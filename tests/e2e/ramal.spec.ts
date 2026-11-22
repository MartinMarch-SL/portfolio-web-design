import { readFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'

const base = '/portfolio-web-design/ramal/'

test('valida y restaura la solicitud y descarga un justificante local', async ({ page }) => {
  await page.goto(base + 'oferta/')
  await expect(page.getByText('Demostración: no se envía ningún dato')).toBeVisible()
  await page.getByRole('button', { name: 'Continuar' }).click()
  await expect(page.getByText('Selecciona el tipo de obra.')).toBeVisible()
  await page.getByLabel('Tipo de obra').selectOption('logistica')
  await page.getByLabel('Ubicación').fill('Zuera')
  await page.getByLabel('Superficie (m²)').fill('8200')
  await page.getByLabel('Fase', { exact: true }).selectOption('Licitación')
  await page.getByLabel('Electricidad', { exact: true }).check()
  await page.getByLabel('Protección contra incendios').check()
  await expect(page.locator('[data-estimate]')).toHaveText(/\d+–\d+ semanas · \d+ técnicos/)
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.getByLabel('Mediciones o pliego (opcional)').setInputFiles({
    name: 'mediciones.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('CONTENIDO-PRIVADO'),
  })
  await expect(page.getByText('mediciones.csv · 17 B')).toBeVisible()
  const draft = await page.evaluate(() => JSON.parse(localStorage.getItem('ramal-oferta-v1')!))
  expect(draft.files).toEqual([{ name: 'mediciones.csv', size: 17 }])
  expect(JSON.stringify(draft)).not.toContain('CONTENIDO-PRIVADO')

  await page.reload()
  await expect(page.getByRole('heading', { name: 'Documentación' })).toBeVisible()
  await expect(page.getByText('mediciones.csv · 17 B')).toBeVisible()
  await expect(page.getByLabel('Mediciones o pliego (opcional)')).toHaveValue('')
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.getByLabel('Empresa', { exact: true }).fill('Contratas de Prueba')
  await page.getByLabel('CIF o NIF').fill('12345678X')
  await page.getByLabel('Persona de contacto').fill('Contacto de obra')
  await page.getByLabel('Cargo').fill('Jefatura de obra')
  await page.getByLabel('Correo electrónico').fill('oficina@obra.example')
  await page.getByLabel('Teléfono').fill('+34 976 123 456')
  await page.getByLabel('Plazo de respuesta deseado').selectOption('5 días laborables')
  await page.getByRole('button', { name: 'Ver resumen' }).click()
  await expect(page.getByText('Introduce un CIF o NIF válido.')).toBeVisible()
  await page.getByLabel('CIF o NIF').fill('12345678Z')
  await page.getByRole('button', { name: 'Ver resumen' }).click()
  await expect(page.getByRole('heading', { name: 'Resumen de solicitud' })).toBeVisible()
  await expect(page.getByText('mediciones.csv (17 B)')).toBeVisible()
  const reference = page.locator('[data-reference]')
  await expect(reference).toHaveText(/^RML-OF-26-[A-Z0-9]{4}$/)
  const code = await reference.innerText()
  await page.reload()
  await expect(reference).toHaveText(code)

  const receipt = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Descargar justificante' }).click()
  const download = await receipt
  expect(download.suggestedFilename()).toBe(code + '.html')
  const html = await readFile(await download.path(), 'utf8')
  expect(html).toContain('Demostración: no se envía ningún dato')
  expect(html).toContain('mediciones.csv (17 B)')
  expect(html).not.toContain('CONTENIDO-PRIVADO')

  await page.getByRole('button', { name: 'Restablecer solicitud' }).click()
  await expect(page.getByRole('heading', { name: 'Proyecto' })).toBeVisible()
  await expect(page.getByLabel('Ubicación')).toHaveValue('')
  await page.reload()
  await expect(page.getByLabel('Tipo de obra')).toHaveValue('')
})

test('descarga un dossier HTML con portada, capacidades y obras', async ({ page }) => {
  await page.goto(base + 'empresa/')
  const pending = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Descargar dossier' }).click()
  const download = await pending
  expect(download.suggestedFilename()).toBe('RAMAL-dossier.html')
  const html = await readFile(await download.path(), 'utf8')
  for (const value of ['DOSSIER DE EMPRESA', 'Datos de empresa', 'Capacidades', 'ISO 45001', 'Plataforma Soto Norte', 'ofertas@ramal.example', '@media print']) {
    expect(html).toContain(value)
  }
})

test('aísla las capas del modelo y muestra sus cotas', async ({ page, reducedMotion }) => {
  await page.goto(base)
  const model = page.locator('[data-model]')
  await expect(model).toHaveAttribute('data-spread', /./)
  if (reducedMotion === 'reduce') {
    await expect(model.locator('svg[data-fallback]')).toBeVisible()
    await expect(model.locator('canvas')).toBeHidden()
    await expect(model).toHaveAttribute('data-spread', '1')
  }
  await model.getByRole('button', { name: 'Incendios' }).click()
  await expect(model.getByRole('button', { name: 'Incendios' })).toHaveAttribute('aria-pressed', 'true')
  await expect(model.locator('[data-dimension]')).toHaveText('PCI-03 · DN 80 / DN 25')
  await expect(model.locator('[data-layer="clima"]')).toHaveClass('isolated-out')
})

test('despieza el modelo y recorre las obras durante el scroll', async ({ page, reducedMotion }) => {
  test.skip(reducedMotion === 'reduce', 'El despiece es estático y las obras se apilan')
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(base)
  await page.evaluate(() => document.fonts.ready)

  const scene = page.locator('[data-model-scene]')
  const model = scene.locator('[data-model]')
  await expect(model).toHaveAttribute('data-spread', '0')
  async function scrollModel(progress: number) {
    await scene.evaluate((element, progress) => {
      const distance = element.getBoundingClientRect().height - element.firstElementChild!.getBoundingClientRect().height
      window.scrollTo({ top: progress * distance, behavior: 'instant' })
    }, progress)
  }
  await scrollModel(.66)
  await expect.poll(async () => Number(await model.getAttribute('data-spread'))).toBeGreaterThan(.95)
  await scrollModel(1.05)
  await expect(model).toHaveAttribute('data-spread', '0')

  const projects = page.locator('[data-project-scene]')
  await expect(projects).toHaveAttribute('data-rail-active', '')
  await projects.evaluate(element => {
    const pin = element.firstElementChild as HTMLElement
    const start = window.scrollY + element.getBoundingClientRect().top - parseFloat(getComputedStyle(pin).top)
    window.scrollTo({ top: start + (element.getBoundingClientRect().height - pin.offsetHeight) * .75, behavior: 'instant' })
  })
  const track = projects.locator('[data-project-track]')
  await expect.poll(() => track.evaluate(element => new DOMMatrix(getComputedStyle(element).transform).m41)).toBeLessThan(-500)
})
