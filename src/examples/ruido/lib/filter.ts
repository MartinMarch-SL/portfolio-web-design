import type { Category, Product, Size } from '../data/products'

interface Filters {
  category?: Category
  size?: Size
  color?: string
}

export type Sort = 'nuevo' | 'precio-asc' | 'precio-desc'

export function filterProducts(products: Product[], { category, size, color }: Filters): Product[] {
  return products.filter(product =>
    (!category || product.category === category) &&
    (!size || (product.sizes.includes(size) && !product.soldOut.includes(size))) &&
    (!color || product.colors.some(({ name }) => name === color)))
}

export function sortProducts(products: Product[], sort: Sort): Product[] {
  return [...products].sort((a, b) => {
    if (sort === 'precio-asc') return a.price - b.price
    if (sort === 'precio-desc') return b.price - a.price
    return Number(b.drop) - Number(a.drop) || Number(b.isNew) - Number(a.isNew)
  })
}
