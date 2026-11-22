import { describe, expect, it } from 'vitest'
import { calculateFee, categoryForBirthDate, registrationCode, validateStep, validIdentity } from '../../src/examples/los-almendros/lib/registration'
import { footballPanels } from '../../src/examples/los-almendros/lib/football'
import { standings } from '../../src/examples/los-almendros/data/season'

describe('Categorías de Los Almendros', () => {
  it.each([
    [2008, 2010, 'Juvenil'], [2011, 2012, 'Cadete'], [2013, 2014, 'Infantil'],
    [2015, 2016, 'Alevín'], [2017, 2018, 'Benjamín'], [2019, 2020, 'Prebenjamín'], [2021, 2022, 'Chupetines'],
  ])('clasifica los dos extremos de cada año entre %i y %i', (first, last, label) => {
    for (let year = first; year <= last; year++) {
      expect(categoryForBirthDate(year + '-01-01')?.label).toBe(label)
      expect(categoryForBirthDate(year + '-12-31')?.label).toBe(label)
    }
  })

  it('distingue los tres grupos femeninos y rechaza fechas inválidas o fuera de rango', () => {
    expect(categoryForBirthDate('2018-01-01', true)?.label).toBe('Benjamín femenino')
    expect(categoryForBirthDate('2016-02-29', true)?.label).toBe('Alevín femenino')
    expect(categoryForBirthDate('2014-01-01', true)?.label).toBe('Infantil femenino')
    expect(categoryForBirthDate('2019-01-01', true)?.label).toBe('Prebenjamín')
    for (const date of ['', '2007-12-31', '2023-01-01', '2015-02-29', '2018-02-31']) {
      expect(categoryForBirthDate(date)).toBeUndefined()
    }
  })
})

it('aplica el descuento a la cuota y reparte los céntimos sin perderlos', () => {
  const fee = calculateFee(280, true, true, 3)
  expect(fee).toEqual({ base: 28000, discount: 2800, enrollment: 4000, total: 29200, instalments: [9734, 9733, 9733] })
  expect(fee.instalments.reduce((sum, amount) => sum + amount, 0)).toBe(fee.total)
  expect(calculateFee(340, false, false, 1).instalments).toEqual([34000])
})

it('valida DNI y NIE, contacto y autorizaciones', () => {
  expect(validIdentity('12345678Z')).toBe(true)
  expect(validIdentity(' x1234567l ')).toBe(true)
  expect(validIdentity('12345678A')).toBe(false)
  expect(validateStep(1, { birth: '2023-01-01' }).birth).toMatch(/entre 2008 y 2022/)
  expect(validateStep(2, { identity: '12345678A' }).identity).toMatch(/DNI o NIE/)
  expect(Object.keys(validateStep(3, { phone: '123', email: 'sin-arroba' }))).toEqual(['guardian', 'phone', 'email', 'medical', 'image', 'privacy'])
  expect(validateStep(3, { guardian: 'Ada Ruiz', phone: '+34 612 345 678', email: 'ada@example.com', medical: 'si', image: 'no', privacy: 'si' })).toEqual({})
})

it('genera un código reproducible para la temporada', () => {
  const code = registrationCode('Ada|Ruiz|2016-02-29|ada@example.com')
  expect(code).toMatch(/^ALM-26-[A-Z0-9]{5}$/)
  expect(registrationCode(' ADA|RUIZ|2016-02-29|ADA@EXAMPLE.COM ')).toBe(code)
  expect(registrationCode('Otra ficha')).not.toBe(code)
})

it('equilibra las clasificaciones y construye los 32 paneles del balón', () => {
  for (const { rows } of standings) {
    expect(new Set(rows.map(row => row.name)).size).toBe(11)
    const sum = (key: 'won' | 'lost' | 'goals' | 'conceded') => rows.reduce((total, row) => total + row[key], 0)
    expect(sum('won')).toBe(sum('lost'))
    expect(sum('goals')).toBe(sum('conceded'))
    expect(rows.every((row, i) => row.points === row.won * 3 + row.drawn && (i === 0 || row.points <= rows[i - 1].points))).toBe(true)
  }
  const panels = footballPanels()
  expect(panels.filter(panel => panel.points.length === 5)).toHaveLength(12)
  expect(panels.filter(panel => panel.points.length === 6)).toHaveLength(20)
  const edges = new Map<string, number>()
  for (const { points } of panels) {
    const ids = points.map(point => point.map(axis => axis.toFixed(6)).join(','))
    for (const [index, id] of ids.entries()) {
      const edge = [id, ids[(index + 1) % ids.length]].sort().join('|')
      edges.set(edge, (edges.get(edge) ?? 0) + 1)
    }
  }
  expect(edges.size).toBe(90)
  expect([...edges.values()].every(count => count === 2)).toBe(true)
})
