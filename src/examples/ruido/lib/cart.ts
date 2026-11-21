import { getProduct, type Product, type Size } from '../data/products'

export interface CartLine {
  slug: string
  size: Size
  color: string
  qty: number
}

const storageKey = 'ruido-cart-v1'
export const freeShippingAt = 120
export const shippingFee = 4.95
export const maxQty = 9
let storageWriteFailed = false
let memory: CartLine[] = []

export function addItem(lines: CartLine[], line: CartLine): CartLine[] {
  if (line.qty <= 0 || !Number.isFinite(line.qty)) return lines
  const index = lines.findIndex(({ slug, size, color }) =>
    slug === line.slug && size === line.size && color === line.color)
  if (index >= 0) return setQty(lines, index, lines[index].qty + line.qty)
  return setQty([...lines, line], lines.length, line.qty)
}

export function removeItem(lines: CartLine[], index: number): CartLine[] {
  return lines.filter((_, position) => position !== index)
}

export function setQty(lines: CartLine[], index: number, qty: number): CartLine[] {
  if (!Number.isFinite(qty)) return lines
  qty = Math.trunc(qty)
  if (qty <= 0) return removeItem(lines, index)
  return lines.map((line, position) => position === index ? { ...line, qty: Math.min(maxQty, qty) } : line)
}

export function subtotal(lines: CartLine[], products: Product[]): number {
  return lines.reduce((sum, line) => sum + line.qty * (products.find(({ slug }) => slug === line.slug)?.price ?? 0), 0)
}

export function shipping(sub: number): number {
  return sub > 0 && sub < freeShippingAt ? shippingFee : 0
}

export function loadCart(): CartLine[] {
  if (storageWriteFailed) return memory
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(storageKey) ?? '[]')
    memory = (Array.isArray(stored) ? stored : []).reduce<CartLine[]>((lines, line) => {
      if (!line || typeof line.slug !== 'string') return lines
      const product = getProduct(line.slug)
      if (!product?.colors.some(({ name }) => name === line.color)) return lines
      if (product.sizes.length ? !product.sizes.includes(line.size) : line.size !== 'M') return lines
      return typeof line.qty === 'number' ? addItem(lines, line) : lines
    }, [])
  } catch {
    // Keep the session cart if storage is unavailable.
  }
  return memory
}

export function saveCart(lines: CartLine[]): void {
  memory = lines
  try {
    localStorage.setItem(storageKey, JSON.stringify(lines))
    storageWriteFailed = false
  } catch {
    storageWriteFailed = true
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('ruido:cart'))
}
