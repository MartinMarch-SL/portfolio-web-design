import { initShutters } from './shutters'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { animate } from 'motion'
import { initContact, initGallery, initListings, initMap, initMortgage, initValuation } from './interactions'

let page: AbortController | undefined

function start() {
  page?.abort()
  const body = document.querySelector<HTMLElement>('[data-mares]')
  if (!body) return
  page = new AbortController()
  const { signal } = page
  const preference = matchMedia('(prefers-reduced-motion: reduce)')
  const scope = { signal, reduce: preference.matches }
  preference.addEventListener('change', start, { signal })

  body.querySelectorAll<HTMLElement>('[data-listing]').forEach(root => initListings(root, scope))
  body.querySelectorAll<HTMLElement>('[data-map]').forEach(root => initMap(root, scope))
  body.querySelectorAll<HTMLElement>('[data-gallery]').forEach(root => initGallery(root, scope))
  body.querySelectorAll<HTMLFormElement>('[data-mortgage]').forEach(form => initMortgage(form, scope))
  body.querySelectorAll<HTMLFormElement>('[data-valuation]').forEach(form => initValuation(form, scope))
  body.querySelectorAll<HTMLFormElement>('[data-contact]').forEach(form => initContact(form, scope))
  if (scope.reduce) return

  const scroller = new Lenis({ autoRaf: true, duration: 1.15, anchors: false, prevent: node => !!node.closest('dialog, select, textarea') })
  const counters = new Set<ReturnType<typeof animate>>()
  const ease = [.22, .72, .18, 1] as const
  initShutters(body, signal)
  const countersObserver = new IntersectionObserver(entries => entries.forEach(({ target, isIntersecting }) => {
    if (!isIntersecting) return
    countersObserver.unobserve(target)
    const total = Number((target as HTMLElement).dataset.counter)
    counters.add(animate(0, total, { duration: 1.2, ease, onUpdate: value => { target.textContent = String(Math.round(value)) } }))
  }), { threshold: .18 })
  body.querySelectorAll('[data-counter]').forEach(counter => countersObserver.observe(counter))
  body.querySelectorAll<HTMLElement>('[data-line]').forEach((line, index) => counters.add(animate(line, {
    transform: ['translateY(14px)', 'translateY(0px)'],
  }, { duration: .85, delay: index * .13, ease })))

  const planes = [...body.querySelectorAll<HTMLElement>('[data-parallax]')]
  let frame = 0
  function parallax() {
    frame = 0
    planes.forEach(plane => {
      const bounds = plane.parentElement!.getBoundingClientRect()
      if (bounds.bottom < 0 || bounds.top > innerHeight) return
      const progress = (bounds.top + bounds.height / 2 - innerHeight / 2) / (innerHeight + bounds.height)
      plane.style.transform = `translateY(${progress * 5}%)`
    })
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(parallax) }
  window.addEventListener('scroll', schedule, { passive: true, signal })
  window.addEventListener('resize', schedule, { signal })
  schedule()
  signal.addEventListener('abort', () => {
    scroller.destroy()
    countersObserver.disconnect()
    counters.forEach(animation => animation.cancel())
    cancelAnimationFrame(frame)
    planes.forEach(plane => plane.style.removeProperty('transform'))
    body.querySelectorAll<HTMLElement>('[data-counter]').forEach(counter => { counter.textContent = counter.dataset.counter! })
  }, { once: true })
}

document.addEventListener('astro:page-load', start)
document.addEventListener('astro:before-swap', () => page?.abort())
