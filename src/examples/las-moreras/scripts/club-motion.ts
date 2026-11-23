import Lenis from 'lenis'
import { matches } from '../data/season'

export function mountClubMotion(signal: AbortSignal) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  const mast = document.querySelector('.mast')!
  const scenes = [...document.querySelectorAll<HTMLElement>('[data-court]')]
  let lenis: Lenis | undefined
  let frame = 0

  function update() {
    frame = 0
    mast.classList.toggle('is-scrolled', scrollY > 24)
    for (const scene of scenes) {
      const bounds = scene.getBoundingClientRect()
      const progress = Math.max(0, Math.min(1, (innerHeight * .65 - bounds.top) / (innerHeight * .65)))
      scene.style.setProperty('--camera-dip', reduced.matches ? '0deg' : `${progress * 15}deg`)
    }
  }

  function syncMotion() {
    if (reduced.matches) {
      lenis?.destroy()
      lenis = undefined
    } else {
      lenis ??= new Lenis({
        autoRaf: true,
        syncTouch: false,
        prevent: node => node instanceof Element && Boolean(node.closest('.menu-overlay, .news-carousel, .table-scroll')),
      })
    }
    update()
  }

  addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(update) }, { signal, passive: true })
  reduced.addEventListener('change', syncMotion, { signal })
  signal.addEventListener('abort', () => {
    cancelAnimationFrame(frame)
    lenis?.destroy()
  }, { once: true })
  syncMotion()

  const board = document.querySelector<HTMLElement>('[data-scoreboard]')
  if (board) {
    let index = 0
    board.querySelector('[data-score-next]')!.addEventListener('click', () => {
      index = (index + 1) % matches.length
      const match = matches[index]
      board.querySelector('[data-match]')!.textContent = match.label
      board.querySelector('[data-rival]')!.textContent = match.rival
      board.querySelector('[data-score-live]')!.textContent = `${match.label} contra ${match.rival}: ${match.home.map((score, i) => `${score}–${match.away[i]}`).join(', ')}`
      board.querySelectorAll<HTMLElement>('.plate').forEach((plate, i) => {
        plate.textContent = String([...match.home, ...match.away][i])
        plate.getAnimations().forEach(animation => animation.cancel())
        if (!reduced.matches) plate.animate([{ transform: 'rotateX(-88deg)' }, { transform: 'rotateX(0deg)' }], { duration: 480, delay: (i % 3) * 65, easing: 'ease-out', fill: 'backwards' })
      })
    }, { signal })
  }

  const ticker = document.querySelector('.ticker')
  const toggle = ticker?.querySelector<HTMLButtonElement>('.ticker-toggle')
  if (ticker && toggle) {
    const sync = () => { toggle.hidden = reduced.matches }
    toggle.addEventListener('click', () => {
      const paused = ticker.classList.toggle('is-paused')
      toggle.textContent = paused ? 'Reanudar' : 'Pausar'
      toggle.setAttribute('aria-pressed', String(paused))
    }, { signal })
    reduced.addEventListener('change', sync, { signal })
    sync()
  }

  const numbers = document.querySelectorAll<HTMLElement>('[data-count]')
  let countFrame = 0
  const counter = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return
    counter.disconnect()
    if (reduced.matches) return
    const totals = Array.from(numbers, node => Number(node.textContent))
    const start = performance.now()
    function count(now: number) {
      const progress = reduced.matches ? 1 : Math.min(1, (now - start) / 1550)
      numbers.forEach((node, index) => {
        node.textContent = String(Math.round(totals[index] * (1 - (1 - progress) ** 3)))
      })
      if (progress < 1) countFrame = requestAnimationFrame(count)
    }
    countFrame = requestAnimationFrame(count)
  }, { threshold: .28 })
  if (numbers[0]?.closest('.stats')) counter.observe(numbers[0].closest('.stats')!)
  signal.addEventListener('abort', () => {
    counter.disconnect()
    cancelAnimationFrame(countFrame)
  }, { once: true })

  const news = document.querySelector<HTMLElement>('[data-news]')
  if (news) mountNews(news, reduced, signal)
}

function mountNews(news: HTMLElement, reduced: MediaQueryList, signal: AbortSignal) {
  const rail = news.querySelector<HTMLElement>('.news-carousel')!
  const controls = news.querySelector<HTMLElement>('.news-controls')!
  const previous = controls.querySelector<HTMLButtonElement>('[data-news-step="-1"]')!
  const next = controls.querySelector<HTMLButtonElement>('[data-news-step="1"]')!
  const cards = Array.from(rail.querySelectorAll('article'))
  const refresh = () => {
    previous.disabled = rail.scrollLeft <= 1
    next.disabled = rail.scrollLeft >= rail.scrollWidth - rail.clientWidth - 1
  }
  function move(direction: number) {
    const max = rail.scrollWidth - rail.clientWidth
    const stops = cards.map(card => Math.min(max, card.offsetLeft - cards[0].offsetLeft))
    const left = direction > 0
      ? stops.find(position => position > rail.scrollLeft + 2)
      : stops.reverse().find(position => position < rail.scrollLeft - 2)
    if (left === undefined) return
    rail.scrollTo({ left, behavior: reduced.matches ? 'instant' : 'smooth' })
  }
  previous.addEventListener('click', () => move(-1), { signal })
  next.addEventListener('click', () => move(1), { signal })
  rail.addEventListener('scroll', refresh, { signal, passive: true })
  const observer = new ResizeObserver(refresh)
  observer.observe(rail)
  controls.hidden = false
  refresh()

  let drag: { id: number, x: number, scroll: number } | undefined
  let suppressClick = false
  rail.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return
    suppressClick = false
    drag = { id: event.pointerId, x: event.clientX, scroll: rail.scrollLeft }
  }, { signal })
  rail.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId) return
    const distance = event.clientX - drag.x
    if (Math.abs(distance) < 6 && !suppressClick) return
    if (!suppressClick) {
      rail.setPointerCapture(event.pointerId)
      rail.classList.add('is-dragging')
      suppressClick = true
    }
    rail.scrollLeft = drag.scroll - distance
  }, { signal })
  const end = () => {
    drag = undefined
    rail.classList.remove('is-dragging')
  }
  addEventListener('pointerup', end, { signal })
  rail.addEventListener('pointercancel', end, { signal })
  rail.addEventListener('dragstart', event => event.preventDefault(), { signal })
  rail.addEventListener('click', event => {
    if (!suppressClick || event.detail === 0) return
    suppressClick = false
    event.preventDefault()
  }, { signal, capture: true })
  signal.addEventListener('abort', () => observer.disconnect(), { once: true })
}
