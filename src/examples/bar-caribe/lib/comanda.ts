import { dishes } from '../data/menu'

export type Line = { id: string; quantity: number }
export const storageKey = 'bar-caribe-comanda-v1'
export const dishById = new Map(dishes.map(dish => [dish.id, dish]))
const maxQuantity = 99

export function changeQuantity(lines: Line[], id: string, delta: 1 | -1): Line[] {
  if (!dishById.has(id)) return lines
  const previous = lines.find(line => line.id === id)
  if (!previous) return delta === 1 ? [...lines, { id, quantity: 1 }] : lines
  const quantity = Math.min(maxQuantity, previous.quantity + delta)
  return lines.flatMap(line => line.id !== id ? [line] : quantity ? [{ id, quantity }] : [])
}

export function total(lines: Line[]) {
  return lines.reduce((sum, line) => sum + (dishById.get(line.id)?.price ?? 0) * line.quantity, 0)
}

export function deserialize(raw: string | null): Line[] {
  try {
    const value: unknown = JSON.parse(raw ?? '[]')
    if (!Array.isArray(value)) return []
    const lines = new Map<string, Line>()
    for (const line of value) {
      if (line && dishById.has(line.id) && Number.isInteger(line.quantity) &&
          line.quantity > 0 && line.quantity <= maxQuantity && !lines.has(line.id)) {
        lines.set(line.id, { id: line.id, quantity: line.quantity })
      }
    }
    return [...lines.values()]
  } catch {
    return []
  }
}
export const serialize = (lines: Line[]) => JSON.stringify(lines)
