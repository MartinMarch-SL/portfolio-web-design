import Lenis from 'lenis'
import { layers, layerSpread, modelProjection } from '../data/model'
import { modelLeaders } from './model-leaders'
import { number } from '../lib/offer'
import { filterProjects } from '../lib/projects'
import 'lenis/dist/lenis.css'

let controller: AbortController | undefined

document.addEventListener('astro:before-swap', () => controller?.abort())
document.addEventListener('astro:page-load', () => {
  controller?.abort()
  if (!document.body.classList.contains('ramal')) return
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
  signal.addEventListener('abort', () => lenis?.destroy(), { once: true })

  const menu = document.querySelector<HTMLDialogElement>('#ramal-menu')!
  const opener = document.querySelector<HTMLButtonElement>('[data-menu-open]')!
  opener.addEventListener('click', () => menu.showModal(), { signal })
  menu.querySelector('[data-menu-close]')!.addEventListener('click', () => menu.close(), { signal })
  menu.addEventListener('click', event => {
    if (event.target instanceof Element && (event.target === menu || event.target.closest('a'))) menu.close()
  }, { signal })
  const desktop = matchMedia('(min-width: 761px)')
  desktop.addEventListener('change', () => { if (desktop.matches) menu.close() }, { signal })
  signal.addEventListener('abort', () => menu.close(), { once: true })

  document.querySelectorAll('[data-dossier]').forEach(button => button.addEventListener('click', async () => {
    const { downloadDossier } = await import('./documents')
    if (!signal.aborted) downloadDossier()
  }, { signal }))

  const form = document.querySelector<HTMLFormElement>('[data-offer]')
  if (form) void import('./offer').then(({ mountOffer }) => {
    if (!signal.aborted) mountOffer(form, signal)
  })
  const filter = document.querySelector('[data-project-filter]')
  if (filter) {
    const [sector, discipline] = filter.querySelectorAll('select')
    const cards = [...document.querySelectorAll<HTMLElement>('[data-project]')]
    const empty = document.querySelector<HTMLElement>('[data-empty]')!
    function update() {
      const visible = new Set(filterProjects(sector.value, discipline.value).map(project => project.slug))
      for (const card of cards) card.hidden = !visible.has(card.dataset.project!)
      empty.hidden = visible.size > 0
      filter!.querySelector('output')!.textContent = visible.size + (visible.size === 1 ? ' obra' : ' obras')
    }
    filter.addEventListener('change', update, { signal })
    update()
  }

  const model = document.querySelector<HTMLElement>('[data-model]')
  if (model) {
    const scene = model.closest<HTMLElement>('[data-model-scene]')!
    const buttons = [...model.querySelectorAll<HTMLButtonElement>('[data-isolate]')]
    const groups = [...model.querySelectorAll<SVGElement>('[data-layer]')]
    const notes = [...model.querySelectorAll<HTMLElement>('[data-layer-note]')]
    const dimension = model.querySelector<HTMLElement>('[data-dimension]')!
    const canvas = model.querySelector('canvas')!
    const fallback = model.querySelector<SVGSVGElement>('[data-fallback]')!
    const drawLeaders = modelLeaders(model)
    function spread() {
      const pin = scene.querySelector<HTMLElement>('.hero-pin')!
      const offset = pin.getBoundingClientRect().top - scene.getBoundingClientRect().top
      const distance = scene.offsetHeight - pin.offsetHeight
      const progress = distance > 0 ? Math.min(1, Math.max(0, offset / distance)) : 0
      const cycle = Math.min(1, progress / .64, (1 - progress) / .3)
      const value = reduced.matches || model!.dataset.selected || !distance ? 1 : cycle
      model!.dataset.spread = String(value)
      model!.style.setProperty('--spread', String(value))
      groups.forEach((group, index) => {
        group.style.setProperty('--layer-spread', String(index ? layerSpread(value, index) : 0))
      })
      if (canvas.hidden) {
        const { width, height } = fallback.getBoundingClientRect()
        const scale = Math.min(width / 740, height / 535)
        drawLeaders(width, height, index => layerSpread(value, index), point => {
          const [x, y] = modelProjection(point)
          return [(width - 740 * scale) / 2 + x * scale, (height - 535 * scale) / 2 + y * scale]
        })
      }
      notes.forEach((note, index) => {
        const lift = layerSpread(value, index + 1)
        note.style.setProperty('--note', String(model!.dataset.selected ? Number(note.dataset.layerNote === model!.dataset.selected) : lift))
      })
    }
    for (const button of buttons) button.addEventListener('click', () => {
      const selected = button.dataset.isolate!
      const layer = layers.find(layer => layer.id === selected) ?? layers[0]
      model.dataset.selected = selected
      for (const item of buttons) item.setAttribute('aria-pressed', String(item === button))
      for (const group of groups) group.classList.toggle('isolated-out', Boolean(selected) && group.dataset.layer !== selected)
      for (const note of notes) note.classList.toggle('selected-note', note.dataset.layerNote === selected)
      dimension.textContent = layer.code + ' · ' + layer.size
      if (!reduced.matches) model.querySelector('.dimension-line')?.animate(
        [{ transform: 'scaleX(.02)' }, { transform: 'scaleX(1)' }], { duration: 460, easing: 'ease-out' },
      )
      spread()
    }, { signal })
    window.addEventListener('scroll', spread, { signal, passive: true })
    window.addEventListener('resize', spread, { signal })
    reduced.addEventListener('change', () => requestAnimationFrame(() => {
      if (!signal.aborted) spread()
    }), { signal })
    canvas.addEventListener('webglcontextlost', () => requestAnimationFrame(() => {
      if (!signal.aborted) spread()
    }), { signal })
    spread()
    void import('./model').then(({ mountWebGL }) => {
      if (!signal.aborted) mountWebGL(model, signal)
    }).catch(() => { /* SVG remains available if WebGL fails. */ })
  }

  const disciplineIndex = document.querySelector('[data-discipline-index]')
  if (disciplineIndex) {
    const panels = disciplineIndex.querySelectorAll<HTMLElement>('[data-discipline-panel]')
    for (const row of disciplineIndex.querySelectorAll<HTMLElement>('[data-discipline]')) {
      function activate() {
        for (const panel of panels) {
          const active = panel.dataset.disciplinePanel === row.dataset.discipline
          panel.classList.toggle('active', active)
          panel.inert = !active
        }
      }
      row.addEventListener('pointerenter', activate, { signal })
      row.addEventListener('focusin', activate, { signal })
    }
  }

  const projectScene = document.querySelector<HTMLElement>('[data-project-scene]')
  if (projectScene) {
    const track = projectScene.querySelector<HTMLElement>('[data-project-track]')!
    const viewport = track.parentElement!
    const pin = viewport.parentElement!
    const wide = matchMedia('(min-width: 901px) and (min-height: 720px) and (prefers-reduced-motion: no-preference)')
    let travel = 0
    function positionTrack() {
      if (!wide.matches) return
      const offset = pin.getBoundingClientRect().top - projectScene!.getBoundingClientRect().top
      track.style.transform = `translate3d(${-Math.min(travel, Math.max(0, offset))}px, 0, 0)`
    }
    function measureTrack() {
      projectScene!.toggleAttribute('data-rail-active', wide.matches)
      travel = wide.matches ? Math.max(0, track.scrollWidth - viewport.clientWidth) : 0
      if (!travel) projectScene!.removeAttribute('data-rail-active')
      projectScene!.style.setProperty('--project-height', `${pin.offsetHeight + travel}px`)
      if (travel) positionTrack()
      else track.style.removeProperty('transform')
    }
    window.addEventListener('scroll', positionTrack, { signal, passive: true })
    window.addEventListener('resize', measureTrack, { signal })
    wide.addEventListener('change', measureTrack, { signal })
    track.addEventListener('focusin', event => {
      if (!travel || !(event.target instanceof Element)) return
      const card = event.target.closest<HTMLElement>('[data-project]')
      if (!card) return
      const bounds = card.getBoundingClientRect()
      if (bounds.left < 0 || bounds.right > innerWidth) {
        const top = projectScene.getBoundingClientRect().top + scrollY - parseFloat(getComputedStyle(pin).top)
        window.scrollTo({ top: top + Math.min(travel, card.offsetLeft), behavior: 'instant' })
        positionTrack()
      }
    }, { signal })
    const observer = new ResizeObserver(measureTrack)
    observer.observe(pin)
    signal.addEventListener('abort', () => observer.disconnect(), { once: true })
    measureTrack()
  }

  const counters = [...document.querySelectorAll<HTMLElement>('[data-count]')]
  if (counters.length) {
    let frame = 0
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      if (reduced.matches) return
      const start = performance.now()
      function tick(now: number) {
        const progress = reduced.matches ? 1 : Math.min(1, (now - start) / 950)
        for (const counter of counters) {
          const total = Number(counter.dataset.count)
          counter.textContent = number(Math.round(total * (1 - (1 - progress) ** 3)))
        }
        if (progress < 1) frame = requestAnimationFrame(tick)
      }
      frame = requestAnimationFrame(tick)
    }, { threshold: .25 })
    observer.observe(counters[0].closest('dl')!)
    signal.addEventListener('abort', () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }, { once: true })
  }
})
