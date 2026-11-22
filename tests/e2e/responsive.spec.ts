import { mkdir } from 'node:fs/promises'
import { expect, test } from '@playwright/test'

const viewports = [
  [320, 568], [375, 667], [390, 844], [430, 932], [844, 390], [768, 1024],
  [1024, 768], [1280, 800], [1440, 900], [1920, 1080], [2560, 1440],
]
const pages = {
  index: '',
  encargo: 'encargo/',
  ruido: 'ruido/',
  tienda: 'ruido/tienda/',
  producto: 'ruido/producto/bloc-380/',
  checkout: 'ruido/checkout/',
  creditos: 'ruido/creditos/',
  caribe: 'bar-caribe/',
  carta: 'bar-caribe/carta/',
  reservas: 'bar-caribe/reservas/',
  casa: 'bar-caribe/casa/',
  ines: 'ines-arranz/',
  agenda: 'ines-arranz/agenda/',
  blog: 'ines-arranz/blog/',
  articulo: 'ines-arranz/blog/cuando-la-mente-se-adelanta/',
  sobreMi: 'ines-arranz/sobre-mi/',
  mares: 'mares/',
  propiedades: 'mares/propiedades/',
  ficha: 'mares/propiedades/patio-de-sant-jaume/',
  vender: 'mares/vender/',
  estudio: 'mares/estudio/',
  simon: 'simon-lera/',
  salaSimon: 'simon-lera/obra/',
  fichaSimon: 'simon-lera/obra/linea-de-retirada/',
  estudioSimon: 'simon-lera/estudio/',
  lia: 'lia-ferro/',
  trabajosLia: 'lia-ferro/trabajos/',
  encargoLia: 'lia-ferro/encargo/',
  flashLia: 'lia-ferro/flash/',
  cuidadosLia: 'lia-ferro/cuidados/',
}

for (const [width, height] of viewports) {
  test(`all pages fit ${width}×${height}`, async ({ page, reducedMotion }) => {
    test.setTimeout(60_000)
    await page.setViewportSize({ width, height })
    for (const [name, path] of Object.entries(pages)) {
      await test.step(name, async () => {
        if (name === 'checkout') {
          await page.evaluate(() => localStorage.setItem('ruido-cart-v1', JSON.stringify([
            { slug: 'bloc-380', size: 'M', color: 'Asfalto', qty: 1 },
          ])))
        }
        await page.goto(`/portfolio-web-design/${path}`)
        if (name === 'checkout') await expect(page.locator('[data-checkout-active]')).toBeVisible()
        await page.evaluate(async () => {
          await document.fonts.ready
          await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
        })
        const result = await page.evaluate(() => {
          const overflow: string[] = []
          const smallText: string[] = []
          const range = document.createRange()
          for (const element of document.body.querySelectorAll('*')) {
            if (!element.checkVisibility() || element.closest('dialog:not([open]), [hidden]')) continue
            const label = element.tagName.toLowerCase() + (element.className ? `.${element.className}` : '')
            const style = getComputedStyle(element)
            const text = [...element.childNodes].filter(node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim())
            if ((text.length || element.matches('input:not([type=hidden]), select')) && parseFloat(style.fontSize) < 11) {
              smallText.push(`${label}: ${style.fontSize}`)
            }

            const maresPhotoWindow = element.parentElement?.closest('[data-mares] .hero-image')
            const clippingWindow = maresPhotoWindow ?? element.parentElement?.closest('[data-section="ticker"], [data-rail-active] [data-rail-window], [data-wall] [data-rail-window], [data-gallery-track], [data-vitrina-track], [data-stage], .filters')
            const clips = clippingWindow &&
              ['clip', 'hidden', 'auto'].includes(getComputedStyle(clippingWindow).overflowX)
            const outOfBounds = (rect: DOMRect) => rect.width > 0 && (rect.left < -.5 || rect.right > innerWidth + .5)
            if (!clips && (outOfBounds(element.getBoundingClientRect()) || text.some(node => {
              range.selectNodeContents(node)
              return [...range.getClientRects()].some(outOfBounds)
            }))) overflow.push(label)
          }
          return { scrollWidth: document.documentElement.scrollWidth, overflow, smallText }
        })
        expect.soft(result.scrollWidth).toBeLessThanOrEqual(width)
        expect.soft(result.overflow).toEqual([])
        expect.soft(result.smallText).toEqual([])

        if (name === 'index') {
          const footer = page.getByRole('contentinfo')
          await expect(footer).toHaveText('Catálogo de proyectos · 2026')
          await expect(footer).toHaveCSS('border-top-width', '1px')
        }

        if (name === 'ruido') {
          const word = page.locator('[data-section=hero] [data-wordmark]')
          await expect(word).toBeInViewport({ ratio: 1 })
          const photo = page.locator('[data-hero-photo]')
          if (reducedMotion === 'reduce') {
            await expect(photo).toHaveCSS('clip-path', 'none')
            expect((await photo.boundingBox())!.y).toBeGreaterThanOrEqual(height)
          } else {
            await expect(photo).toHaveCSS('clip-path', 'inset(50%)')
          }
        }

        if (reducedMotion !== 'reduce' && (width === 390 || width === 1440)) {
          await mkdir('test-results/shots', { recursive: true })
          await page.screenshot({ path: `test-results/shots/${name}-${width}x${height}.png` })
        }
      })
    }
  })
}

test('the hero reveals the photo, docks the wordmark, and holds the final frame', async ({ page, reducedMotion }) => {
  test.skip(reducedMotion === 'reduce', 'The reduced-motion hero is stacked')
  await page.setViewportSize({ width: 844, height: 390 })
  await page.goto('/portfolio-web-design/ruido/')
  await page.evaluate(() => document.fonts.ready)
  const stage = page.locator('[data-hero-stage]')
  const word = stage.locator('[data-wordmark]')
  const photo = stage.locator('[data-hero-photo]')
  const image = photo.locator('img')
  await expect.poll(() => image.evaluate(img => (img as HTMLImageElement).currentSrc)).toContain('campaign-01')
  await page.setViewportSize({ width: 390, height: 844 })
  await expect.poll(() => image.evaluate(img => (img as HTMLImageElement).currentSrc)).toContain('hero-portrait')
  await expect(word).toBeInViewport({ ratio: 1 })
  await expect(photo).toHaveCSS('clip-path', 'inset(50%)')
  const opening = (await word.boundingBox())!

  async function scrollTo(progress: number) {
    await stage.evaluate((element, progress) => {
      const scene = element.parentElement!
      window.scrollTo({ top: progress * (scene.clientHeight - element.clientHeight), behavior: 'instant' })
    }, progress)
  }

  await scrollTo(.35)
  await expect.poll(async () => Math.round(await photo.evaluate(element =>
    parseFloat(getComputedStyle(element).clipPath.slice(6)),
  ))).toBe(25)
  await scrollTo(.9)
  await expect(photo).toHaveCSS('clip-path', 'inset(0%)')
  await expect(stage.locator('[data-hero-meta]').first()).toHaveCSS('opacity', '0')
  const docked = (await word.boundingBox())!
  expect(docked.width / opening.width).toBeCloseTo(.22, 2)
  expect(docked.x).toBeCloseTo(opening.x, 0)
  expect(docked.y + docked.height).toBeCloseTo(844 - 16, 0)
  await scrollTo(.97)
  await expect.poll(async () => (await stage.boundingBox())!.y).toBe(0)
  expect(await word.boundingBox()).toEqual(docked)
})
