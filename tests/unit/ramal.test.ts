import { describe, expect, it } from 'vitest'
import { estimate, reference, validEmail, validPhone, validTaxId, validateStep } from '../../src/examples/ramal/lib/offer'
import { filterProjects } from '../../src/examples/ramal/lib/projects'

describe('validación de oferta RAMAL', () => {
  it('comprueba el carácter de control del CIF y del NIF', () => {
    for (const id of ['12345678-Z', 'B99286320', 'P1234567D', ' J12345674 ']) expect(validTaxId(id), id).toBe(true)
    for (const id of ['12345678X', 'B9928632J', 'P12345674', 'B99286321', '']) expect(validTaxId(id), id).toBe(false)
  })

  it('valida correo y teléfono con prefijo opcional', () => {
    expect(validEmail('coord.bim+obra@instalaciones.example')).toBe(true)
    expect(validEmail('coord..bim@instalaciones.example')).toBe(false)
    expect(validEmail('coord@-instalaciones.example')).toBe(false)
    expect(validEmail('coord@instalaciones')).toBe(false)
    for (const phone of ['976 123 456', '+34 600-123-456', '0033 123456789']) expect(validPhone(phone), phone).toBe(true)
    for (const phone of ['123', '+34 1234', 'abc 600123456', '012345678']) expect(validPhone(phone), phone).toBe(false)
  })

  it('valida los datos de proyecto y permite avanzar sin adjuntos', () => {
    const values = { sector: 'logistica', location: 'Zuera', area: '8000', phase: 'Licitación' }
    expect(validateStep(1, values, ['pci'])).toEqual({})
    expect(validateStep(1, { ...values, area: 'Infinity' }, ['desconocida'])).toHaveProperty('area')
    expect(validateStep(1, values, [])).toHaveProperty('disciplines')
    expect(validateStep(2, {}, [])).toEqual({})
  })

  it('genera referencias deterministas con cuatro caracteres', () => {
    expect(reference('Obra · Zuera')).toMatch(/^RML-OF-26-[A-Z0-9]{4}$/)
    expect(reference('Obra · Zuera')).toBe(reference('Obra · Zuera'))
    expect(reference('Obra · Zuera')).not.toBe(reference('Obra · Huesca'))
  })
})

describe('estimador RAMAL', () => {
  it('rechaza entradas fuera de rango y disciplinas desconocidas', () => {
    expect(estimate(Infinity, 'oficinas', ['pci'])).toBeNull()
    expect(estimate(0, 'oficinas', ['pci'])).toBeNull()
    expect(estimate(2500, 'otro', ['pci'])).toBeNull()
    expect(estimate(2500, 'oficinas', [])).toBeNull()
    expect(estimate(2500, 'oficinas', ['otro'])).toBeNull()
  })

  it('pondera superficie, uso y disciplinas y devuelve solo plazo y equipo', () => {
    const base = estimate(4000, 'logistica', ['electricidad'])!
    const full = estimate(20000, 'sanitario', ['electricidad', 'clima', 'pci'])!
    expect(Object.keys(base).sort()).toEqual(['crew', 'maxWeeks', 'minWeeks'])
    expect(base.maxWeeks).toBeGreaterThan(base.minWeeks)
    expect(full.minWeeks).toBeGreaterThan(base.minWeeks)
    expect(full.crew).toBeGreaterThan(base.crew)
    expect(estimate(4000, 'logistica', ['electricidad', 'electricidad'])).toEqual(base)
  })
})

describe('filtro de obras RAMAL', () => {
  it('combina sector y disciplina y recupera las seis fichas al limpiar filtros', () => {
    expect(filterProjects()).toHaveLength(6)
    expect(filterProjects('logistica', 'fotovoltaica')).toHaveLength(2)
    expect(filterProjects('logistica', 'pci').map(project => project.slug)).toEqual(['plataforma-soto-norte'])
    expect(filterProjects('hotelero', 'fotovoltaica')).toEqual([])
    expect(filterProjects('', 'control')).toHaveLength(3)
  })
})
