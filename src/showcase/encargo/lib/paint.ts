import { artifacts, goals, selectedPair, selectedPalette, textures, tones, type Answers } from '../data'

const tiles = new Map<number, HTMLCanvasElement>()

function tile(index: number) {
  const existing = tiles.get(index)
  if (existing) return existing
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 160
  const ctx = canvas.getContext('2d')!
  const pixels = ctx.createImageData(160, 160)
  let seed = 9847
  for (let y = 0; y < 160; y++) {
    for (let x = 0; x < 160; x++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      const noise = seed / 4294967296 - .5
      let shade = noise * 30
      switch (index) {
        case 1: shade += 23 * ((x % 4 === 0 ? 1 : 0) - (y % 5 === 0 ? 1 : 0)); break
        case 2: shade = noise * 48 + 12 * Math.sin(x * .12 + Math.cos(y * .18)); break
        case 3: shade = noise * 95; break
        case 4: shade = Math.sin((x + y * 2) * Math.PI / 80) * 21 + noise * 6; break
        case 5: shade = 14 * Math.sin(y * 2.7) + 22 * Math.cos(y * Math.PI / 80) + noise * 11; break
        case 6: shade += 31 * Math.sin(x * Math.PI / 40 + Math.sin(y * Math.PI / 20)); break
        case 7: shade = 26 * Math.sin(x * Math.PI / 10 + .7 * Math.sin(y * Math.PI / 80)) + noise * 15; break
      }
      const offset = (y * 160 + x) * 4
      pixels.data.fill(shade > 0 ? 255 : 0, offset, offset + 3)
      pixels.data[offset + 3] = Math.abs(shade)
    }
  }
  ctx.putImageData(pixels, 0, 0)
  tiles.set(index, canvas)
  return canvas
}

export function surface(ctx: CanvasRenderingContext2D, index: number, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = ctx.createPattern(tile(index), 'repeat')!
  ctx.fillRect(x, y, w, h)
}

function glyph(ctx: CanvasRenderingContext2D, id: string, size: number) {
  ctx.save()
  ctx.scale(size / 100, size / 100)
  ctx.lineWidth = 1.4
  ctx.strokeRect(6, 6, 88, 88)
  switch (id) {
    case 'plano':
      ctx.strokeRect(19, 19, 62, 62)
      ctx.strokeRect(40, 19, 12, 38)
      ctx.strokeRect(19, 57, 62, 24)
      break
    case 'anamorfosis':
      ctx.transform(1, -.36, 0, 1, 0, 22)
      for (let i = 19; i < 77; i += 19) ctx.strokeRect(i, 32, 13, 37)
      break
    case 'lienzo':
      ctx.strokeRect(19, 22, 62, 56)
      ctx.strokeRect(25, 28, 50, 44)
      ctx.beginPath(); ctx.moveTo(25, 70); ctx.lineTo(75, 30); ctx.stroke()
      break
    case 'escaner':
      ctx.beginPath(); ctx.arc(50, 30, 8, 0, Math.PI * 2)
      ctx.moveTo(50, 39); ctx.lineTo(50, 64); ctx.lineTo(37, 79)
      ctx.moveTo(50, 64); ctx.lineTo(63, 79)
      ctx.moveTo(33, 55); ctx.lineTo(50, 40); ctx.lineTo(67, 55)
      ctx.moveTo(19, 59); ctx.lineTo(81, 59); ctx.stroke()
      break
    case 'muestrario':
      ctx.translate(50, 70)
      for (const angle of [-.7, 0, .7]) {
        ctx.save(); ctx.rotate(angle); ctx.strokeRect(-9, -46, 18, 50); ctx.restore()
      }
      break
    case 'bitacora':
      ctx.strokeRect(25, 18, 50, 64)
      for (let i = 34; i < 73; i += 10) {
        ctx.beginPath(); ctx.moveTo(34, i); ctx.bezierCurveTo(50, i - 12, 41, i + 10, 66, i - 3); ctx.stroke()
      }
      break
    case 'negativos':
      ctx.strokeRect(16, 33, 68, 34)
      for (let i = 22; i < 80; i += 20) ctx.strokeRect(i, 40, 16, 20)
      break
    case 'reloj':
      ctx.beginPath(); ctx.ellipse(50, 55, 30, 22, 0, 0, Math.PI * 2)
      ctx.moveTo(50, 30); ctx.lineTo(50, 55); ctx.lineTo(78, 64); ctx.stroke()
      break
    case 'relieve':
      for (let i = 0; i < 4; i++) {
        ctx.beginPath(); ctx.ellipse(50, 53 - i * 2, 33 - i * 7, 24 - i * 5, -.35, 0, Math.PI * 2); ctx.stroke()
      }
      break
    case 'carta':
      ctx.beginPath(); ctx.moveTo(18, 29); ctx.lineTo(38, 19); ctx.lineTo(62, 29); ctx.lineTo(82, 19)
      ctx.lineTo(82, 70); ctx.lineTo(62, 80); ctx.lineTo(38, 70); ctx.lineTo(18, 80); ctx.closePath()
      ctx.moveTo(38, 19); ctx.lineTo(38, 70); ctx.moveTo(62, 29); ctx.lineTo(62, 80); ctx.stroke()
      break
    default:
      for (let i = 0; i < 6; i++) {
        ctx.beginPath(); ctx.ellipse(50, 50, 31, 14, i * Math.PI / 6, 0, Math.PI * 2); ctx.stroke()
      }
  }
  ctx.restore()
}

function wrap(ctx: CanvasRenderingContext2D, text: string, width: number, maxLines: number) {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(/\s+/)) {
    if (line && ctx.measureText(line + ' ' + word).width > width) {
      lines.push(line)
      line = word
    } else line = line ? line + ' ' + word : word
  }
  if (line) lines.push(line)
  if (lines.length > maxLines) return [...lines.slice(0, maxLines - 1), lines.slice(maxLines - 1).join(' ')]
  return lines
}

export function paint(canvas: HTMLCanvasElement, answers: Answers, phone: boolean) {
  const ctx = canvas.getContext('2d')!
  const { width: w, height: h } = canvas
  const [, paper, ink, accent] = selectedPalette(answers)
  const [, heading, body, headingWeight, bodyWeight] = selectedPair(answers)
  const dark = answers.mode === 'Oscuro'
  const bg = dark ? ink : paper
  const fg = dark ? paper : ink
  const title = answers.business?.trim() || 'Tu negocio'
  const nav = answers.pages?.length ? answers.pages : ['Inicio', 'Contacto']
  const inset = phone ? 21 : 44
  const label = (size: number) => `${bodyWeight} ${size}px "${body}", sans-serif`
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)
  surface(ctx, Math.max(0, textures.indexOf(answers.texture ?? '')), 0, 0, w, h)
  ctx.fillStyle = fg
  ctx.strokeStyle = fg
  ctx.globalAlpha = .38
  for (const y of [70, 444]) ctx.fillRect(inset, y, w - inset * 2, 1)
  ctx.globalAlpha = 1
  ctx.textBaseline = 'alphabetic'
  ctx.font = label(phone ? 13 : 15)
  if (!phone) {
    ctx.fillText(title, inset, 49, 160)
    ctx.textAlign = 'right'
    ctx.fillText(nav.join('   /   '), w - inset, 49, w - inset * 2 - 174)
    ctx.textAlign = 'left'
  } else {
    const lines = wrap(ctx, nav.join('  /  '), w - inset * 2, 3)
    lines.forEach((line, i) => ctx.fillText(line, inset, 25 + i * 16, w - inset * 2))
  }
  ctx.font = label(phone ? 12 : 15)
  ctx.fillText([answers.sector === 'Otro' ? answers.otherSector : answers.sector, answers.city].filter(Boolean).join(' · ').toUpperCase() || 'PRESENTACIÓN', inset, 123, phone ? w - inset * 2 : 450)
  const headlineWidth = phone ? w - 2 * inset : 465
  const headingSize = phone ? (answers.scale === 'Generosa' ? 50 : 43) : (answers.scale === 'Generosa' ? 96 : 79)
  ctx.font = `${headingWeight} ${headingSize}px "${heading}", Georgia, serif`
  const lines = wrap(ctx, title, headlineWidth, phone ? 3 : 2)
  lines.forEach((line, i) => ctx.fillText(line, inset, (phone ? 177 : 218) + i * headingSize * .82, headlineWidth))
  const action = answers.goal && Object.hasOwn(goals, answers.goal) ? goals[answers.goal as keyof typeof goals] : 'Descubrir'
  const tone = answers.tone && Object.hasOwn(tones, answers.tone) ? tones[answers.tone] : undefined
  const offer = answers.offer?.trim() || tone?.[answers.address === 'Usted' ? 1 : 0] || 'Conoce lo que hacemos.'
  ctx.font = label(phone ? 14 : 20)
  ctx.fillText(offer, inset, phone ? 306 : 335, headlineWidth)
  ctx.fillStyle = fg
  ctx.fillRect(inset, phone ? 325 : 361, phone ? 104 : 133, phone ? 35 : 45)
  ctx.fillStyle = bg
  ctx.font = label(phone ? 15 : 19)
  ctx.fillText(action, inset + 12, phone ? 348 : 390, 105)
  const chosen = artifacts.filter(([id]) => answers.artifacts?.includes(id))
  const designs = chosen.length ? chosen.map(([id]) => id) : ['']
  ctx.fillStyle = fg
  ctx.strokeStyle = fg
  if (phone) {
    ctx.fillStyle = accent
    ctx.globalAlpha = .26
    ctx.fillRect(w - inset - designs.length * 70, 367, designs.length * 70, 68)
    ctx.globalAlpha = 1
    designs.forEach((id, i) => {
      ctx.save(); ctx.translate(w - inset - 68 - i * 70, 367); glyph(ctx, id, 68); ctx.restore()
    })
  } else {
    ctx.fillStyle = accent
    ctx.globalAlpha = .23
    ctx.fillRect(w - 301, 101, 257, 305)
    ctx.globalAlpha = 1
    ctx.strokeStyle = fg
    designs.forEach((id, i) => {
      const size = designs.length === 2 ? 119 : 208
      ctx.save(); ctx.translate(w - 292 + i * 115 + (designs.length === 1 ? 16 : 0), designs.length === 1 ? 147 : 178)
      glyph(ctx, id, size); ctx.restore()
    })
    if (chosen.length) {
      ctx.fillStyle = fg
      ctx.font = label(14)
      ctx.fillText(chosen.map(([, name]) => name).join(' / '), w - 286, 384, 227)
    }
  }
  ctx.font = label(phone ? 15 : 19)
  ctx.fillStyle = fg
  const blocks = action === 'Comprar' ? ['Selección', 'Colecciones', 'Envíos']
    : action === 'Reservar' ? ['Disponibilidad', 'Tu visita', 'Ubicación']
    : action === 'Ver obra' ? ['Proyectos', 'Proceso', 'Estudio']
    : action === 'Participar' ? ['Encuentros', 'Novedades', 'Comunidad']
    : action === 'Saber más' ? ['Guía', 'Recursos', 'Preguntas']
    : ['Servicios', 'Sobre nosotros', 'Contacto']
  const count = phone ? 2 : blocks.length
  const col = (w - 2 * inset) / count
  blocks.slice(0, count).forEach((block, i) => {
    ctx.fillText(block, inset + col * i, 479, col - 8)
    ctx.globalAlpha = .35
    ctx.fillRect(inset + col * i, 497, col * .65, 1)
    ctx.fillRect(inset + col * i, 505, col * .45, 1)
    ctx.globalAlpha = 1
  })
}
