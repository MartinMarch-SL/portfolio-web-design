import { afterEach, expect, it, vi } from 'vitest'
import { addItem, loadCart, setQty, shipping, type CartLine } from '../../src/examples/ruido/lib/cart'

const line: CartLine = { slug: 'ronda', size: 'S', color: 'Tiza', qty: 1 }

afterEach(() => vi.unstubAllGlobals())

it('merges duplicate variants', () => {
  expect(addItem([line], line)).toEqual([{ ...line, qty: 2 }])
})

it('caps quantities at 9', () => {
  expect(addItem([{ ...line, qty: 9 }], line)).toEqual([{ ...line, qty: 9 }])
  expect(setQty([line], 0, 10)).toEqual([{ ...line, qty: 9 }])
})

it('removes a line at zero quantity', () => {
  expect(setQty([line], 0, 0)).toEqual([])
})

it.each([[119.99, 4.95], [120, 0], [0, 0]])('charges shipping on %s: %s', (sub, expected) => {
  expect(shipping(sub)).toBe(expected)
})

it('loads an empty cart when storage throws', () => {
  vi.stubGlobal('localStorage', { getItem: () => { throw new Error('Storage unavailable') } })
  expect(loadCart()).toEqual([])
})
