import { mountStadium } from './stadium'
import { categoryForBirthDate, money } from '../lib/registration'

let controller: AbortController | undefined
document.addEventListener('astro:before-swap', () => controller?.abort())
document.addEventListener('astro:page-load', () => {
  controller?.abort()
  if (!document.body.classList.contains('almendros')) return
  controller = new AbortController()
  const { signal } = controller
  mountStadium(signal)
  const menu = document.querySelector<HTMLDialogElement>('#club-menu')!
  const openMenu = document.querySelector<HTMLButtonElement>('[data-menu-open]')!
  openMenu.addEventListener('click', () => menu.showModal(), { signal })
  menu.querySelector('[data-menu-close]')!.addEventListener('click', () => menu.close(), { signal })
  menu.addEventListener('click', event => {
    if (event.target instanceof Element && event.target.closest('a')) menu.close()
  }, { signal })
  menu.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return
    const items = menu.querySelectorAll<HTMLElement>('button, a[href]')
    const first = items[0]
    const last = items[items.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }, { signal })
  const desktop = matchMedia('(min-width: 851px)')
  desktop.addEventListener('change', () => { if (desktop.matches) menu.close() }, { signal })
  signal.addEventListener('abort', () => menu.close(), { once: true })

  const form = document.querySelector<HTMLFormElement>('[data-registration]')
  if (form) void import('./registration').then(({ mountRegistration }) => {
    if (!signal.aborted) mountRegistration(form, signal)
  })

  const ball = document.querySelector<HTMLElement>('[data-ball]')
  if (ball) void import('./ball').then(({ mountBall }) => {
    if (!signal.aborted) mountBall(ball, signal)
  }).catch(() => {
    if (!signal.aborted) {
      ball.querySelector('canvas')!.hidden = true
      ball.querySelector('img')!.hidden = false
    }
  })

  const quick = document.querySelector<HTMLFormElement>('[data-quick]')
  if (quick) {
    const year = quick.querySelector('select')!
    const update = () => {
      const category = categoryForBirthDate(year.value + '-01-01')
      quick.querySelector('output')!.textContent = category?.label ?? ''
      quick.querySelector('[data-quick-details]')!.textContent = category
        ? `${category.team.days} · ${category.team.time} · ${category.team.field} · ${money(category.fee * 100)} al año`
        : 'Elige el año para consultar el horario y la cuota.'
    }
    year.addEventListener('change', update, { signal })
    update()
  }

  const select = document.querySelector<HTMLSelectElement>('[data-standings]')
  if (select) {
    const update = () => document.querySelectorAll<HTMLElement>('[data-group]').forEach(group => {
      group.hidden = group.dataset.group !== select.value
    })
    select.addEventListener('change', update, { signal })
    update()
  }

  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue
      entry.target.animate([
        { opacity: .55, transform: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'none' : 'translateY(10px)' },
        { opacity: 1, transform: 'none' },
      ], { duration: 570, easing: 'ease-out' })
      entry.target.classList.add('in-view')
      observer.unobserve(entry.target)
    }
  }, { threshold: .08 })
  document.querySelectorAll('[data-reveal]').forEach(section => observer.observe(section))
  signal.addEventListener('abort', () => observer.disconnect(), { once: true })

  const pitch = document.querySelector<HTMLElement>('[data-pitch]')
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  if (pitch) {
    let frame = 0
    function update() {
      frame = 0
      const { top, height } = pitch!.getBoundingClientRect()
      const progress = Math.max(0, Math.min(1, (innerHeight - top) / (innerHeight + height)))
      pitch!.style.setProperty('--tilt', reduced.matches ? '0deg' : `${34 - progress * 30}deg`)
    }
    addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(update) }, { signal, passive: true })
    reduced.addEventListener('change', update, { signal })
    signal.addEventListener('abort', () => cancelAnimationFrame(frame), { once: true })
    update()
  }

  const hover = matchMedia('(hover: hover) and (pointer: fine)')
  document.querySelectorAll<HTMLElement>('[data-crest]').forEach(crest => {
    const reset = () => {
      crest.style.removeProperty('--rx')
      crest.style.removeProperty('--ry')
    }
    crest.addEventListener('pointermove', event => {
      if (!hover.matches || reduced.matches || event.pointerType === 'touch') return
      const bounds = crest.getBoundingClientRect()
      crest.style.setProperty('--rx', `${(.5 - (event.clientY - bounds.top) / bounds.height) * 20}deg`)
      crest.style.setProperty('--ry', `${((event.clientX - bounds.left) / bounds.width - .5) * 24}deg`)
    }, { signal })
    crest.addEventListener('pointerleave', reset, { signal })
    reduced.addEventListener('change', reset, { signal })
    hover.addEventListener('change', reset, { signal })
  })
})
