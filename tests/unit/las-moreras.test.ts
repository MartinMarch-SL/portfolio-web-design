import { describe, expect, it } from 'vitest'
import { categories } from '../../src/examples/las-moreras/data/season'
import { available, bookingPrice, calendarFile, courts, hours, makeBooking, week } from '../../src/examples/las-moreras/lib/booking'
import { bookingCode, calculateFee, categoryForBirthDate, registrationCode, validEmail, validIdentity, validPhone } from '../../src/examples/las-moreras/lib/registration'

describe('escuela de Las Moreras', () => {
  it.each(categories)('delimita $name por años naturales', category => {
    expect(categoryForBirthDate(category.first + '-01-01')).toBe(category)
    expect(categoryForBirthDate(category.last + '-12-31')).toBe(category)
  })

  it('rechaza fechas imposibles y edades fuera de la escuela infantil', () => {
    for (const value of ['2009-12-31', '2022-01-01', '2017-02-29', '2016-13-01', '2016-4-01', '']) {
      expect(categoryForBirthDate(value)).toBeUndefined()
    }
    expect(categoryForBirthDate('2016-02-29')?.name).toBe('Alevín')
  })

  it('cuadra todos los descuentos, meses y días al céntimo', () => {
    const junior = categories[5]
    expect(calculateFee(categories[0], 1, false, false, 'monthly').total).toBe(7500)
    expect(calculateFee(junior, 3, true, true, 'quarterly')).toEqual({
      base: 42000, memberDiscount: 6300, siblingDiscount: 3570, quarterlyDiscount: 1607, tuition: 30523, enrollment: 3000, total: 33523,
    })
    for (const category of categories) for (const days of [1, 2, 3] as const) {
      for (const period of ['monthly', 'quarterly'] as const) {
        for (const member of [true, false]) for (const sibling of [true, false]) {
          const fee = calculateFee(category, days, member, sibling, period)
          expect(fee.base).toBe(category.fees[days - 1] * 100 * (period === 'quarterly' ? 3 : 1))
          expect(fee.total + fee.memberDiscount + fee.siblingDiscount + fee.quarterlyDiscount).toBe(fee.base + fee.enrollment)
        }
      }
    }
  })

  it('valida DNI y NIE, teléfono español y correo', () => {
    expect(validIdentity(' 12345678z ')).toBe(true)
    expect(validIdentity('X2482300W')).toBe(true)
    expect(validIdentity('12345678A')).toBe(false)
    expect(validIdentity('X2482300A')).toBe(false)
    expect(validPhone('+34 612 345 678')).toBe(true)
    expect(validPhone('0034 961-234-567')).toBe(true)
    expect(validPhone('123456789')).toBe(false)
    expect(validEmail('ana+club@example.com')).toBe(true)
    expect(validEmail('ana@example')).toBe(false)
  })
})

describe('reservas de Las Moreras', () => {
  const now = new Date(2026, 11, 31, 7)
  const dates = week(now)
  const slots = courts.flatMap(court => hours.map(hour => ({ date: dates[1], court: court.id, hour })))
  const free = slots.filter(slot => available(slot))

  it('genera siete fechas y ocupación determinista', () => {
    expect(dates).toEqual(['2026-12-31', '2027-01-01', '2027-01-02', '2027-01-03', '2027-01-04', '2027-01-05', '2027-01-06'])
    expect(courts).toHaveLength(13)
    expect(hours).toHaveLength(14)
    expect(free.length).toBeGreaterThan(2)
    expect(free.length).toBeLessThan(slots.length)
    expect(slots.filter(slot => available(slot))).toEqual(free)
    expect(available(free[0], [free[0]])).toBe(false)
    expect(available({ ...free[0], hour: 22 })).toBe(false)
    expect(available({ ...free[0], date: '2027-02-29' })).toBe(false)
  })

  it('aplica tarifa por superficie y luz a partir de las 19:00', () => {
    expect(bookingPrice(1, 18, true)).toEqual({ base: 600, lights: 0, total: 600 })
    expect(bookingPrice(1, 19, false)).toEqual({ base: 1200, lights: 400, total: 1600 })
    expect(bookingPrice(9, 21, true)?.total).toBe(900)
    expect(bookingPrice(13, 8, false)?.total).toBe(600)
    expect(bookingPrice(14, 8, false)).toBeUndefined()
  })

  it('limita a dos reservas activas e incluye un turno de una hora en el calendario', () => {
    const first = makeBooking(free[0], true, 2, [], now)!
    const second = makeBooking(free[1], false, 4, [first], now)!
    expect(first.code).not.toBe(second.code)
    expect(makeBooking(free[0], true, 2, [first], now)).toBeUndefined()
    expect(makeBooking(free[1], false, 5, [first], now)).toBeUndefined()
    expect(makeBooking(free[2], false, 4, [first, second], now)).toBeUndefined()
    expect(makeBooking(free[2], false, 4, [{ ...first, date: '2026-12-24' }, second], now)).toBeDefined()
    const file = calendarFile(first, now)
    expect(file).toContain(`DTSTART:20270101T${String(first.hour).padStart(2, '0')}0000\r\nDTEND:20270101T${String(first.hour + 1).padStart(2, '0')}0000`)
  })

  it('genera códigos estables con los dos prefijos', () => {
    expect(registrationCode(' ÉL ')).toBe(registrationCode('e\u0301l'))
    expect(registrationCode('Él')).toMatch(/^CTM-26-[A-Z0-9]{5}$/)
    expect(bookingCode('pista')).toMatch(/^CTM-R-[A-Z0-9]{5}$/)
  })
})
