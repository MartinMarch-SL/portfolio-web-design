import { describe, expect, it } from 'vitest'
import { dateKey, monday, slotsFor } from '../../src/examples/ines-arranz/lib/agenda'
import { calendarFile, validateBooking } from '../../src/examples/ines-arranz/lib/booking'
import { matchesCategory, readingTime } from '../../src/examples/ines-arranz/lib/blog'

describe('agenda de Inés Arranz', () => {
  const now = new Date('2026-07-20T08:00:00Z')

  it('uses Madrid dates and a Monday-based week', () => {
    expect(dateKey(new Date('2026-07-19T23:00:00Z'))).toBe('2026-07-20')
    expect(monday('2026-07-26')).toBe('2026-07-20')
  })

  it('offers deterministic working hours with at least 24 hours notice', () => {
    const day = '2026-07-21'
    const slots = slotsFor(day, now, 'Online')
    expect(slots.map(slot => slot.label)).toEqual(['10:00', '12:00', '13:00', '16:00', '17:00', '18:00'])
    expect(slots[0].start.toISOString()).toBe('2026-07-21T08:00:00.000Z')
    expect(slots[0].end.toISOString()).toBe('2026-07-21T08:50:00.000Z')
    expect(slotsFor(day, now, 'Online')).toEqual(slots)
    expect(slotsFor('2026-07-24', now, 'Presencial').every(slot => +slot.label.slice(0, 2) < 14)).toBe(true)
    expect(slotsFor('2026-07-25', now, 'Online')).toEqual([])
    const call = slotsFor('2026-11-23', now, 'Llamada gratuita')[0]
    expect(call.start.toISOString()).toBe('2026-11-23T09:00:00.000Z')
    expect(call.end.toISOString()).toBe('2026-11-23T09:15:00.000Z')
  })

  it('validates contact details and consent', () => {
    expect(validateBooking({ name: ' Ana ', email: 'ana@example.com', phone: '+34 612 345 678', privacy: true }))
      .toEqual({ name: '', email: '', phone: '', privacy: '' })
    expect(Object.values(validateBooking({ name: ' ', email: 'ana@', phone: '+33 612 345 678', privacy: false })).every(Boolean))
      .toBe(true)
  })

  it('exports UTC calendar dates in an iCalendar event', () => {
    const slot = slotsFor('2026-07-21', now, 'Online')[0]
    const calendar = calendarFile(slot.start, slot.end, now)
    expect(calendar).toContain('DTSTAMP:20260720T080000Z\r\nDTSTART:20260721T080000Z\r\nDTEND:20260721T085000Z')
    expect(calendar).toMatch(/BEGIN:VCALENDAR[\s\S]+END:VCALENDAR\r\n$/)
  })
})

describe('blog de Inés Arranz', () => {
  it('counts words without Markdown link destinations and rounds up', () => {
    expect(readingTime('')).toBe(1)
    expect(readingTime('día '.repeat(199) + '[más](https://ejemplo.example/entrada)')).toBe(1)
    expect(readingTime('día '.repeat(201))).toBe(2)
  })

  it('matches the selected category or shows all', () => {
    expect(matchesCategory('Hábitos', '')).toBe(true)
    expect(matchesCategory('Hábitos', 'Hábitos')).toBe(true)
    expect(matchesCategory('Hábitos', 'Ansiedad')).toBe(false)
  })
})
