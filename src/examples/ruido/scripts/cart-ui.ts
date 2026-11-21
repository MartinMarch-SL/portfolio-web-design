import { animate } from 'motion'
import { responsiveImage } from '../../../lib/responsive-image'
import { products, getProduct } from '../data/products'
import { freeShippingAt, loadCart, maxQty, removeItem, saveCart, setQty, subtotal } from '../lib/cart'
import { euros } from '../lib/price'
import { prefersReducedMotion } from './motion-prefs'

function render() {
  const count = document.querySelector<HTMLElement>('[data-cart-count]')
  const drawer = document.querySelector<HTMLDialogElement>('#ruido-cart')
  if (!count || !drawer) return
  const lines = loadCart()
  const totalQty = String(lines.reduce((sum, line) => sum + line.qty, 0))
  if (count.textContent !== totalQty) {
    count.textContent = totalQty
    if (!prefersReducedMotion()) animate(count, { opacity: [.35, 1], y: [-4, 0] }, { duration: .22 })
  }

  const list = drawer.querySelector('[data-cart-lines]')!
  const focused = document.activeElement
  const action = focused instanceof HTMLButtonElement && list.contains(focused)
    ? focused.hasAttribute('data-remove') ? '[data-remove]' : `[data-delta="${focused.dataset.delta}"]`
    : undefined
  const index = action ? Array.from(list.children).indexOf(focused!.closest('li')!) : -1
  list.replaceChildren()
  const template = drawer.querySelector('template')!
  lines.forEach((line, position) => {
    const product = getProduct(line.slug)!
    const row = template.content.cloneNode(true) as DocumentFragment
    const { src, srcset } = responsiveImage(product.images[0], '64px')
    const image = row.querySelector('img')!
    image.srcset = srcset
    image.src = src
    row.querySelector('[data-name]')!.textContent = product.name
    row.querySelector('[data-variant]')!.textContent = `${line.color} / ${product.sizes.length ? line.size : 'Única'}`
    row.querySelector('[data-price]')!.textContent = euros.format(product.price * line.qty)
    row.querySelector('[data-qty]')!.textContent = String(line.qty)
    row.querySelectorAll<HTMLButtonElement>('[data-delta]').forEach(button => {
      const delta = Number(button.dataset.delta)
      button.disabled = delta > 0 && line.qty === maxQty
      button.onclick = () => saveCart(setQty(loadCart(), position, line.qty + delta))
    })
    row.querySelector<HTMLButtonElement>('[data-remove]')!.onclick = () => saveCart(removeItem(loadCart(), position))
    list.append(row)
  })

  const sub = subtotal(lines, products)
  const remaining = freeShippingAt - sub
  drawer.querySelector<HTMLElement>('[data-cart-empty]')!.hidden = lines.length > 0
  drawer.querySelector<HTMLElement>('[data-cart-totals]')!.hidden = lines.length === 0
  drawer.querySelector('[data-cart-subtotal]')!.textContent = euros.format(sub)
  drawer.querySelector('progress')!.value = Math.min(sub, freeShippingAt)
  drawer.querySelector('[data-cart-shipping]')!.textContent = remaining > 0
    ? `Te faltan ${euros.format(remaining)} para el envío gratis`
    : 'Envío gratis'
  if (action) {
    const row = list.children[Math.min(index, list.children.length - 1)]
    const next = row?.querySelector<HTMLButtonElement>(action)
    if (next && !next.disabled) next.focus()
    else (row?.querySelector('button') ?? drawer.querySelector('button'))?.focus()
  }
}

export function openCart() {
  const drawer = document.querySelector<HTMLDialogElement>('#ruido-cart')
  if (drawer && !drawer.open) drawer.showModal()
}

window.addEventListener('ruido:cart', render)
window.addEventListener('storage', event => {
  if (event.key === 'ruido-cart-v1' || event.key === null) render()
})
document.addEventListener('astro:page-load', () => {
  render()
  const button = document.querySelector<HTMLButtonElement>('#ruido-cart-button')
  if (button) button.onclick = openCart
})
