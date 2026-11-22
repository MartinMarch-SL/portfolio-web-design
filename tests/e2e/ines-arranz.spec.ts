import { expect, test } from '@playwright/test'
import sharp from 'sharp'

const base = '/portfolio-web-design/ines-arranz/'

test('la agenda completa la reserva y descarga el calendario', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-07-20T08:00:00Z'))
  await page.goto(base + 'agenda/?modalidad=llamada')
  await page.getByRole('button', { name: 'Continuar' }).click()
  await expect(page.getByRole('radio', { name: /Llamada 15 min/ })).toBeChecked()
  await page.locator('[data-slot]').first().focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('[data-slot][aria-pressed=true]')).toHaveText(/Reservado para ti/)
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.getByRole('button', { name: 'Confirmar reserva de demostración' }).click()
  await expect(page.getByLabel('Nombre', { exact: true })).toBeFocused()
  await page.getByLabel('Nombre', { exact: true }).fill('Ana Ejemplo')
  await page.getByLabel('Correo electrónico').fill('ana@example.com')
  await page.getByLabel('Teléfono').fill('612345678')
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Confirmar reserva de demostración' }).click()
  await expect(page.getByRole('heading', { name: 'Reserva de demostración completada' })).toBeFocused()
  await expect(page.getByText('Ana Ejemplo')).toBeVisible()
  const downloadLink = page.getByRole('link', { name: /Añadir al calendario/ })
  const download = page.waitForEvent('download')
  await downloadLink.click()
  expect((await download).suggestedFilename()).toBe('cita-ines-arranz.ics')
})

test('la agenda no ofrece huecos con menos de 24 horas', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-07-20T09:30:00Z'))
  await page.goto(base + 'agenda/')
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.getByRole('button', { name: 'Mes siguiente' }).click()
  await expect(page.locator('[data-month]')).toHaveText('agosto de 2026')
  await page.getByRole('button', { name: 'Mes anterior' }).click()
  await expect(page.locator('[data-slot]').first()).toBeVisible()
  const slots = await page.locator('[data-slot]').evaluateAll(elements => elements.map(element => element.getAttribute('data-slot')!))
  expect(slots).not.toContain('2026-07-21T08:00:00.000Z')
  expect(slots).toContain('2026-07-21T10:00:00.000Z')
  expect(slots.every(slot => Date.parse(slot) >= Date.parse('2026-07-21T09:30:00Z'))).toBe(true)
})

test('el blog filtra por categoría y el índice enlaza a las secciones', async ({ page }) => {
  await page.goto(base + 'blog/')
  const posts = page.locator('[data-post-list] article:visible')
  await expect(posts).toHaveCount(5)
  await page.getByRole('button', { name: 'Relaciones' }).click()
  await expect(posts).toHaveCount(1)
  await posts.getByRole('link', { name: 'Hablar de lo que necesitas' }).click()
  const toc = page.getByRole('navigation', { name: 'En este artículo' })
  await expect(toc.getByRole('link')).toHaveCount(3)
  await toc.getByRole('link', { name: 'Escuchar la respuesta y hacer sitio a la tuya' }).click()
  await expect(page).toHaveURL(/#escuchar-la-respuesta-y-hacer-sitio-a-la-tuya$/)
})

test('los pensamientos siguen disponibles si WebGL falla', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...options: unknown[]) {
      if (type.startsWith('webgl')) return null
      return Reflect.apply(original, this, [type, ...options])
    } as typeof original
  })
  await page.goto(base)
  await expect(page.getByRole('heading', { name: 'Cambiar de perspectiva' })).toBeVisible()
  const examples = page.getByRole('list', { name: 'Ejemplos de reestructuración cognitiva' })
  await expect(examples.getByRole('listitem')).toHaveCount(3)
  await expect(examples.getByText('Todavía no he encontrado cómo decirlo')).toBeVisible()
  await expect(page.locator('[data-perspective-stage] canvas')).toHaveCount(0)
})

test('el giro dispersa la tinta y recompone la frase en ciruela', async ({ page }, info) => {
  await page.goto(base)
  if (info.project.name === 'reduced-motion') {
    await expect(page.getByText('Estoy aprendiendo', { exact: true })).toBeVisible()
    await expect(page.locator('[data-perspective-stage] canvas')).toHaveCount(0)
    return
  }
  const scene = page.locator('.perspective.has-scene')
  const canvas = scene.locator('canvas')
  const count = scene.locator('[data-perspective-count]')
  await expect(canvas).toBeVisible()
  await expect(count).toHaveText('1 / 3')

  async function scrollToPose(pair: number, progress: number) {
    await scene.evaluate((element, fraction) => {
      const top = element.getBoundingClientRect().top + scrollY
      scrollTo(0, top + (element.clientHeight - innerHeight) * fraction)
    }, (pair + progress) / 3)
  }

  async function measureInk(plum: boolean) {
    const { data, info: { width, height, channels } } = await sharp(await canvas.screenshot()).removeAlpha().raw().toBuffer({ resolveWithObject: true })
    let top = height
    let bottom = 0
    let pixels = 0
    for (let offset = 0; offset < data.length; offset += channels) {
      const [red, green, blue] = [data[offset], data[offset + 1], data[offset + 2]]
      if (green > 100 || (plum ? red - green < 16 : blue <= red)) continue
      const row = Math.floor(offset / channels / width)
      top = Math.min(top, row)
      bottom = Math.max(bottom, row)
      pixels++
    }
    return { span: (bottom - top) / height, pixels }
  }

  await scrollToPose(0, .14)
  await expect.poll(async () => (await measureInk(false)).pixels).toBeGreaterThan(400)
  const initial = await measureInk(false)
  await scrollToPose(0, .5)
  // Measure against the canvas height because the opening phrase spans two lines.
  await expect.poll(async () => (await measureInk(false)).span).toBeGreaterThan(initial.span + .12)
  await scrollToPose(0, .87)
  await expect.poll(async () => (await measureInk(true)).pixels).toBeGreaterThan(400)
  await scrollToPose(1, .15)
  await expect(count).toHaveText('2 / 3')
  await scrollToPose(2, .87)
  await expect(count).toHaveText('3 / 3')
})

test('el dial muestra el momento que corresponde al desplazamiento', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto(base)
  const session = page.locator('.session.enhanced')
  await expect(session).toBeAttached()
  await expect(page.locator('.perspective.has-scene')).toBeAttached()
  const peak = await session.evaluate(async element => {
    const top = element.getBoundingClientRect().top + scrollY
    const moments = [...element.querySelectorAll('.moments li')]
    scrollTo(0, top + (element.clientHeight - innerHeight) * .54)
    let maxVisible = 0
    const start = performance.now()
    do {
      await new Promise(requestAnimationFrame)
      maxVisible = Math.max(maxVisible, moments.filter(moment => Number(getComputedStyle(moment).opacity) > .01).length)
    } while (performance.now() - start < 450)
    return maxVisible
  })
  expect(peak).toBe(1)
  await expect(page.locator('.moments li.active')).toContainText('Tu historia')
  await expect(page.locator('.dial-ring')).toHaveAttribute('style', /--turn: -1[56]\d/)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.locator('[data-session]')).not.toHaveClass(/enhanced/)
  await expect(page.locator('.moments li')).toHaveCount(5)
})
