import { animate } from 'motion'
import { products, type Category, type Size } from '../data/products'
import { filterProducts, sortProducts, type Sort } from '../lib/filter'
import { prefersReducedMotion } from './motion-prefs'

document.addEventListener('astro:page-load', () => {
  const shop = document.querySelector<HTMLElement>('[data-shop]')
  if (!shop) return
  const grid = shop.querySelector<HTMLElement>('[data-shop-grid]')!
  const cards = new Map(Array.from(grid.querySelectorAll<HTMLElement>('[data-slug]'), card => [card.dataset.slug!, card]))
  const categoryButtons = shop.querySelectorAll<HTMLButtonElement>('[data-category-filter]')
  const densityButtons = shop.querySelectorAll<HTMLButtonElement>('[data-density]')
  const size = shop.querySelector<HTMLSelectElement>('[data-size-filter]')!
  const color = shop.querySelector<HTMLSelectElement>('[data-color-filter]')!
  const sort = shop.querySelector<HTMLSelectElement>('[data-sort]')!
  let category: Category | undefined
  let animations: ReturnType<typeof animate>[] = []

  function update(view = grid.dataset.view ?? 'wide') {
    const motion = !prefersReducedMotion()
    const before = new Map<HTMLElement, DOMRect>()
    if (motion) for (const card of cards.values()) {
      if (!card.hidden) before.set(card, card.getBoundingClientRect())
    }
    animations.forEach(animation => animation.cancel())
    animations = []
    grid.dataset.view = view

    const visible = sortProducts(filterProducts(products, {
      category, size: (size.value || undefined) as Size | undefined, color: color.value || undefined,
    }), sort.value as Sort)
    const visibleSlugs = new Set(visible.map(({ slug }) => slug))
    for (const [slug, card] of cards) card.hidden = !visibleSlugs.has(slug)
    for (const { slug } of visible) grid.append(cards.get(slug)!)
    shop!.querySelector('[data-shop-count]')!.textContent = `${visible.length} ${visible.length === 1 ? 'pieza' : 'piezas'}`
    shop!.querySelector<HTMLElement>('[data-shop-empty]')!.hidden = visible.length > 0

    if (!motion) return
    // Read every final position before applying transforms.
    const moves = visible.map(({ slug }) => {
      const card = cards.get(slug)!
      const first = before.get(card)
      const last = card.getBoundingClientRect()
      return { card, first, last }
    })
    animations = moves.map(({ card, first, last }) => first
      ? animate(card, { x: [first.left - last.left, 0], y: [first.top - last.top, 0] }, { duration: .35, ease: [.2, .7, 0, 1] })
      : animate(card, { opacity: [.4, 1] }, { duration: .25 }))
  }

  categoryButtons.forEach(button => {
    button.onclick = () => {
      category = (button.dataset.categoryFilter || undefined) as Category | undefined
      categoryButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)))
      update()
    }
  })
  densityButtons.forEach(button => {
    button.onclick = () => {
      densityButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)))
      update(button.dataset.density)
    }
  })
  for (const select of [size, color, sort]) select.onchange = () => update()
})
