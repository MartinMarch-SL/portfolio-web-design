import { animate } from 'motion'
import { getProduct, products } from '../data/products'
import { loadCart, saveCart, shipping, subtotal } from '../lib/cart'
import { euros } from '../lib/price'
import { prefersReducedMotion } from './motion-prefs'

let lifecycle: AbortController | undefined
document.addEventListener('astro:before-swap', () => lifecycle?.abort())

document.addEventListener('astro:page-load', () => {
  const checkout = document.querySelector<HTMLElement>('[data-checkout]')
  if (!checkout) return
  lifecycle?.abort()
  lifecycle = new AbortController()
  const { signal } = lifecycle
  const empty = checkout.querySelector<HTMLElement>('[data-checkout-empty]')!
  const active = checkout.querySelector<HTMLElement>('[data-checkout-active]')!
  const complete = checkout.querySelector<HTMLElement>('[data-checkout-complete]')!
  const form = checkout.querySelector('form')!
  const template = checkout.querySelector('template')!
  const list = checkout.querySelector('[data-summary-lines]')!
  let submitted = false

  function render() {
    if (submitted) return
    const lines = loadCart()
    empty.hidden = lines.length > 0
    active.hidden = lines.length === 0
    list.replaceChildren()
    for (const line of lines) {
      const product = getProduct(line.slug)!
      const row = template.content.cloneNode(true) as DocumentFragment
      row.querySelector('[data-name]')!.textContent = product.name
      row.querySelector('[data-variant]')!.textContent =
        `${line.color} / ${product.sizes.length ? line.size : 'Única'} × ${line.qty}`
      row.querySelector('[data-price]')!.textContent = euros.format(product.price * line.qty)
      list.append(row)
    }
    const sub = subtotal(lines, products)
    const delivery = shipping(sub)
    active.querySelector('[data-summary-subtotal]')!.textContent = euros.format(sub)
    active.querySelector('[data-summary-shipping]')!.textContent = delivery ? euros.format(delivery) : 'Gratis'
    active.querySelector('[data-summary-total]')!.textContent = euros.format(sub + delivery)
  }

  form.onsubmit = async event => {
    event.preventDefault()
    if (submitted || loadCart().length === 0) return
    submitted = true
    const order = `RD-${String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0')}`
    form.reset()
    for (const input of form.querySelectorAll('input')) input.disabled = true
    form.querySelector('button')!.hidden = true
    const processing = form.querySelector<HTMLElement>('[data-processing]')!
    processing.hidden = false
    saveCart([])

    if (!prefersReducedMotion()) {
      const progress = animate(processing.querySelector('span')!, { scaleX: [0, 1] }, { duration: .55 })
      await progress
    }
    if (signal.aborted) return
    active.hidden = true
    const number = complete.querySelector<HTMLElement>('[data-order-number]')!
    number.textContent = order
    complete.hidden = false
    number.focus()
    if (!prefersReducedMotion()) animate(complete, { opacity: [.45, 1], y: [8, 0] }, { duration: .25 })
  }

  window.addEventListener('ruido:cart', render, { signal })
  window.addEventListener('storage', render, { signal })
  render()
})
