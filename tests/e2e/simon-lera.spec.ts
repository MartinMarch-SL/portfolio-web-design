import { expect, test } from '@playwright/test'

const home = '/portfolio-web-design/simon-lera/'
const wall = `${home}obra/`
const first = `${wall}linea-de-retirada/`

test('El reverso conserva la obra y la cartela sin WebGL', async ({ page }) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, options?: unknown) {
      return type.startsWith('webgl') ? null : Reflect.apply(getContext, this, [type, options])
    } as typeof getContext
  })
  await page.goto(home)
  const fallback = page.locator('[data-hero-static] img')
  await expect(fallback).toBeVisible()
  await expect.poll(() => fallback.evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
  await expect(page.locator('[data-hero] figcaption')).toHaveText(/Hora inmóvil.*2024.*Óleo sobre lino/)
  await expect(page.locator('[data-hero] canvas')).toHaveCount(0)
})

test('El reverso respeta la preferencia de movimiento reducido', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(home)
  await expect(page.locator('[data-hero-static]')).toBeVisible()
  await expect(page.locator('[data-hero] canvas')).toHaveCount(0)
})

test('Sala combina serie y disponibilidad, incluso sin resultados', async ({ page }) => {
  await page.goto(wall)
  await expect(page.locator('[data-work]:visible')).toHaveCount(9)
  await page.getByRole('button', { name: 'Cal', exact: true }).click()
  await expect(page.locator('[data-work]:visible')).toHaveCount(3)
  await expect(page.locator('[data-series-note]')).toContainText('Blancos')
  await page.getByRole('button', { name: 'disponible', exact: true }).click()
  await expect(page.locator('[data-work]:visible')).toHaveCount(2)
  await page.getByRole('button', { name: 'colección privada', exact: true }).click()
  await expect(page.locator('[data-work]:visible')).toHaveCount(0)
  await expect(page.getByText('No hay obras con estos filtros.')).toBeVisible()
  await page.getByRole('button', { name: 'Todas las series' }).click()
  await expect(page.locator('[data-work]:visible')).toHaveCount(2)
})

test('Ficha alterna iluminación y escala y confirma una consulta', async ({ page }) => {
  await page.goto(first)
  const light = page.getByRole('button', { name: 'Luz rasante' })
  await light.click()
  await expect(light).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('[data-raking-canvas]')).toHaveCSS('opacity', '1')
  await page.getByRole('button', { name: 'Luz de sala' }).click()
  await expect(page.locator('[data-raking-canvas]')).toBeHidden()

  const scale = page.getByRole('button', { name: 'Escala real' })
  await scale.click()
  await expect(page.getByRole('img', { name: /una persona de 175 cm/ })).toBeVisible()
  await expect(page.locator('[data-painting]')).toBeHidden()
  await scale.click()
  await expect(page.locator('[data-painting]')).toBeVisible()

  await page.getByText('Solicitar información').click()
  await page.getByLabel('Nombre').fill('Ana Soler')
  await page.getByLabel('Correo electrónico').fill('ana@example.com')
  await page.getByLabel('Consulta').fill('¿Se puede ver la obra en el estudio?')
  await page.getByRole('button', { name: 'Registrar consulta' }).click()
  await expect(page.getByText('Tu consulta se ha registrado en esta página.')).toBeVisible()
  await expect(page).toHaveURL(first)
})

test('Sala y ficha comparten un nombre de transición único', async ({ page }) => {
  await page.goto(wall)
  const work = page.locator('[data-work="linea-de-retirada"]')
  const snapshot = work.locator('.stretcher')
  await expect(snapshot).toHaveCSS('view-transition-name', 'lienzo-linea-de-retirada')
  await expect(page.locator('[data-work="agua-quieta"] .stretcher')).toHaveCSS('view-transition-name', 'lienzo-agua-quieta')
  await work.getByRole('link').click()
  await expect(page).toHaveURL(first)
  await expect(page.locator('[data-painting]')).toHaveCSS('view-transition-name', 'lienzo-linea-de-retirada')
})

for (const viewport of [{ width: 1440, height: 900 }, { width: 375, height: 812 }]) {
  test(`Las obras de inicio y sala cargan al recorrer la página a ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport)
    for (const [route, count] of [[home, 3], [wall, 9]] as const) {
      await page.goto(route)
      const images = page.locator('.work-card img')
      await expect(images).toHaveCount(count)
      const visited = new Set<number>()
      let offset = 0
      while (true) {
        const { end, intersecting, step } = await images.evaluateAll(async (elements, offset) => {
          const rail = document.querySelector<HTMLElement>('[data-rail-window]')
          // The desktop wall is horizontally scrollable with reduced motion.
          const horizontal = rail && !rail.closest('[data-rail-active]') && rail.scrollWidth > rail.clientWidth
          if (horizontal) {
            rail.scrollIntoView({ block: 'start', behavior: 'instant' })
            rail.scrollLeft = offset
          } else {
            window.scrollTo({ top: offset, behavior: 'instant' })
          }
          // Give the sticky rail time to apply its scroll transform.
          await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
          const clip = rail?.getBoundingClientRect()
          const intersecting = elements.flatMap((image, index) => {
            const { top, bottom, left, right } = image.getBoundingClientRect()
            return top < innerHeight && bottom > 0 &&
              left < Math.min(innerWidth, clip?.right ?? innerWidth) &&
              right > Math.max(0, clip?.left ?? 0) ? [index] : []
          })
          return {
            end: horizontal
              ? rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 1
              : scrollY + innerHeight >= document.documentElement.scrollHeight - 1,
            step: (horizontal ? rail.clientWidth : innerHeight) / 2,
            intersecting,
          }
        }, offset)
        for (const index of intersecting) {
          await expect.poll(() => images.nth(index).evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
          visited.add(index)
        }
        if (end) break
        offset += step
      }
      expect(visited.size).toBe(count)
      if (route === wall && viewport.width === 1440) {
        await expect.poll(() => images.evaluateAll(elements =>
          elements.every(image => (image as HTMLImageElement).naturalWidth > 0),
        )).toBe(true)
      }
    }
  })
}
