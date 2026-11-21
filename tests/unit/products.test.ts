import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test } from 'vitest'
import { getProduct, products } from '../../src/examples/ruido/data/products'

test('el catálogo tiene doce referencias con identificadores únicos', () => {
  expect(products).toHaveLength(12)
  expect(new Set(products.map(({ slug }) => slug)).size).toBe(12)
  expect(getProduct(products[0].slug)).toBe(products[0])
  expect(getProduct('desconocido')).toBeUndefined()
})

test('cada referencia tiene un precio válido, tallas coherentes y fotografías locales', () => {
  for (const product of products) {
    expect(product.price).toBeGreaterThanOrEqual(35)
    expect(product.price).toBeLessThanOrEqual(189)
    expect(product.sizes).toEqual(expect.arrayContaining(product.soldOut))
    expect(product.images).toHaveLength(2)
    for (const image of product.images) {
      expect(existsSync(resolve('public', image)), image).toBe(true)
    }
  }
})
