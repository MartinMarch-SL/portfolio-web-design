import { dateKey, healingCalendar } from '../lib/calendar'
import { download } from '../lib/download'
import { mountBooking } from './booking'
import { mountScan } from './scan'

let controller: AbortController | undefined

document.addEventListener('astro:before-swap', () => controller?.abort())
document.addEventListener('astro:page-load', () => {
  if (!document.body.classList.contains('ferro')) return
  controller?.abort()
  controller = new AbortController()
  const { signal } = controller
  const booking = document.querySelector<HTMLElement>('[data-booking]')
  if (booking) mountBooking(booking, signal)
  const hero = document.querySelector<HTMLElement>('[data-scan][data-hero]')
  if (hero) mountScan(hero, signal)

  const healing = document.querySelector<HTMLFormElement>('[data-healing]')
  if (healing) {
    const input = healing.querySelector('input')!
    input.value ||= dateKey(new Date())
    healing.addEventListener('submit', event => {
      event.preventDefault()
      download('lia-ferro-cuidados.ics', healingCalendar(input.value), 'text/calendar;charset=utf-8')
      healing.querySelector('[role=status]')!.textContent = 'Calendario preparado.'
    }, { signal })
  }

  const gallery = document.querySelector<HTMLElement>('[data-gallery]')
  if (gallery) {
    const dialog = gallery.querySelector('dialog')!
    const figure = dialog.querySelector('img')!
    gallery.addEventListener('click', event => {
      const target = (event.target as HTMLElement).closest<HTMLButtonElement>('button')
      if (!target) return
      if (target.dataset.filter) {
        gallery.querySelectorAll('[data-filter]').forEach(button => button.setAttribute('aria-pressed', String(button === target)))
        gallery.querySelectorAll<HTMLElement>('[data-style]').forEach(work => {
          work.hidden = target.dataset.filter !== 'Todos' && work.dataset.style !== target.dataset.filter
        })
      }
      if (target.dataset.image) {
        figure.src = target.dataset.image
        figure.alt = target.dataset.name ?? ''
        figure.hidden = false
        dialog.querySelector('[data-caption]')!.textContent = figure.alt
        dialog.showModal()
      }
    }, { signal })
  }
})
