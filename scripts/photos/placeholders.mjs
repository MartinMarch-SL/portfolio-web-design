import { mkdir } from 'node:fs/promises'
import { dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { products } from '../../src/examples/ruido/data/products.ts'

const ruido = 'examples/ruido/img'
const portraits = [
  ...Array.from({ length: 6 }, (_, index) => `${ruido}/look-0${index + 1}.webp`),
  `${ruido}/workshop-02.webp`,
  ...products.flatMap(({ images }) => images),
]
const landscapes = ['campaign-01', 'campaign-02', 'workshop-01'].map(
  (name) => `${ruido}/${name}.webp`,
)

async function placeholder(path, width, height) {
  const destination = fileURLToPath(new URL(`../../public/${path}`, import.meta.url))
  const label = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" font-family="monospace" font-size="66" fill="#000">${basename(path)}</text>
  </svg>`)

  await mkdir(dirname(destination), { recursive: true })
  await sharp({ create: { width, height, channels: 3, background: '#8d8a84' } })
    .composite([{ input: label }])
    .webp({ quality: 86 })
    .toFile(destination)
}

await Promise.all([
  ...portraits.map((path) => placeholder(path, 1200, 1600)),
  ...landscapes.map((path) => placeholder(path, 1600, 1000)),
  placeholder('showcase/img/ruido-preview.webp', 1200, 1500),
])
