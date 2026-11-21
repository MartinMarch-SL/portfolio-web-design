import { mkdir, readFile, writeFile } from 'node:fs/promises'
import sharp from 'sharp'

const publicDir = new URL('../public/', import.meta.url)
const resultsDir = new URL('../test-results/', import.meta.url)
const svg = await readFile(new URL('favicon.svg', publicDir), 'utf8')

// Sharp renders a fixed palette. Apply the SVG's dark declarations for paper variants.
const darkMedia = /@media \(prefers-color-scheme: dark\) \{([\s\S]*?)\n    \}/
const lightSvg = svg.replace(darkMedia, '')
const darkSvg = svg.replace(darkMedia, '$1')

function render(source, size) {
  return sharp(Buffer.from(source), { density: 72 * size / 64 }).png().toBuffer()
}

const icoSizes = [16, 32, 48]
const frames = await Promise.all(icoSizes.map(size => render(lightSvg, size)))
// ICO directories can point directly to PNG frames.
const directory = Buffer.alloc(6 + frames.length * 16)
directory.writeUInt16LE(1, 2)
directory.writeUInt16LE(frames.length, 4)
let offset = directory.length
for (const [index, frame] of frames.entries()) {
  const entry = 6 + index * 16
  directory[entry] = icoSizes[index]
  directory[entry + 1] = icoSizes[index]
  directory.writeUInt16LE(1, entry + 4)
  directory.writeUInt16LE(32, entry + 6)
  directory.writeUInt32LE(frame.length, entry + 8)
  directory.writeUInt32LE(offset, entry + 12)
  offset += frame.length
}

const appleBackground = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180"><rect width="180" height="180" rx="36" fill="#141414"/></svg>',
)
const appleIcon = await sharp(appleBackground)
  .composite([{ input: await render(darkSvg, 144), gravity: 'centre' }])
  .png()
  .toBuffer()

const previewSizes = [16, 32, 64, 180]
const centres = [48, 136, 240, 402]
const panelWidth = 510
const panelHeight = 204

async function previewPanel(source, background) {
  const icons = await Promise.all(previewSizes.map(async (size, index) => ({
    input: await render(source, size),
    left: centres[index] - size / 2,
    top: (panelHeight - size) / 2,
  })))
  return sharp({ create: { width: panelWidth, height: panelHeight, channels: 3, background } })
    .composite(icons)
    .png()
    .toBuffer()
}

const [lightPanel, darkPanel, largeIcon] = await Promise.all([
  previewPanel(lightSvg, '#F3F1EC'),
  previewPanel(darkSvg, '#141414'),
  render(lightSvg, 512),
])
const preview = await sharp({
  create: { width: panelWidth, height: panelHeight * 2, channels: 3, background: '#F3F1EC' },
}).composite([
  { input: lightPanel, left: 0, top: 0 },
  { input: darkPanel, left: 0, top: panelHeight },
]).png().toBuffer()

await mkdir(resultsDir, { recursive: true })
await Promise.all([
  writeFile(new URL('favicon.ico', publicDir), Buffer.concat([directory, ...frames])),
  writeFile(new URL('apple-touch-icon.png', publicDir), appleIcon),
  writeFile(new URL('icon-512.png', publicDir), largeIcon),
  writeFile(new URL('favicon-preview.png', resultsDir), preview),
])
