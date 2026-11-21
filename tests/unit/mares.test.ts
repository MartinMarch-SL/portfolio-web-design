import { describe, expect, it } from 'vitest'
import { properties } from '../../src/examples/mares/data/properties'
import { areaStats, filterListings, readListing, writeListing } from '../../src/examples/mares/lib/listing'
import { mortgage, valuation } from '../../src/examples/mares/lib/finance'

describe('Listado de Marès', () => {
  it('serializa filtros repetidos y conserva el orden y la vista', () => {
    const query = readListing(new URLSearchParams('operacion=venta&barrio=genova&precio=1500000&habitaciones=4&extras=piscina&extras=terraza&orden=precio-desc&vista=mapa'))
    expect(readListing(writeListing(query))).toEqual(query)
    expect(filterListings(properties, query).map(property => property.slug)).toEqual(['finca-del-olivar', 'casa-de-los-almendros'])
  })

  it('ignora parámetros no válidos, y los extras duplicados', () => {
    const query = readListing(new URLSearchParams('precio=Infinity&habitaciones=1.5&barrio=palma&extras=toString&extras=terraza&extras=terraza'))
    expect(writeListing(query).toString()).toBe('extras=terraza')
  })

  it('cuenta alquileres pero calcula €/m² con ventas o la referencia del barrio', () => {
    const stats = areaStats(properties)
    expect(stats.find(area => area.id === 'genova')).toMatchObject({ rate: 6107, count: 2 })
    expect(stats.find(area => area.id === 'santa-catalina')).toMatchObject({ rate: 6200, count: 1 })
    expect(stats.reduce((sum, area) => sum + area.count, 0)).toBe(8)
  })
})

describe('Financiación y valoración de Marès', () => {
  it('aplica la amortización francesa', () => {
    expect(mortgage(250000, 50000, 25, 3)).toBeCloseTo(948.42, 2)
  })

  it('reparte el principal al 0 % y limita la financiación al 80 %', () => {
    expect(mortgage(300000, 0, 20, 0)).toBe(1000)
    expect(mortgage(300000, 60000, 20, 0)).toBe(1000)
    expect(mortgage(300000, 310000, 20, 0)).toBe(0)
  })

  it('aplica los multiplicadores y calcula el intervalo de ±7 %', () => {
    expect(valuation('genova', 100, 'bueno', [])).toEqual({ min: 520800, max: 599200 })
    expect(valuation('genova', 100, 'reformado', ['terraza', 'terraza'])).toEqual({ min: 617929, max: 710951 })
  })
})
