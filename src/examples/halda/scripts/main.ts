import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { cases } from '../data/cases'
import { filterCases } from '../lib/cases'

let controller: AbortController | undefined
document.addEventListener('astro:before-swap', () => controller?.abort())
document.addEventListener('astro:page-load', () => {
  controller?.abort()
  if (!document.body.classList.contains('halda')) return
  controller = new AbortController()
  const { signal } = controller
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  let lenis: Lenis | undefined
  function syncScroll() {
    lenis?.destroy()
    lenis = reduced.matches ? undefined : new Lenis({ autoRaf: true, duration: 1.05 })
  }
  syncScroll()
  reduced.addEventListener('change', syncScroll, { signal })
  signal.addEventListener('abort', () => lenis?.destroy(), { once:true })

  const menu = document.querySelector<HTMLDialogElement>('#halda-menu')!
  document.querySelector('[data-menu-open]')!.addEventListener('click', () => menu.showModal(), { signal })
  menu.querySelector('[data-menu-close]')!.addEventListener('click', () => menu.close(), { signal })
  menu.addEventListener('click', event => {
    if (event.target instanceof Element && (event.target === menu || event.target.closest('a'))) menu.close()
  }, { signal })
  const desktop = matchMedia('(min-width:851px)')
  desktop.addEventListener('change', () => { if (desktop.matches) menu.close() }, { signal })
  signal.addEventListener('abort', () => menu.close(), { once:true })

  const form = document.querySelector<HTMLFormElement>('[data-challenge]')
  if (form) void import('./contact').then(({ mountContact }) => {
    if (!signal.aborted) mountContact(form, signal)
  })

  const selector = document.querySelector<HTMLElement>('[data-selector]')
  if (selector) {
    const stage = selector.querySelector<HTMLElement>('[data-stage]')!
    const still = stage.querySelector<HTMLImageElement>('[data-still]')!
    const buttons = selector.querySelectorAll<HTMLButtonElement>('[data-case]')
    const captions = selector.querySelectorAll<HTMLElement>('[data-caption]')
    for (const button of buttons) button.addEventListener('click', () => {
      const item = cases.find(item => item.scene === button.dataset.case)!
      if (item.scene === stage.dataset.scene) return
      stage.dataset.scene = item.scene
      stage.setAttribute('aria-label', item.intro)
      still.src = stage.dataset.stills + item.scene + '.webp'
      for (const other of buttons) other.setAttribute('aria-pressed', String(other === button))
      for (const caption of captions) caption.hidden = caption.dataset.caption !== item.scene
      stage.dispatchEvent(new Event('halda:scene'))
    }, { signal })
  }

  const stages = document.querySelectorAll<HTMLElement>('[data-stage]')
  if (stages.length) void import('./scene').then(({ mountScenes }) => {
    if (!signal.aborted) mountScenes(stages, signal)
  }).catch(() => { /* Each stage retains its still. */ })

  const filter = document.querySelector('[data-filter]')
  if (filter) {
    const [sector, tech] = filter.querySelectorAll('select')
    const cards = document.querySelectorAll<HTMLElement>('[data-project]')
    function update() {
      const matches = new Set(filterCases(sector.value, tech.value).map(item => String(item.slug)))
      for (const card of cards) card.hidden = !matches.has(card.dataset.project!)
      filter!.querySelector('output')!.textContent = matches.size + (matches.size === 1 ? ' caso' : ' casos')
      document.querySelector<HTMLElement>('[data-empty]')!.hidden = !!matches.size
    }
    filter.addEventListener('change', update, { signal })
    update()
  }

  const telemetry = document.querySelector('[data-telemetry]')
  if (telemetry) {
    const cells = telemetry.querySelectorAll('[data-live]')
    const readings = [['148','0,82','42'],['150','0,79','41'],['147','0,84','43'],['149','0,81','42']]
    let visible = false
    let tick = 0
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting })
    observer.observe(telemetry)
    const timer = window.setInterval(() => {
      if (!visible || reduced.matches || document.hidden) return
      tick = (tick + 1) % readings.length
      cells.forEach((cell, index) => { cell.textContent = readings[tick][index] })
    }, 2400)
    signal.addEventListener('abort', () => { observer.disconnect(); clearInterval(timer) }, { once:true })
  }

  const counters = document.querySelectorAll<HTMLElement>('[data-count]')
  if (counters.length) {
    let frame = 0
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      if (reduced.matches) return
      const start = performance.now()
      function update(now: number) {
        const progress = reduced.matches ? 1 : Math.min(1,(now-start)/780)
        for (const counter of counters) counter.textContent = String(Math.round(Number(counter.dataset.count)*(1-(1-progress)**3)))
        if (progress < 1) frame = requestAnimationFrame(update)
      }
      frame = requestAnimationFrame(update)
    }, { threshold:.3 })
    observer.observe(counters[0].closest('dl')!)
    signal.addEventListener('abort', () => { observer.disconnect(); cancelAnimationFrame(frame) }, { once:true })
  }
})
