import { mountCourt } from './court'
import { categoryForBirthDate, money } from '../lib/registration'

let controller: AbortController | undefined
document.addEventListener('astro:before-swap', () => controller?.abort())
document.addEventListener('astro:page-load', () => {
  controller?.abort()
  if (!document.body.classList.contains('pinar')) return
  controller = new AbortController()
  const { signal } = controller
  mountCourt(signal)
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

})
