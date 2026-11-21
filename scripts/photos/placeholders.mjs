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

async function placeholder(path, width, height, background = '#8d8a84', ink = '#000') {
  const destination = fileURLToPath(new URL(`../../public/${path}`, import.meta.url))
  const label = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" font-family="monospace" font-size="66" fill="${ink}">${basename(path)}</text>
  </svg>`)

  await mkdir(dirname(destination), { recursive: true })
  await sharp({ create: { width, height, channels: 3, background } })
    .composite([{ input: label }])
    .webp({ quality: 86 })
    .toFile(destination)
}

const bar = 'examples/bar-caribe/img'
const barPortraits = ['vermut', 'gente-01', 'gente-02', ...Array.from({ length: 8 }, (_, index) => `tapa-0${index + 1}`)]
const barPalette = ['#b28b4a', '#705441', '#875a43', '#bc985e', '#c9a759', '#b77146', '#66776b', '#baa582', '#b78960', '#87614e', '#8b9058']

const ines = 'examples/ines-arranz/img'
const inesPortraits = ['retrato', 'consulta-02', 'detalle-01', 'detalle-02']
const inesPalette = ['#CFC8E8', '#B9C6B5', '#D6A98F', '#D9C8B6', '#AABDAF']

const mares = 'examples/mares/img'
const maresTargets = [
  ['hero', 1600, 1000], ['palma-01', 1600, 1067], ['palma-02', 1080, 1350], ['oficina', 1600, 1067],
  ...Array.from({ length: 3 }, (_, index) => [`equipo-0${index + 1}`, 1080, 1350]),
  ...Array.from({ length: 8 }, (_, index) => ['a', 'b', 'c'].map(frame =>
    [`prop-0${index + 1}-${frame}`, frame === 'c' ? 1080 : 1600, frame === 'c' ? 1350 : 1067],
  )).flat(),
]

async function maresPlaceholder(path, width, height, index) {
  const destination = fileURLToPath(new URL(`../../public/${path}`, import.meta.url))
  const palettes = [
    ['#93acac', '#d7ae79', '#ede0bc', '#384f43'],
    ['#a5b9b1', '#c29772', '#e6cdab', '#485a47'],
    ['#849e9c', '#c7a479', '#ead5b1', '#254538'],
    ['#9dabac', '#bc865e', '#e8caa5', '#22423d'],
  ]
  const [sky, stone, light, green] = palettes[index % palettes.length]
  const edge = 245 + index % 5 * 39
  const slats = Array.from({ length: 15 }, (_, row) =>
    `<path d="M${edge + 310} ${230 + row * 13}h119v6h-119z" fill="#c6d4ac" opacity=".32"/>`,
  ).join('')
  // A deliberately abstract architectural study for the replaceable photo slot.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
    <rect width="1200" height="800" fill="${sky}"/>
    <path d="M0 390H1200V800H0Z" fill="#385968"/>
    <path d="M0 544L1200 514V800H0Z" fill="${stone}"/>
    <path d="M${edge} 800V153L1200 65V800Z" fill="${light}"/>
    <path d="M${edge} 153l101 143v504H${edge}Z" fill="${stone}"/>
    <path d="M${edge + 101} 800V499a80 80 0 0 1 160 0v301z" fill="#4f5849"/>
    <path d="M${edge + 310} 222h119v203h-119z" fill="${green}"/>${slats}
    <path d="M${edge + 429} 425l166 93h-119l-166-93zM${edge + 260} 657l220 143h-212l-165-143z" fill="#594637" opacity=".32"/>
    <path d="M0 766L1200 668v132H0Z" fill="#5c483b" opacity=".26"/>
    <path d="M${edge} 153L1200 65M${edge + 101} 296L1200 181M${edge + 101} 657L1200 600" stroke="#fff1db" opacity=".45" fill="none"/>
  </svg>`
  await mkdir(dirname(destination), { recursive: true })
  await sharp(Buffer.from(svg)).webp({ quality: 85 }).toFile(destination)
}

const batches = {
  mares: () => Promise.all([
    ...maresTargets.map(([name, width, height], index) => maresPlaceholder(`${mares}/${name}.webp`, width, height, index)),
    maresPlaceholder('showcase/img/mares-preview.webp', 1200, 1500, 0),
  ]),
  'ines-arranz': () => Promise.all([
    ...inesPortraits.map((name, index) => placeholder(`${ines}/${name}.webp`, 1080, 1350, inesPalette[index], '#1F1D2B')),
    placeholder(`${ines}/consulta-01.webp`, 1600, 1067, '#D9C8B6', '#1F1D2B'),
    ...inesPalette.map((color, index) => placeholder(`${ines}/blog-0${index + 1}.webp`, 1600, 1000, color, '#1F1D2B')),
    placeholder('showcase/img/ines-arranz-preview.webp', 1200, 1500, '#CFC8E8', '#1F1D2B'),
  ]),
  ruido: () => Promise.all([
    ...portraits.map((path) => placeholder(path, 1200, 1600)),
    ...landscapes.map((path) => placeholder(path, 1600, 1000)),
    placeholder('showcase/img/ruido-preview.webp', 1200, 1500),
  ]),
  'bar-caribe': () => Promise.all([
    placeholder(`${bar}/hero.webp`, 1600, 1000, '#684433', '#f3ecdd'),
    placeholder(`${bar}/sala.webp`, 1600, 1067, '#8d775d', '#1c1511'),
    placeholder(`${bar}/calle.webp`, 1600, 1067, '#c7aa7e', '#1c1511'),
    ...barPortraits.map((name, index) => placeholder(`${bar}/${name}.webp`, 1080, 1350, barPalette[index], '#1c1511')),
    placeholder('showcase/img/bar-caribe-preview.webp', 1200, 1500, '#0e5e50', '#f3ecdd'),
  ]),
}
const example = process.argv[2] ?? 'ruido'
if (!Object.hasOwn(batches, example)) throw new Error(`Unknown example: ${example}`)
await batches[example]()
