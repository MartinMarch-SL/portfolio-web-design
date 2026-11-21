import { expect, it } from 'vitest'
import { products } from '../../src/examples/ruido/data/products'
import { filterProducts, sortProducts } from '../../src/examples/ruido/lib/filter'

it('filters by category', () => {
  expect(filterProducts(products, { category: 'sudaderas' }).map(({ slug }) => slug))
    .toEqual(['bloc-380', 'ronda', 'meridiana'])
})

it('excludes sold-out sizes', () => {
  expect(filterProducts(products, { category: 'sudaderas', size: 'M' }).map(({ slug }) => slug))
    .toEqual(['bloc-380', 'meridiana'])
})

it('sorts by price in both directions and keeps ties stable', () => {
  const [a, b, c] = products
  const tied = { ...c, price: a.price }
  const input = [a, b, tied]
  expect(sortProducts(input, 'precio-asc')).toEqual([b, a, tied])
  expect(sortProducts(input, 'precio-desc')).toEqual([a, tied, b])
  expect(input).toEqual([a, b, tied])
})
