import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'
import sharp from 'sharp'

const root = new URL(process.argv[2] ?? 'http://127.0.0.1:4399/portfolio-web-design/')
const output = new URL('../../public/showcase/img/screens/', import.meta.url)
const examples = ['ruido', 'bar-caribe', 'ines-arranz', 'mares', 'simon-lera', 'lia-ferro', 'los-almendros', 'pinar-alto', 'ramal', 'halda', 'las-moreras']
const selected = process.argv.slice(3)
for (const name of selected) {
  if (!examples.includes(name)) throw new Error(`Ejemplo desconocido: ${name}`)
}
const viewports = [
  ['desktop', { width: 1440, height: 900 }],
  ['mobile', { width: 375, height: 812 }],
]

await mkdir(output, { recursive: true })
const targets = selected.length ? selected : examples
const browser = await chromium.launch(targets.some(name => ['halda', 'las-moreras'].includes(name))
  ? { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }
  : {})
try {
  for (const [device, viewport] of viewports) {
    const page = await browser.newPage({ viewport, reducedMotion: 'reduce', hasTouch: device === 'mobile' })
    try {
      for (const example of targets) {
        const url = new URL(`${example}/`, root)
        const response = await page.goto(url.href)
        if (!response?.ok()) throw new Error(`No se pudo cargar ${url}`)
        await page.evaluate(async () => {
          await document.fonts.ready
          const images = [...document.images].filter(img => {
            const rect = img.getBoundingClientRect()
            const hasSource = img.hasAttribute('src') || img.hasAttribute('srcset') || img.currentSrc
            return hasSource && rect.bottom > 0 && rect.top < innerHeight && rect.width > 0
          })
          await Promise.all(images.map(img => img.decode()))
        })
        if (example === 'halda') {
          const hero = page.locator('[data-scene="hero"]')
          await hero.locator('canvas').waitFor({ state: 'visible' })
          await page.waitForFunction(() => {
            const canvas = document.querySelector('[data-scene="hero"] canvas')
            const context = canvas?.getContext('2d')
            return context?.getImageData(0, 0, canvas.width, canvas.height).data.some((value, index) => index % 4 !== 3 && value > 60)
          })
        }
        if (example === 'las-moreras') {
          await page.locator('[data-ball][data-rendered] canvas').waitFor({ state: 'visible' })
        }
        const screenshot = await page.screenshot({ animations: 'disabled' })
        let webp
        for (let quality = 88; quality >= 28; quality -= 6) {
          webp = await sharp(screenshot).webp({ quality }).toBuffer()
          if (webp.length < 300_000) break
        }
        if (webp.length >= 300_000) throw new Error(`Captura demasiado grande: ${example} ${device}`)
        const filename = `${example}-${device}.webp`
        await writeFile(new URL(filename, output), webp)
        if (['los-almendros', 'pinar-alto', 'ramal', 'halda', 'las-moreras'].includes(example) && device === 'desktop') {
          await copyFile(new URL(filename, output), new URL(`../${example}-preview.webp`, output))
        }
        console.log(`${filename} (${webp.length} bytes)`)
      }
    } finally {
      await page.close()
    }
  }
} finally {
  await browser.close()
}
