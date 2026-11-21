import { getProduct, type Size } from '../data/products'
import { addItem, loadCart, saveCart } from '../lib/cart'
import { openCart } from './cart-ui'
import { prefersReducedMotion } from './motion-prefs'

function mountGallery(gallery: HTMLElement) {
  const track = gallery.querySelector<HTMLElement>('[data-gallery-track]')!
  const count = gallery.querySelector('[data-gallery-count]')!
  const [previous, next] = gallery.querySelectorAll<HTMLButtonElement>('[data-gallery-step]')
  const total = track.children.length
  const current = () => Math.max(0, Math.min(total - 1, Math.round(track.scrollLeft / track.clientWidth)))
  function show(index: number) {
    track.scrollTo({ left: index * track.clientWidth, behavior: prefersReducedMotion() ? 'instant' : 'smooth' })
  }
  track.onscroll = () => {
    const index = current()
    count.textContent = `${index + 1}/${total}`
    previous.disabled = index === 0
    next.disabled = index === total - 1
  }
  previous.onclick = () => show(current() - 1)
  next.onclick = () => show(current() + 1)

  let drag: { pointerId: number; start: number; offset: number } | undefined
  track.onpointerdown = event => {
    if (event.pointerType === 'touch' || event.button !== 0 || track.scrollWidth <= track.clientWidth) return
    drag = { pointerId: event.pointerId, start: event.clientX, offset: track.scrollLeft }
    track.setPointerCapture(event.pointerId)
    track.dataset.dragging = ''
  }
  track.onpointermove = event => {
    if (drag?.pointerId === event.pointerId) track.scrollLeft = drag.offset + drag.start - event.clientX
  }
  track.onlostpointercapture = () => {
    const index = current()
    drag = undefined
    delete track.dataset.dragging
    show(index)
  }
}

document.addEventListener('astro:page-load', () => {
  const page = document.querySelector<HTMLElement>('[data-product]')
  if (!page) return
  const product = getProduct(page.dataset.product!)!
  const sizes = page.querySelectorAll<HTMLButtonElement>('[data-size]')
  const colors = page.querySelectorAll<HTMLButtonElement>('[data-color]')
  const add = page.querySelector<HTMLButtonElement>('[data-add]')!
  let size: Size | undefined
  let color = product.colors[0].name

  sizes.forEach(button => {
    button.onclick = () => {
      size = button.dataset.size as Size
      sizes.forEach(item => item.setAttribute('aria-pressed', String(item === button)))
      add.disabled = false
    }
  })
  colors.forEach(button => {
    button.onclick = () => {
      color = button.dataset.color!
      colors.forEach(item => item.setAttribute('aria-pressed', String(item === button)))
      page.querySelector('[data-current-color]')!.textContent = color
    }
  })
  add.onclick = () => {
    if (!size) return
    saveCart(addItem(loadCart(), { slug: product.slug, size, color, qty: 1 }))
    openCart()
  }
  page.querySelector<HTMLButtonElement>('[data-guide-open]')!.onclick = () => {
    page.querySelector<HTMLDialogElement>('[data-size-guide]')!.showModal()
  }
  mountGallery(page.querySelector('[data-gallery]')!)
})
