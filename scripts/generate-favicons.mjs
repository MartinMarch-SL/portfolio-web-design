import { mkdir, readFile, writeFile } from 'node:fs/promises'
import sharp from 'sharp'

const examples = [
  ['ruido', 'RUIDO', '#0E0E0E'],
  ['bar-caribe', 'Bar Caribe', '#1E1915'],
  ['mares', 'Marès', '#5E6146'],
  ['ines-arranz', 'Inés Arranz', '#202227'],
  ['simon-lera', 'Simón Lera', '#6F6455'],
  ['lia-ferro', 'Lía Ferro', '#17191D'],
  ['los-almendros', 'UD Los Almendros', '#0F3A2B'],
]
const resultsDir = new URL('../test-results/', import.meta.url)
const icoSizes = [16, 32, 48]

function render(svg, size, background) {
  const image = sharp(svg, { density: 72 * size / 64 })
  if (background) image.flatten({ background })
  return image.png({ palette: size >= 180 }).toBuffer()
}

function packIco(frames) {
  // The six-byte header is followed by one 16-byte directory entry per PNG.
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

  return Buffer.concat([directory, ...frames])
}

async function generateExample([name, label, background]) {
  const directory = new URL(`../public/examples/${name}/icons/`, import.meta.url)
  const svg = await readFile(new URL('favicon.svg', directory))
  const [frames, touch, large] = await Promise.all([
    Promise.all(icoSizes.map(size => render(svg, size))),
    render(svg, 180, background),
    render(svg, 512),
  ])

  await Promise.all([
    writeFile(new URL('favicon.ico', directory), packIco(frames)),
    writeFile(new URL('apple-touch-icon.png', directory), touch),
    writeFile(new URL('icon-512.png', directory), large),
  ])

  return { label, icons: [frames[0], frames[1], touch] }
}

async function writeSheet(rows) {
  const panelWidth = 480
  const rowHeight = 210
  const headerHeight = 70
  const width = panelWidth * 2
  const height = headerHeight + rows.length * rowHeight
  const columns = [{ size: 16, x: 180 }, { size: 32, x: 235 }, { size: 180, x: 367 }]
  const panels = [
    { label: 'Fondo claro', background: '#F3F1EC', text: '#202227' },
    { label: 'Fondo oscuro', background: '#141414', text: '#ECEAE6' },
  ]
  const icons = []
  const labels = panels.map(({ label, background, text }, panelIndex) => {
    const left = panelIndex * panelWidth
    const rowLabels = rows.map((row, rowIndex) => {
      const y = headerHeight + rowIndex * rowHeight
      for (const [index, { size, x }] of columns.entries()) {
        icons.push({
          input: row.icons[index],
          left: left + x - size / 2,
          top: y + (rowHeight - size) / 2,
        })
      }
      return `<path d="M24 ${y}H456" stroke="${text}" opacity=".17"/>
        <text x="24" y="${y + rowHeight / 2}" dominant-baseline="middle">${row.label}</text>`
    })

    return `<g transform="translate(${left} 0)" fill="${text}" font-family="sans-serif">
      <rect width="${panelWidth}" height="${height}" fill="${background}"/>
      <text x="24" y="38" font-size="20" font-weight="bold">${label}</text>
      <g font-size="12" text-anchor="middle">
        ${columns.map(({ size, x }) => `<text x="${x}" y="57">${size} px</text>`).join('')}
      </g>
      <g font-size="17">${rowLabels.join('')}</g>
    </g>`
  })
  const backdrop = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${labels.join('')}</svg>`,
  )

  await mkdir(resultsDir, { recursive: true })
  const sheet = await sharp(backdrop).composite(icons).png().toBuffer()
  await writeFile(new URL('favicons-sheet.png', resultsDir), sheet)
}

await writeSheet(await Promise.all(examples.map(generateExample)))
