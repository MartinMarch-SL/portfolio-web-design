import { mkdir } from 'node:fs/promises'
import { chromium } from '@playwright/test'
import sharp from 'sharp'

const origin = process.argv[2] ?? 'http://127.0.0.1:4321'
const folder = 'public/examples/halda/img'
const route = '/portfolio-web-design/halda/'
const shots = [
  ['hero', ''], ['surface', 'inspeccion-superficial'], ['bin', 'bin-picking'],
  ['pcb', 'aoi-placas'], ['laser', 'metrologia-3d'], ['dpm', 'trazabilidad-dpm'], ['edge', 'hardware-edge'],
]

await mkdir(folder + '/stills', { recursive: true })
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce', deviceScaleFactor: 1 })
  page.on('pageerror', error => console.error(error))
  for (const [name, slug] of shots) {
    await page.goto(origin + route + (slug ? 'casos/' + slug + '/' : ''))
    const stage = page.locator('[data-scene="' + name + '"]')
    await stage.evaluate(element => {
      const style = element.style
      style.width = '1200px'
      style.height = '850px'
      style.position = 'fixed'
      style.inset = '10px auto auto 10px'
      style.zIndex = '100'
      element.querySelectorAll('.reticle').forEach(mark => mark.remove())
    })
    await page.evaluate(() => document.fonts.ready)
    await stage.locator('canvas').waitFor({ state: 'visible' })
    const capture = await stage.screenshot({ animations: 'disabled' })
    await sharp(capture).webp({ quality: 87 }).toFile(folder + '/stills/' + name + '.webp')
  }
} finally {
  await browser.close()
}
