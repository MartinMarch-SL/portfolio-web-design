import { describe, expect, it } from 'vitest'
import { changeQuantity, deserialize, serialize, total } from '../../src/examples/bar-caribe/lib/comanda'
import { slots, validateReservation } from '../../src/examples/bar-caribe/lib/reservations'
import { dailyMenu, madridDay } from '../../src/examples/bar-caribe/lib/service'

describe('menú del día', () => {
  it('closes on Monday and serves a different menu each other day', () => {
    expect(dailyMenu('2026-11-23')).toBeNull()
    const menus = Array.from({ length: 6 }, (_, i) => dailyMenu(`2026-11-${24 + i}`))
    expect(menus.every(menu => menu?.length === 2)).toBe(true)
    expect(new Set(menus.map(menu => menu?.join())).size).toBe(6)
  })
  it('uses the local day in Madrid', () => {
    expect(madridDay(new Date('2026-11-22T23:30:00Z'))).toBe('2026-11-23')
  })
})

describe('comanda', () => {
  it('adds and removes portions, sums cents and round-trips the order', () => {
    const one = changeQuantity([], 'croquetas', 1)
    const two = changeQuantity(one, 'croquetas', 1)
    const order = changeQuantity(two, 'tortilla', 1)
    expect(total(order)).toBe(1920)
    expect(deserialize(serialize(order))).toEqual(order)
    expect(changeQuantity(two, 'croquetas', -1)).toEqual(one)
    expect(changeQuantity(one, 'croquetas', -1)).toEqual([])
    expect(changeQuantity([], 'unknown', 1)).toEqual([])
  })
  it('ignores malformed storage, duplicate rows and invalid quantities', () => {
    expect(deserialize('{')).toEqual([])
    expect(deserialize('{}')).toEqual([])
    expect(deserialize(JSON.stringify([
      null, { id: 'missing', quantity: 1 }, { id: 'croquetas', quantity: -1 },
      { id: 'croquetas', quantity: 2 }, { id: 'croquetas', quantity: 5 }, { id: 'tortilla', quantity: 1.5 },
    ]))).toEqual([{ id: 'croquetas', quantity: 2 }])
  })
})

describe('reservas', () => {
  const today = '2026-11-21'
  const booking = { name: 'Ana', phone: '+34 612 345 678', date: '2026-11-24', time: '13:00', guests: 8 }
  it('accepts all kitchen slots including both endpoints', () => {
    expect(slots).toHaveLength(15)
    for (const time of ['13:00', '16:00', '20:00', '23:30']) {
      expect(validateReservation({ ...booking, time }, today)).toBeNull()
    }
    for (const time of ['12:30', '13:15', '16:30', '19:30', '24:00']) {
      expect(validateReservation({ ...booking, time }, today)).toMatch(/hora/)
    }
  })
  it('rejects Mondays, past dates and dates that roll over', () => {
    expect(validateReservation({ ...booking, date: '2026-11-23' }, today)).toMatch(/lunes/)
    expect(validateReservation({ ...booking, date: '2026-11-20' }, today)).toMatch(/hoy/)
    expect(validateReservation({ ...booking, date: '2026-11-31' }, today)).toMatch(/válido/)
  })
  it('validates party size, name and Spanish telephone', () => {
    for (const guests of [0, 1.5, 13]) expect(validateReservation({ ...booking, guests }, today)).toMatch(/1 a 12/)
    for (const guests of [9, 12]) expect(validateReservation({ ...booking, guests }, today)).toMatch(/llámanos/)
    expect(validateReservation({ ...booking, name: ' ' }, today)).toMatch(/nombre/)
    expect(validateReservation({ ...booking, phone: '+44 612 345 678' }, today)).toMatch(/teléfono/)
  })
})
