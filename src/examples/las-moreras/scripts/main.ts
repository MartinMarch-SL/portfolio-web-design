import { mountClubMotion } from './club-motion'
import { mountRegistration } from './registration'
import { mountBooking } from './booking'
import { available, courts, isActive, week } from '../lib/booking'
import { categoryForBirthDate, money } from '../lib/registration'
import { schedules } from '../data/season'

let controller: AbortController | undefined
document.addEventListener('astro:before-swap', () => controller?.abort())
document.addEventListener('astro:page-load', () => {
  controller?.abort()
  if (!document.body.classList.contains('moreras')) return
  controller = new AbortController()
  const { signal } = controller
  mountClubMotion(signal)
  const menu = document.querySelector<HTMLDialogElement>('#club-menu')!
  const open = document.querySelector<HTMLButtonElement>('[data-menu-open]')!
  const close = menu.querySelector<HTMLButtonElement>('[data-menu-close]')!
  open.addEventListener('click', () => menu.showModal(), { signal })
  close.addEventListener('click', () => menu.close(), { signal })
  menu.addEventListener('click', event => {
    if (event.target instanceof Element && event.target.closest('a')) menu.close()
  }, { signal })
  menu.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return
    const items = menu.querySelectorAll<HTMLElement>('button, a[href]')
    const [first, last] = [items[0], items[items.length - 1]]
    const target = event.shiftKey && document.activeElement === first ? last
      : !event.shiftKey && document.activeElement === last ? first : undefined
    if (target) { event.preventDefault(); target.focus() }
  }, { signal })
  const desktop = matchMedia('(min-width: 981px)')
  desktop.addEventListener('change', () => { if (desktop.matches) menu.close() }, { signal })
  signal.addEventListener('abort', () => menu.close(), { once: true })

  const enrollment = document.querySelector<HTMLFormElement>('[data-registration]')
  if (enrollment) mountRegistration(enrollment, signal)
  const booking = document.querySelector<HTMLElement>('[data-booking]')
  if (booking) mountBooking(booking, signal)

  const ball = document.querySelector<HTMLElement>('[data-ball]')
  if (ball) void import('./ball').then(({ mountBall }) => {
    if (!signal.aborted) mountBall(ball, signal)
  }).catch(() => {
    if (!signal.aborted) {
      ball.querySelector('canvas')!.hidden = true
      ball.querySelector('img')!.hidden = false
    }
  })

  const school = document.querySelector<HTMLFormElement>('[data-quick-school]')
  if (school) {
    const year = school.querySelector('select')!
    const update = () => {
      const category = categoryForBirthDate(year.value + '-01-01')
      school.querySelector('output')!.textContent = category?.name ?? ''
      school.querySelector('[data-school-details]')!.textContent = category
        ? `${schedules[0]} · ${category.time} · Desde ${money(category.fees[0] * 100)} al mes`
        : 'Consulta el horario y la cuota según el año de nacimiento.'
    }
    year.addEventListener('change', update, { signal })
    update()
  }

  const quick = document.querySelector<HTMLFormElement>('[data-quick-booking]')
  if (quick) {
    const date = quick.querySelector('input')!
    const hour = quick.querySelector('select')!
    const now = new Date()
    const span = week(now)
    date.min = span[0]
    date.max = span[6]
    date.value = span[0]
    if (now.getHours() >= 21) date.value = span[1]
    else hour.value = String(Math.max(8, now.getHours() + 1))
    const update = () => {
      const free = span.includes(date.value) ? courts.filter(court => {
        const slot = { date: date.value, court: court.id, hour: Number(hour.value) }
        return available(slot) && isActive(slot, new Date())
      }).length : 0
      quick.querySelector('output')!.textContent = free ? `${free} ${free === 1 ? 'pista libre' : 'pistas libres'}` : 'No quedan pistas libres en ese turno.'
    }
    quick.addEventListener('change', update, { signal })
    update()
  }
})
