// Deterministic, replaceable image placeholders and a tiled linen surface.
import { mkdir } from 'node:fs/promises'
import sharp from 'sharp'
import { works } from '../data/works.ts'

const images = new URL('../../../../public/examples/simon-lera/img/', import.meta.url)
const showcase = new URL('../../../../public/showcase/img/', import.meta.url)
const palettes = [
  ['#d7c8ac', '#385253', '#8b9a86', '#e4d5b9', '#a26849'],
  ['#d9c7a7', '#4c6260', '#9c9d80', '#ddccb1', '#6d5944'],
  ['#b7b19b', '#53605c', '#7b8886', '#e4d5ba', '#9d6a4c'],
  ['#e2d9c8', '#b0a291', '#c5bba8', '#eee4ce', '#945f46'],
  ['#ded0b3', '#b9a68b', '#c0b6a0', '#e2d8c6', '#7c766c'],
  ['#ccc3af', '#907b67', '#c4bba7', '#ded2bb', '#8a8b77'],
  ['#c09d72', '#805741', '#a1815d', '#d9b985', '#624d3c'],
  ['#d4ac7e', '#754735', '#ba8b62', '#d1b387', '#7b6d4e'],
  ['#ceb284', '#956246', '#a48656', '#e4cba4', '#695846'],
]

function random(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 4294967296
  }
}

function painting(index) {
  const [base, deep, middle, chalk, oxide] = palettes[index % palettes.length]
  const rand = random(index + 274)
  const tide = 360 + rand() * 350
  const strokes = Array.from({ length: 430 }, (_, i) => {
    const x = rand() * 1200 - 80
    const y = rand() * 1000
    const span = 14 + rand() * 250
    const thickness = 1 + rand() ** 3 * 14
    const color = [chalk, middle, deep, oxide][i % 4]
    return `<path d="M${x.toFixed(1)} ${y.toFixed(1)}q${(span / 2).toFixed(1)} -${(rand() * 18).toFixed(1)} ${span.toFixed(1)} 0" stroke="${color}" stroke-width="${thickness.toFixed(1)}" opacity="${(.04 + rand() * .34).toFixed(2)}" fill="none"/>`
  }).join('')
  return `<rect width="1200" height="1000" fill="${base}"/>
    <path d="M0 ${tide - 92}L340 ${tide - 120} 570 ${tide - 151} 970 ${tide - 142} 1200 ${tide - 220}V1000H0Z" fill="${middle}"/>
    <path d="M0 ${tide}L230 ${tide + 2} 534 ${tide - 52} 760 ${tide - 30} 1200 ${tide - 120}V${tide + 180}L820 ${tide + 116} 640 ${tide + 210} 370 ${tide + 190} 0 ${tide + 250}Z" fill="${deep}"/>
    <path d="M0 ${tide + 18}L405 ${tide - 9} 740 ${tide - 58} 1200 ${tide - 115}" stroke="${chalk}" stroke-width="11" opacity=".6" fill="none"/>
    <path d="M${80 + index * 35} 0l24 0 12 1000h-13z" fill="${oxide}" opacity=".27"/>${strokes}`
}

function room(index, gallery = false) {
  const [wall, floor, wood] = gallery ? ['#e9e1d3', '#9c8b75', '#857057'] : ['#c9bc9f', '#85745c', '#795a40']
  return `<rect width="1200" height="1000" fill="${wall}"/>
    <path d="M0 745L1200 660V1000H0Z" fill="${floor}"/>
    <path d="M925 0H1200V660L925 680Z" fill="#332a20" opacity=".12"/>
    <path d="M0 0H205V732L0 745Z" fill="#fff1cf" opacity=".35"/>
    <path d="M285 170h450v495H285Z" fill="#443b31" opacity=".2" transform="translate(18 19)"/>
    <svg x="280" y="163" width="450" height="495" viewBox="0 0 1200 1000" preserveAspectRatio="none">${painting(index)}</svg>
    ${gallery ? '<path d="M758 532h40v22h-40z" fill="#f5ecdc"/>' : `<path d="M75 790h805v37H75zM112 810h27v190h-27zm699 0h24v190h-24z" fill="${wood}"/><path d="M170 784l175-17 7 8-178 16zM486 781l99-19 18 9-116 17z" fill="#382a21"/>`}`
}

async function save(key, width, height, art, destination = images) {
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 1200 1000" preserveAspectRatio="none">${art}</svg>`)
  await Promise.all([width, ...[640, 1080].filter(w => w < width)].map(w =>
    sharp(svg).resize(w).webp({ quality: 84 }).toFile(new URL(`${key}${w === width ? '' : `-${w}w`}.webp`, destination).pathname),
  ))
}

await mkdir(images, { recursive: true })
const rand = random(27)
const size = 128
const linen = Buffer.alloc(size * size * 3)
for (let y = 0; y < size; y++) {
  for (let x = 0; x < size; x++) {
    const grain = (rand() - .5) * 4
    const weave = (x % 4 === 0 ? -3 : 0) + (y % 4 === 0 ? -3 : 0) + ((x + y) % 8 === 1 ? 2 : 0)
    const offset = (y * size + x) * 3
    for (let c = 0; c < 3; c++) linen[offset + c] = [251, 248, 242][c] + grain + weave
  }
}
await sharp(linen, { raw: { width: size, height: size, channels: 3 } }).webp({ lossless: true }).toFile(new URL('lino.webp', images).pathname)

await Promise.all([
  ...works.map((work, index) => {
    const factor = 1200 / Math.max(work.width, work.height)
    return save(work.image, Math.round(work.width * factor), Math.round(work.height * factor), painting(index))
  }),
  ...[0, 1, 2].flatMap(index => [
    save(`detalle-0${index + 1}`, 1200, 800, `<g transform="translate(-350 -620) scale(1.9)">${painting(index * 3)}</g>`),
    save(`estudio-0${index + 1}`, 1200, 800, room(index * 3)),
  ]),
  save('sala-01', 1200, 800, room(0, true)),
  save('simon-lera-preview', 1200, 1500, room(0, true), showcase),
])
