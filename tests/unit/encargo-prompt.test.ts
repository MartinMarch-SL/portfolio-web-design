import { describe, expect, it } from 'vitest'
import { buildJson, buildPrompt, filenames, slug } from '../../src/showcase/encargo/lib/prompt'
import type { Answers } from '../../src/showcase/encargo/data'

const answers: Answers = {
  business: 'Taller Ébano', sector: 'Otro', otherSector: 'Ebanistería', city: 'Madrid', offer: 'Muebles por encargo',
  goal: 'Ventas', audiences: ['Particulares', 'Profesionales'], difference: 'Roble recuperado', competition: 'Estudio Roble',
  brand: 'A diseñar', character0: '4', character3: '0', references: 'Cuadernos de taller',
  palette: 'Arcilla', mode: 'Oscuro', texture: 'Madera', pair: 'De autor', scale: 'Generosa',
  pages: ['Inicio', 'Tienda'], artifacts: ['muestrario', 'relieve'], motion: '3', tone: 'Técnico', address: 'Usted',
  photos: 'Propias', languages: ['Español', 'Inglés'], features: ['Tienda'], timing: 'Flexible',
  budget: 'Estándar', contact: 'Eva', email: 'eva@example.com', phone: '600123123', preference: 'Email',
}

describe('brief de encargo', () => {
  it('includes the complete brief with fixed sections and practical instructions', () => {
    const markdown = buildPrompt(answers)
    expect(markdown.match(/^## .+$/gm)).toHaveLength(15)
    for (const text of ['Taller Ébano', 'Ebanistería', 'Roble recuperado', 'Comprar', 'Particulares, Profesionales',
      'Instrument Serif', 'Madera', 'Tienda: Explorar productos', 'Muestrario plegable', 'Mapa de relieve táctil',
      'Escénico', 'Revise las especificaciones', 'Español, Inglés', 'Estándar', 'eva@example.com', '375 y 1440']) {
      expect(markdown).toContain(text)
    }
    expect(JSON.parse(buildJson(answers))).toEqual(answers)
  })
  it('supplies readable defaults for empty answers', () => {
    expect(buildPrompt({})).toContain('Sin indicar')
    expect(buildPrompt({})).not.toMatch(/undefined|null/i)
    expect(buildJson({})).toBe('{}')
  })
  it('describes existing and new identities independently', () => {
    const existing = buildPrompt({
      ...answers, brand: 'Existente', brandFonts: 'Archivo',
      logo: { name: 'marca.png', width: 300, height: 200, colors: ['#112233'] },
    })
    expect(existing).toContain('Respetar la identidad existente.')
    expect(existing).toContain('marca.png (300 × 200 px)')
    expect(existing).toContain('#112233')
    expect(existing).toContain('Fuentes de marca: Archivo')
    expect(existing).not.toContain('Personalidad:')
    const proposed = buildPrompt(answers)
    expect(proposed).toContain('Diseñar la identidad')
    expect(proposed).toContain('marcadamente contemporánea')
    expect(proposed).toContain('marcadamente artesanal')
  })
  it('writes hex CSS custom properties and swaps background and text in dark mode', () => {
    const markdown = buildPrompt({ brand: 'Existente', brandColor1: '#FFFFFF', brandColor2: '#111111',
      brandColor3: '#BAD', palette: 'Tu paleta', mode: 'Oscuro' })
    expect(markdown).toContain('--fondo: #111111;')
    expect(markdown).toContain('--texto: #FFFFFF;')
    expect(markdown.match(/--[a-z]+: #[0-9a-f]{6};/gi)).toHaveLength(3)
  })
  it('creates safe dated filenames for both documents', () => {
    expect(slug(' Café / Ébano & Cía. ')).toBe('cafe-ebano-cia')
    expect(slug(' / ')).toBe('encargo')
    expect(filenames(answers.business, new Date('2026-11-22T12:00:00Z'))).toEqual({
      base: '2026-11-22-taller-ebano', markdown: '2026-11-22-taller-ebano.md', json: '2026-11-22-taller-ebano.json',
    })
  })
})
