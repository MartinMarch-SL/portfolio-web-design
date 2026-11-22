import { describe, expect, it } from 'vitest'
import { categories, senior } from '../../src/examples/pinar-alto/data/season'
import { groups } from '../../src/examples/pinar-alto/data/competition'
import { standings } from '../../src/examples/pinar-alto/lib/competition'
import { calculateFee, categoryForBirthDate, registrationCode, validIdentity, validateStep } from '../../src/examples/pinar-alto/lib/registration'

describe('CB Pinar Alto', () => {
  it.each(categories)('assigns both boundaries of $name', ({ first, last, teams }) => {
    expect(categoryForBirthDate(first + '-01-01')?.team).toBe(teams[0])
    expect(categoryForBirthDate(last + '-12-31')?.team).toBe(teams[0])
  })

  it('checks the supported dates and uses the selected team schedule', () => {
    for (const date of ['2008-12-31', '2021-01-01', '2015-02-29', '2016-04-31', '2016-2-29', '']) {
      expect(categoryForBirthDate(date)).toBeUndefined()
      expect(validateStep(1, { birth: date }).birth).toBeTruthy()
    }
    expect(categoryForBirthDate('2016-02-29', true)?.team.name).toBe('Mini femenino')
    expect(categoryForBirthDate('2018-02-28', true)?.team.name).toBe('Premini A')
    expect(categories.flatMap(group => group.teams).concat(senior)).toHaveLength(16)
  })

  it('discounts the annual fee and divides the exact total in cents', () => {
    expect(calculateFee(280, true, true, 3)).toEqual({
      base: 28000, enrollment: 3500, discount: 2800, total: 28700, instalments: [9567, 9567, 9566],
    })
    expect(calculateFee(200, false, false, 1)).toEqual({
      base: 20000, enrollment: 0, discount: 0, total: 20000, instalments: [20000],
    })
    for (const { fee } of categories.flatMap(group => group.teams).concat(senior)) {
      const { instalments, total } = calculateFee(fee, true, true, 3)
      expect(instalments.reduce((sum, amount) => sum + amount, 0)).toBe(total)
    }
  })

  it('validates DNI and NIE letters and tutor authorizations in Spanish', () => {
    for (const id of ['12345678Z', ' x1234567l ', 'Y1234567X']) expect(validIdentity(id)).toBe(true)
    for (const id of ['12345678A', 'X1234567Z', 'X12345678L', '']) expect(validIdentity(id)).toBe(false)
    expect(validateStep(2, { identity: '12345678A' }).identity).toBe('Comprueba el número y la letra del DNI o NIE.')
    expect(validateStep(3, {})).toMatchObject({ phone: 'Introduce un teléfono español válido.', medical: 'Confirma la autorización médica.' })
    expect(validateStep(3, {
      guardian: 'Ana Gil', phone: '+34 612 345 678', email: 'ana@example.com', medical: 'si', image: 'no', privacy: 'si',
    })).toEqual({})
  })

  it('encodes a stable preinscription code', () => {
    const code = registrationCode('Ada|2016-02-29')
    expect(code).toMatch(/^CBPA-26-[A-Z0-9]{5}$/)
    expect(registrationCode(' ada|2016-02-29 ')).toBe(code)
    expect(registrationCode('Ada|2016-02-28')).not.toBe(code)
  })

  it.each(groups)('derives balanced standings for $name from played games', ({ teams, games }) => {
    const rows = standings(teams, games)
    expect(games.every(({ score: [a, b] }) => a !== b)).toBe(true)
    expect(rows.reduce((sum, row) => sum + row.diff, 0)).toBe(0)
    expect(rows.reduce((sum, row) => sum + row.won, 0)).toBe(games.length)
    expect(rows.map(row => row.played)).toEqual([3, 3, 3, 3])
    expect(rows.every(row => row.played === row.won + row.lost && row.points === 2 * row.won + row.lost)).toBe(true)
    expect(rows.map(row => row.points)).toEqual(rows.map(row => row.points).sort((a, b) => b - a))
  })
})
