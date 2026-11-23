import { describe, expect, it } from 'vitest'
import { filterCases } from '../../src/examples/halda/lib/cases'
import { estimate, optics, reference, validate } from '../../src/examples/halda/lib/estimate'

describe('HALDA', () => {
  it('samples the padded field at three pixels per defect on both axes', () => {
    const result = optics(100, 70, .2)!
    expect(result.sensor).toEqual([2448, 2048])
    expect(result.pixels).toEqual([1725, 1208])
    expect(result.frame[1]).toBeCloseTo(96.21)
    expect(result.distance).toEqual([183, 401])
    expect(result.fov[0]).toBeCloseTo(115)
    expect(result.fov[1]).toBeCloseTo(80.5)
    expect(optics(70, 100, .2)?.sensor).toEqual([2448, 2048])
    expect(optics(400, 200, .01)?.sensor).toBeUndefined()
    expect(optics(10, 10, 0)).toBeNull()
  })

  it('sizes the proof of concept by type and complexity', () => {
    expect(estimate('reading', 'standard').weeks).toBe(3)
    const high = estimate('hardware', 'high')
    expect(high.weeks).toBe(8)
    expect(high.phases.reduce((total, phase) => total + phase.weeks, 0)).toBe(8)
  })

  it('validates only the current step', () => {
    const valid = { type: 'guiding', sector: 'Logística', rate: '50', width: '60', height: '30', defect: '.1', environment: 'Polvo' }
    expect(validate(1, valid)).toEqual({})
    expect(validate(1, { ...valid, rate: 'Infinity', defect: '-1' })).toMatchObject({ rate: expect.any(String), defect: expect.any(String) })
    expect(validate(2, {})).toEqual({})
    expect(validate(3, { person: 'Ane', company: 'Taller', email: 'incompleto' })).toEqual({ email: 'Introduce un correo válido.' })
  })

  it('generates deterministic references and intersects both filters', () => {
    expect(reference('muestra')).toMatch(/^HLD-26-[0-9A-Z]{4}$/)
    expect(reference('muestra')).toBe(reference('muestra'))
    expect(reference('otra muestra')).not.toBe(reference('muestra'))
    expect(filterCases('', '')).toHaveLength(6)
    expect(filterCases('', 'Visión 3D')).toHaveLength(2)
    expect(filterCases('Fundición', 'Visión 3D').map(item => item.scene)).toEqual(['laser'])
    expect(filterCases('Fundición', 'Lectura DPM')).toEqual([])
  })
})
