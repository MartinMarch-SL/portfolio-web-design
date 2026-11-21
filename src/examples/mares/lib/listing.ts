import { areas, features, type Area, type Feature, type Property } from '../data/properties'

export interface ListingQuery {
  operacion: Property['operation'] | ''
  barrio: Area | ''
  precio: number
  habitaciones: number
  extras: Feature[]
  orden: 'seleccion' | 'precio-asc' | 'precio-desc' | 'superficie'
  vista: 'lista' | 'mapa'
}

function positiveInteger(value: string | null) {
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 0
}

export function readListing(params: URLSearchParams): ListingQuery {
  const operation = params.get('operacion')
  const sort = params.get('orden')
  return {
    operacion: operation === 'venta' || operation === 'alquiler' ? operation : '',
    barrio: areas.find(area => area.id === params.get('barrio'))?.id ?? '',
    precio: positiveInteger(params.get('precio')),
    habitaciones: positiveInteger(params.get('habitaciones')),
    extras: [...new Set(params.getAll('extras'))].filter((feature): feature is Feature => Object.hasOwn(features, feature)),
    orden: sort === 'precio-asc' || sort === 'precio-desc' || sort === 'superficie' ? sort : 'seleccion',
    vista: params.get('vista') === 'mapa' ? 'mapa' : 'lista',
  }
}

export function writeListing(query: ListingQuery) {
  const params = new URLSearchParams()
  if (query.operacion) params.set('operacion', query.operacion)
  if (query.barrio) params.set('barrio', query.barrio)
  if (query.precio) params.set('precio', String(query.precio))
  if (query.habitaciones) params.set('habitaciones', String(query.habitaciones))
  query.extras.forEach(feature => params.append('extras', feature))
  if (query.orden !== 'seleccion') params.set('orden', query.orden)
  if (query.vista !== 'lista') params.set('vista', query.vista)
  return params
}

export function filterListings(properties: Property[], query: ListingQuery) {
  const matches = properties.filter(property =>
    (!query.operacion || property.operation === query.operacion) &&
    (!query.barrio || property.area === query.barrio) &&
    (!query.precio || property.price <= query.precio) &&
    property.rooms >= query.habitaciones &&
    query.extras.every(feature => property.features.includes(feature)),
  )
  if (query.orden === 'precio-asc') matches.sort((a, b) => a.price - b.price)
  if (query.orden === 'precio-desc') matches.sort((a, b) => b.price - a.price)
  if (query.orden === 'superficie') matches.sort((a, b) => b.size - a.size)
  return matches
}

export function areaStats(properties: Property[]) {
  return areas.map(area => {
    const local = properties.filter(property => property.area === area.id)
    const sales = local.filter(property => property.operation === 'venta')
    const rate = sales.length
      ? Math.round(sales.reduce((sum, property) => sum + property.price / property.size, 0) / sales.length)
      : area.rate
    return { ...area, count: local.length, rate }
  })
}
