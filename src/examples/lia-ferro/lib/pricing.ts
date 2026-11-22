import type { Style } from '../data/flash'

const styleFactor: Record<Style, number> = { 'Fine line': 1, Blackwork: 1.25, Ornamental: 1.4 }

export function estimate(size: number, style: Style, difficulty: number, detail: number, color: boolean, base = 0, aspect = 1) {
  const area = size ** 2 * aspect
  const factor = styleFactor[style]
  const colorFactor = color ? 1.2 : 1
  const hours = Math.max(1, Math.ceil((.6 + area * .012 * factor * difficulty * detail * colorFactor) * 4) / 4)
  const sessions = Math.ceil(hours / 3)
  const low = Math.max(base, Math.ceil(hours * 90 / 10) * 10)
  const high = Math.max(low + 20, Math.ceil(hours * 115 / 10) * 10)
  const deposit = sessions === 1 ? 60 : sessions === 2 ? 80 : 100
  return { area, factor, colorFactor, hours, sessions, low, high, deposit }
}
