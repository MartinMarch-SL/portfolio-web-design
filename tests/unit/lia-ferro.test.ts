import { describe, expect, it } from 'vitest'
import { estimate } from '../../src/examples/lia-ferro/lib/pricing'
import { availability, healingCalendar } from '../../src/examples/lia-ferro/lib/calendar'

describe('presupuesto Lía Ferro', () => {
  it('usa la superficie real de la referencia y respeta el precio base', () => {
    const quote = estimate(10, 'Fine line', 1, 1, false, 165, .5)
    expect(quote).toMatchObject({ area: 50, hours: 1.25, sessions: 1, low: 165, high: 185, deposit: 60 })
  })

  it('aplica estilo, dificultad, detalle y tinta y divide la duración en sesiones de hasta tres horas', () => {
    const quote = estimate(18, 'Ornamental', 1.4, 1.3, true)
    expect(quote).toEqual({ area: 324, factor: 1.4, colorFactor: 1.2, hours: 12.5, sessions: 5, low: 1130, high: 1440, deposit: 100 })
    expect(estimate(17, 'Blackwork', 1, 1, false).deposit).toBe(80)
  })
})

describe('calendarios Lía Ferro', () => {
  it('genera ocho semanas deterministas con huecos y horarios ocupados', () => {
    const today = new Date(2026, 10, 22)
    const days = availability(today)
    expect(days).toEqual(availability(today))
    expect(days).toHaveLength(56)
    expect(days[0].key).toBe('2026-11-23')
    expect(days[55].key).toBe('2027-01-17')
    expect(days.some(day => day.morning)).toBe(true)
    expect(days.some(day => !day.afternoon)).toBe(true)
  })

  it('escribe cinco citas de día completo con fechas y plegado RFC 5545', () => {
    const value = healingCalendar('2026-12-29', new Date('2026-11-22T09:12:13Z'))
    expect(value.match(/DTSTART;VALUE=DATE:(\d+)/g)).toEqual(['20261229', '20261231', '20270104', '20270111', '20270127'].map(date => 'DTSTART;VALUE=DATE:' + date))
    expect(value.match(/BEGIN:VALARM/g)).toHaveLength(5)
    expect(value).toContain('DTSTAMP:20261122T091213Z\r\n')
    expect(value).toContain('DTEND;VALUE=DATE:20270128\r\n')
    expect(value.split('\r\n').every(line => new TextEncoder().encode(line).length <= 75)).toBe(true)
    expect(value.endsWith('END:VCALENDAR\r\n')).toBe(true)
    expect(() => healingCalendar('2026-02-30')).toThrow(RangeError)
  })
})
