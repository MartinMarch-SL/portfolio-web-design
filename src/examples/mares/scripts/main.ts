import { initCarousel, initIndex, initLivePlan, initSolar } from './dossier'
import { initContact, initGallery, initListings, initMortgage, initValuation } from './interactions'

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
  body.querySelectorAll<HTMLElement>('[data-gallery]').forEach(root => initGallery(root, scope))
  body.querySelectorAll<HTMLFormElement>('[data-mortgage]').forEach(form => initMortgage(form, scope))
  body.querySelectorAll<HTMLFormElement>('[data-valuation]').forEach(form => initValuation(form, scope))
  body.querySelectorAll<HTMLFormElement>('[data-contact]').forEach(form => initContact(form, scope))
  const carousel = body.querySelector<HTMLElement>('[data-carousel]')
  const index = body.querySelector<HTMLElement>('[data-index]')
  const plan = body.querySelector<HTMLElement>('[data-live-plan]')
  const solar = body.querySelector<HTMLElement>('[data-solar]')
  if (carousel) initCarousel(carousel, scope)
  if (index) initIndex(index, scope)
  if (plan) initLivePlan(plan, signal)
  if (solar) initSolar(solar, signal)
  if (scope.reduce) return

  const observer = new IntersectionObserver(entries => entries.forEach(({ target, isIntersecting }) => {
    if (!isIntersecting) return
    target.classList.add('in-view')
    observer.unobserve(target)
  }), { threshold: .12 })
  body.querySelectorAll('[data-reveal]').forEach(photo => observer.observe(photo))
  signal.addEventListener('abort', () => observer.disconnect(), { once: true })
}

document.addEventListener('astro:page-load', start)
document.addEventListener('astro:before-swap', () => page?.abort())
