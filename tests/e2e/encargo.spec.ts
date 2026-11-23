import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test, type Page } from '@playwright/test'
import sharp from 'sharp'

const base = '/portfolio-web-design/'
const endpoint = 'https://script.google.com/macros/s/**'
const next = (page: Page) => page.getByRole('button', { name: 'Siguiente' }).click()
const choose = (page: Page, name: string | RegExp) => page.getByRole('radio', { name }).check()
const heading = (page: Page, name: string) => expect(page.getByRole('heading', { name, exact: true })).toBeVisible()

async function start(page: Page, type: 1 | 3, query = '?demo=1') {
  await page.goto(base + 'encargo/' + query)
  await choose(page, type === 1 ? /Escaparate/ : /Con funcionalidades/)
  await next(page)
  await page.getByRole('textbox', { name: /Nombre del negocio/ }).fill('Taller Ébano')
  await choose(page, 'Cultura')
  await choose(page, 'Contacto')
  await page.getByRole('checkbox', { name: 'Público local' }).check()
  await next(page)
  await choose(page, 'Oscuro')
  await choose(page, 'Arcilla')
  await choose(page, /Editorial/)
  await next(page)
  await page.getByRole('checkbox', { name: 'Inicio', exact: true }).check()
  await page.getByRole('textbox', { name: 'Secciones de Inicio' }).fill('Bienvenida y equipo')
  await next(page)
  await heading(page, 'Tu contenido')
}

async function finish(page: Page) {
  await heading(page, 'Logística')
  await page.getByRole('checkbox', { name: 'Español' }).check()
  await page.getByRole('textbox', { name: /Correo electrónico/ }).fill('contacto@example.com')
  await page.getByRole('button', { name: 'Completar partida' }).click()
  await heading(page, 'Partida completada')
}

async function fixtureFolder(path: string, mixed = false) {
  await mkdir(path, { recursive: true })
  const png = await sharp({ create: { width: 8, height: 6, channels: 3, background: '#342b21' } }).png().toBuffer()
  await Promise.all(['Café de otoño.png', 'Sala.png'].map(name => writeFile(join(path, name), png)))
  if (mixed) {
    await Promise.all([
      writeFile(join(path, 'sin-vista.heic'), 'fixture HEIC'),
      writeFile(join(path, 'carta.pdf'), '%PDF-1.4'),
      writeFile(join(path, '.DS_Store'), 'metadata'),
    ])
  }
  return png
}

test('tipo 1: ramas, mapa, brief, descarga y envío de prueba a 375 px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await start(page, 1)
  await expect(page.getByRole('button', { name: /Nivel [56]/ })).toHaveCount(0)
  await page.getByRole('textbox', { name: 'Titular de Inicio' }).fill('Hecho a mano')
  await page.getByRole('checkbox', { name: 'Texto principal de Inicio: lo escribís vosotros' }).check()
  await expect(page.getByRole('textbox', { name: 'Texto principal de Inicio', exact: true })).toBeDisabled()
  await next(page)
  await finish(page)
  await expect(page.locator('[data-specs]')).toContainText('2 textos · 0 imágenes')
  await page.getByRole('button', { name: /Nivel 4/ }).click()
  await page.reload()
  await expect(page.getByRole('textbox', { name: 'Titular de Inicio' })).toHaveValue('Hecho a mano')
  await page.getByRole('button', { name: /Nivel 8/ }).click()
  await page.getByText('Brief para crear la web', { exact: true }).click()
  await expect(page.locator('[data-prompt]')).toContainText('Lo escribe el estudio')
  const downloaded = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Descargar .md' }).click()
  const file = await downloaded
  expect(file.suggestedFilename()).toMatch(/taller-ebano\.md$/)
  expect(await readFile((await file.path())!, 'utf8')).toContain('Hecho a mano')
  await page.getByRole('button', { name: 'Enviar al estudio' }).click()
  await expect(page.locator('[data-delivery-status]')).toHaveText('Envío de prueba completado.')
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375)
})

test('tipo 3: carpeta mixta, recuperación, cambios en los adjuntos y envío de prueba a 1440 px', async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  const directory = join(await mkdtemp(join(tmpdir(), 'encargo-')), 'fotos')
  await fixtureFolder(directory, true)
  await start(page, 3)
  await page.getByLabel('Carpeta de imágenes de Inicio').setInputFiles(directory)
  const notice = page.locator('[data-file-notice]')
  await expect(notice).toContainText('omitido los archivos que no son imágenes')
  await expect(notice).toContainText('HEIC')
  await expect(page.locator('.files img')).toHaveCount(2)
  await expect(page.locator('[data-content] .files')).not.toContainText(/carta\.pdf|DS_Store/)
  await page.getByRole('textbox', { name: 'Pie de foto de Café de otoño.png' }).fill('Entrada del taller')
  await page.reload()
  await expect(page.getByRole('textbox', { name: 'Pie de foto de Café de otoño.png' })).toHaveValue('Entrada del taller')
  await expect(page.locator('.files img')).toHaveCount(2)
  await page.getByRole('button', { name: 'Quitar · sin-vista.heic' }).click()
  const photos = page.locator('[data-content] .files li')
  const second = await photos.nth(1).locator('strong').textContent()
  await page.getByRole('button', { name: `Subir posición · ${second}` }).click()
  await expect(photos.first()).toContainText(second!)
  await page.getByLabel('Logo').setInputFiles(join(directory, 'Sala.png'))
  await expect(page.locator('[data-extra-files]')).toContainText('Sala.png')
  await page.getByLabel('Documentos PDF').setInputFiles(join(directory, 'carta.pdf'))
  await expect(page.locator('[data-extra-files]')).toContainText('carta.pdf')
  await next(page)
  await heading(page, 'Lo que podrás editar')
  await page.getByRole('checkbox', { name: 'Galerías u obras' }).check()
  await page.getByRole('spinbutton', { name: 'Número de administradores' }).fill('2')
  await next(page)
  await heading(page, 'Funcionalidades')
  await expect(page.getByRole('textbox', { name: 'Tipos de usuario y roles' })).toBeHidden()
  await page.getByRole('checkbox', { name: 'Reservas', exact: true }).check()
  await page.getByRole('textbox', { name: 'Cuéntanos cómo funciona' }).fill('Reservas por turnos')
  await next(page)
  await finish(page)
  await expect(page.locator('[data-prompt]')).toContainText('Reservas por turnos')
  await expect(page.locator('[data-prompt]')).toContainText('Entrada del taller')
  await page.getByRole('button', { name: 'Enviar al estudio' }).click()
  await expect(page.locator('[data-delivery-status]')).toHaveText('Envío de prueba completado.')
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(1440)
})

test('conserva y envía todas las fotos de una carpeta con nombres no ASCII', async ({ page }) => {
  const errors: string[] = []
  page.on('console', message => {
    if (message.type() === 'error' && /ERR_(BLOB|FILE)|blob:/i.test(message.text())) errors.push(message.text())
  })
  const uploads: { filename: string; base64: string }[] = []
  await page.route(endpoint, async route => {
    const data = route.request().postDataJSON()
    if (data.action === 'upload') uploads.push(data)
    await route.fulfill({ json: { ok: true, version: 2, filename: data.filename, size: data.size } })
  })

  const directory = await mkdtemp(join(tmpdir(), 'encargo-unicode-'))
  const names = ['Café de otoño.png', 'Ñandú.jpg']
  const image = sharp({ create: { width: 8, height: 6, channels: 3, background: '#342b21' } })
  const png = await image.clone().png().toBuffer()
  const jpeg = await image.jpeg().toBuffer()
  const thumbnails = page.locator('[data-content] .files img')
  const expectThumbnails = async () => {
    await expect(thumbnails).toHaveCount(names.length)
    await expect.poll(() => thumbnails.evaluateAll(images => images.every(
      image => image instanceof HTMLImageElement && image.complete && image.naturalWidth === 8,
    ))).toBe(true)
  }

  try {
    await Promise.all([writeFile(join(directory, names[0]), png), writeFile(join(directory, names[1]), jpeg)])
    await start(page, 1, '')
    const picker = page.getByLabel('Carpeta de imágenes de Inicio')
    await picker.setInputFiles(directory)
    await expect(picker).toHaveValue('')
    await expectThumbnails()
    await rm(directory, { recursive: true })
    await page.reload()
    await expectThumbnails()
    await next(page)
    await finish(page)
    await page.getByRole('button', { name: 'Enviar al estudio' }).click()
    await expect(page.locator('[data-delivery-status]')).toContainText('Recibido')
    expect(uploads.map(({ filename, base64 }) => [filename, base64]).sort()).toEqual([
      [names[0], png.toString('base64')],
      [names[1], jpeg.toString('base64')],
    ])
    expect(errors).toEqual([])
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('reanuda solo los archivos pendientes al cerrar la pestaña durante una subida', async ({ page, context }, info) => {
  const directory = join(await mkdtemp(join(tmpdir(), 'encargo-')), 'fotos')
  await fixtureFolder(directory)
  const requests: { action: string; session: string; filename?: string }[] = []
  let pendingSeen!: () => void
  const pending = new Promise<void>(resolve => { pendingSeen = resolve })
  let release!: () => void
  const closing = new Promise<void>(resolve => { release = resolve })
  await context.route(endpoint, async route => {
    const data = route.request().postDataJSON()
    requests.push(data)
    if (data.action === 'upload' && requests.filter(item => item.action === 'upload').length === 2) {
      pendingSeen()
      await closing
      return
    }
    await route.fulfill({ json: { ok: true, version: 2, filename: data.filename, size: data.size } })
  })
  await start(page, 1, '')
  await page.getByLabel('Carpeta de imágenes de Inicio').setInputFiles(directory)
  await expect(page.locator('[data-content] .files img')).toHaveCount(2)
  await next(page)
  await finish(page)
  await page.getByRole('button', { name: 'Enviar al estudio' }).click()
  await pending
  await page.close()
  release()
  const reopened = await context.newPage()
  await reopened.goto(base + 'encargo/')
  await expect(reopened.locator('[data-delivery-status]')).toContainText('1 archivo ya enviado')
  await reopened.getByRole('button', { name: 'Reanudar envío' }).click()
  await expect(reopened.locator('[data-delivery-status]')).toContainText('Recibido')
  expect(requests.map(request => request.action)).toEqual(['create', 'upload', 'upload', 'upload', 'finish'])
  expect(requests[1].filename).not.toBe(requests[2].filename)
  expect(requests[2].filename).toBe(requests[3].filename)
  expect(new Set(requests.map(request => request.session)).size).toBe(1)
})

test('funciona sin IndexedDB y recupera las respuestas con un aviso sobre los archivos', async ({ page }, info) => {
  await page.addInitScript(() => Object.defineProperty(window, 'indexedDB', { get: () => { throw new Error('Sin almacenamiento') } }))
  const directory = join(await mkdtemp(join(tmpdir(), 'encargo-')), 'fotos')
  await fixtureFolder(directory)
  await start(page, 1)
  await expect(page.locator('[data-storage]')).toContainText('Si recargas, tendrás que añadirlos de nuevo')
  await page.getByLabel('Carpeta de imágenes de Inicio').setInputFiles(directory)
  await expect(page.locator('.files img')).toHaveCount(2)
  await page.getByRole('textbox', { name: 'Titular de Inicio' }).fill('Texto guardado')
  await page.reload()
  await expect(page.getByRole('textbox', { name: 'Titular de Inicio' })).toHaveValue('Texto guardado')
  await expect(page.getByText('Archivo pendiente', { exact: true })).toHaveCount(2)
  await next(page)
  await finish(page)
  await page.getByRole('button', { name: 'Enviar al estudio' }).click()
  await expect(page.locator('[data-delivery-status]')).toContainText('2 archivos pendientes')
})

test('una implementación antigua ofrece el brief y el enlace por email', async ({ page }) => {
  await page.route(endpoint, route => route.fulfill({ json: { ok: false, error: 'Solicitud no válida' } }))
  await start(page, 1, '')
  await next(page)
  await finish(page)
  await page.getByRole('button', { name: 'Enviar al estudio' }).click()
  await expect(page.locator('[data-delivery-status]')).toContainText('Drive necesita una actualización')
  await page.getByRole('textbox', { name: 'Enlace para compartir los archivos' }).fill('https://example.com/material')
  await expect(page.getByRole('link', { name: 'Escribir por email' })).toHaveAttribute('href', /example\.com%2Fmaterial/)
  const downloaded = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Descargar .md' }).click()
  expect(await readFile((await (await downloaded).path())!, 'utf8')).toContain('https://example.com/material')
})

test('la comparativa enlaza al catálogo y el recomendador abre las preguntas de plataforma', async ({ page }) => {
  await page.goto(base)
  await page.getByRole('link', { name: 'Plataformas' }).click()
  await expect(page).toHaveURL(base + 'plataformas/')
  await heading(page, 'Plataformas')
  await expect(page.getByRole('list', { name: 'Capas de una plataforma' }).getByRole('listitem')).toHaveCount(4)
  await expect(page.getByRole('link', { name: 'Simón Lera' })).toHaveAttribute('href', base + 'simon-lera/')
  await page.getByRole('link', { name: 'Empezar mi encargo' }).click()
  await page.getByText('No lo sé, ayúdame', { exact: true }).click()
  for (const group of ['¿Quieres cambiar tú los textos y las fotos?', '¿Necesitas reservas, inscripciones o pagos?', '¿Habrá distintos tipos de usuario o vendedores?']) {
    await page.getByRole('group', { name: group }).getByRole('radio', { name: 'Sí', exact: true }).check()
  }
  await expect(page.locator('[data-recommendation]')).toContainText('Te recomendamos Plataforma')
  await page.getByRole('button', { name: 'Elegir este tipo' }).click()
  await expect(page.getByRole('radio', { name: /^04 Plataforma/ })).toBeChecked()
  await next(page)
  await page.getByRole('textbox', { name: /Nombre del negocio/ }).fill('Mercado de barrio')
  for (let index = 0; index < 5; index++) await next(page)
  await heading(page, 'Funcionalidades')
  await page.getByRole('textbox', { name: 'Tipos de usuario y roles' }).fill('Comercio y cliente')
  await page.getByRole('group', { name: '¿Habrá un marketplace?' }).getByRole('radio', { name: 'Sí' }).check()
  await expect(page.getByRole('textbox', { name: '¿Cómo se gestionan las comisiones?' })).toBeVisible()
})

test('añade una carpeta de imágenes con la maqueta 2D', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  const temporary = await mkdtemp(join(tmpdir(), 'encargo-'))
  try {
    const directory = join(temporary, 'fotos')
    await fixtureFolder(directory)
    await start(page, 1, '?demo=1&mockup=flat')
    await expect(page.locator('[data-desktop]')).toBeVisible()
    await expect(page.locator('[data-scene]')).toBeHidden()

    await page.getByLabel('Carpeta de imágenes de Inicio').setInputFiles(directory)
    await expect(page.locator('[data-content] .files img')).toHaveCount(2)
  } finally {
    await rm(temporary, { recursive: true, force: true })
  }
})

test('dibuja la maqueta viva en 2D cuando WebGL no está disponible', async ({ page }) => {
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
  await choose(page, /Escaparate/)
  await next(page)
  const desktop = page.locator('canvas[data-desktop]')
  await expect(desktop).toBeVisible()
  await expect(page.locator('[data-scene]')).toBeHidden()
  const before = await desktop.evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL())
  await page.getByRole('textbox', { name: /Nombre del negocio/ }).fill('Librería de Piedra')
  await expect(page.getByRole('complementary', { name: /Maqueta viva de Librería de Piedra/ })).toBeVisible()
  expect(await desktop.evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL())).not.toBe(before)
})
