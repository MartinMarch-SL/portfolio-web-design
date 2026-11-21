import { mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { chromium } from '@playwright/test'
import sharp from 'sharp'

const usage = 'Usage: node scripts/qa/contact-sheet.mjs <out.jpg> <path1> [path2 ...] [--scroll=0,0.5,1]'
const site = new URL('http://127.0.0.1:4321/portfolio-web-design/')
const viewports = [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
]
const tileWidth = 780
const labelHeight = 34
const gap = 15
const background = '#202124'

async function captureTiles(browser, path, address, fractions) {
  const openingTiles = []
  const scrollTiles = []
  let fullPageTile
  for (const viewport of viewports) {
    const mobile = viewport.width === 390
    const context = await browser.newContext({ viewport, isMobile: mobile, hasTouch: mobile })
    try {
      const page = await context.newPage()
      const response = await page.goto(address.href, { waitUntil: 'load' })
      if (!response?.ok()) throw new Error(`${address.href} returned HTTP ${response?.status()}`)
      await page.evaluate(async () => {
        await document.fonts.ready
        const entrances = document.getAnimations().filter(animation =>
          animation instanceof CSSAnimation && animation.playState === 'running' &&
          Number.isFinite(animation.effect?.getComputedTiming().endTime),
        )
        await Promise.allSettled(entrances.map(animation => animation.finished))
      })

      const label = `${path || '/'} · ${viewport.width}×${viewport.height}`
      openingTiles.push({ label, image: await page.screenshot() })
      for (const fraction of fractions) {
        await page.evaluate(async (fraction) => {
          const root = document.scrollingElement
          window.scrollTo({ top: fraction * (root.scrollHeight - root.clientHeight), behavior: 'instant' })
          await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
        }, fraction)
        scrollTiles.push({ label: `${label} · scroll ${fraction}`, image: await page.screenshot() })
      }

      if (!mobile) {
        await page.evaluate(async () => {
          window.scrollTo({ top: 0, behavior: 'instant' })
          const images = [...document.images].filter(image => image.loading === 'lazy')
          for (const image of images) image.loading = 'eager'
          await Promise.allSettled(images.map(image => image.decode()))
          await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
        })
        fullPageTile = { label: `${label} · full page`, image: await page.screenshot({ fullPage: true }) }
      }
    } finally {
      await context.close()
    }
  }
  return [...openingTiles, fullPageTile, ...scrollTiles]
}

async function writeSheet(output, groups) {
  const layers = []
  let top = gap
  for (const tiles of groups) {
    for (let start = 0; start < tiles.length; start += 3) {
      let rowHeight = 0
      for (const [column, { label, image }] of tiles.slice(start, start + 3).entries()) {
        const left = gap + column * (tileWidth + gap)
        const { data, info } = await sharp(image)
          .resize({ width: tileWidth, height: 1000, fit: 'inside', withoutEnlargement: true })
          .png()
          .toBuffer({ resolveWithObject: true })
        const escapedLabel = label.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
        const caption = await sharp({
          text: { text: `<span foreground="white">${escapedLabel}</span>`, font: 'sans 15', rgba: true, width: tileWidth, height: labelHeight },
        }).png().toBuffer()
        layers.push({ input: caption, left, top }, { input: data, left, top: top + labelHeight })
        rowHeight = Math.max(rowHeight, labelHeight + info.height)
      }
      top += rowHeight + gap
    }
  }

  await mkdir(dirname(output), { recursive: true })
  await sharp({ create: { width: 3 * tileWidth + 4 * gap, height: top, channels: 3, background } })
    .composite(layers)
    .jpeg({ quality: 70 })
    .toFile(output)
}

async function main(args) {
  const scrollOptions = args.filter(arg => arg.startsWith('--scroll='))
  const [output, ...paths] = args.filter(arg => !arg.startsWith('--scroll='))
  if (!output || !paths.length || scrollOptions.length > 1 || args.some(arg => arg.startsWith('--') && !arg.startsWith('--scroll='))) {
    throw new Error(usage)
  }

  const fractions = scrollOptions.length ? scrollOptions[0].slice('--scroll='.length).split(',') : []
  if (fractions.some(value => !value.trim() || !Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > 1)) {
    throw new Error('--scroll requires comma-separated fractions between 0 and 1')
  }
  const addresses = paths.map(path => {
    const address = new URL(path, site)
    if (path.startsWith('/') || address.origin !== site.origin || !address.pathname.startsWith(site.pathname)) {
      throw new Error(`Expected a path relative to ${site.pathname}: ${path}`)
    }
    return address
  })

  const preview = await fetch(site, { signal: AbortSignal.timeout(5000) }).catch(() => null)
  if (!preview?.ok) throw new Error(`Start Astro preview on port 4321 before running the contact sheet (${site.href})`)
  await preview.body?.cancel()

  const browser = await chromium.launch()
  try {
    const groups = []
    for (const [index, path] of paths.entries()) {
      groups.push(await captureTiles(browser, path, addresses[index], fractions.map(Number)))
    }
    await writeSheet(output, groups)
  } finally {
    await browser.close()
  }
  console.log(output)
}

main(process.argv.slice(2)).catch(error => {
  console.error(error.message)
  process.exitCode = 1
})
