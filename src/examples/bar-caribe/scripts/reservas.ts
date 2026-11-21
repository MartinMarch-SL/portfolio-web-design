import { animate } from 'motion'
import { validateReservation } from '../lib/reservations'
import { madridDay } from '../lib/service'

const form = document.querySelector<HTMLFormElement>('[data-reservation]')!
const error = form.querySelector<HTMLElement>('.reservation-error')!
const dateInput = form.querySelector<HTMLInputElement>('[name=date]')!
const ticket = document.querySelector<HTMLElement>('[data-confirmation]')!
form.hidden = false
dateInput.min = madridDay()

form.addEventListener('submit', event => {
  event.preventDefault()
  const fields = new FormData(form)
  const reservation = {
    name: String(fields.get('name')).trim(),
    phone: String(fields.get('phone')),
    date: String(fields.get('date')),
    time: String(fields.get('time')),
    guests: Number(fields.get('guests')),
  }
  const message = validateReservation(reservation)
  error.textContent = message ?? ''
  if (message) return

  const date = new Date(reservation.date + 'T12:00:00Z')
  const day = new Intl.DateTimeFormat('es-ES', { dateStyle: 'long', timeZone: 'Europe/Madrid' }).format(date)
  ticket.querySelector('[data-confirmation-name]')!.textContent = reservation.name
  ticket.querySelector('[data-confirmation-details]')!.textContent =
    `${day} · ${reservation.time} · ${reservation.guests} ${reservation.guests === 1 ? 'comensal' : 'comensales'}`
  form.hidden = true
  ticket.hidden = false
  ticket.focus()
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    animate(ticket, { opacity: [0, 1], y: [-20, 0] }, { duration: .35 })
  }
})

ticket.querySelector('[data-print]')!.addEventListener('click', () => window.print())
ticket.querySelector('[data-new]')!.addEventListener('click', () => {
  ticket.hidden = true
  form.reset()
  dateInput.min = madridDay()
  form.hidden = false
  form.querySelector('input')!.focus()
})
