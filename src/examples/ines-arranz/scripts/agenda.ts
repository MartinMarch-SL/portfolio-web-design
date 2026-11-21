import { animate } from 'motion'
import { addDays, dateKey, monday, slotsFor, timeZone, type Mode } from '../lib/agenda'
import { calendarFile, validateBooking } from '../lib/booking'

const root = document.querySelector<HTMLElement>('[data-booking]')!
const form = root.querySelector('form')!
const panels = Array.from(form.querySelectorAll<HTMLElement>('[data-step]'))
const next = form.querySelector<HTMLButtonElement>('[data-next]')!
const back = form.querySelector<HTMLButtonElement>('[data-back]')!
const indicator = form.querySelector('[data-step-number]')!
const days = form.querySelector('[data-days]')!
const monthLabel = form.querySelector('[data-month]')!
const selectedDayLabel = form.querySelector('[data-day]')!
const hours = form.querySelector('[data-hours]')!
const slotStatus = form.querySelector('[data-slot-status]')!
const previous = form.querySelector<HTMLButtonElement>('[data-prev-month]')!
const following = form.querySelector<HTMLButtonElement>('[data-next-month]')!
const bookingError = form.querySelector<HTMLElement>('[data-booking-error]')!
const mode = () => new FormData(form).get('mode') as Mode
const dayLabel = new Intl.DateTimeFormat('es-ES', { dateStyle: 'full', timeZone })
const monthFormat = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric', timeZone })
const appointment = new Intl.DateTimeFormat('es-ES', { dateStyle: 'full', timeStyle: 'short', timeZone })
const toDate = (day: string) => new Date(day + 'T12:00:00Z')
const currentMonth = () => dateKey(new Date()).slice(0, 7) + '-01'
function offsetMonth(month: string, count: number) {
  const date = toDate(month)
  date.setUTCMonth(date.getUTCMonth() + count)
  return date.toISOString().slice(0, 10)
}

let month = currentMonth()
let day: string | undefined
let step = 0
let selected: ReturnType<typeof slotsFor>[number] | undefined

if (new URLSearchParams(location.search).get('modalidad') === 'llamada') {
  form.querySelector<HTMLInputElement>('input[value="Llamada gratuita"]')!.checked = true
}

function showHours(now: Date) {
  const slots = day ? slotsFor(day, now, mode()) : []
  const selectedTime = selected?.start.getTime()
  if (selected && !slots.some(slot => slot.start.getTime() === selectedTime)) selected = undefined
  next.disabled = !selected
  slotStatus.textContent = ''
  hours.replaceChildren()
  selectedDayLabel.textContent = day ? dayLabel.format(toDate(day)) : 'Horas disponibles'
  if (!slots.length) {
    const empty = document.createElement('p')
    empty.textContent = 'No hay horas disponibles en este mes.'
    hours.append(empty)
  }
  for (const slot of slots) {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'slot'
    button.dataset.slot = slot.start.toISOString()
    button.setAttribute('aria-label', appointment.format(slot.start))
    button.setAttribute('aria-pressed', String(selected?.start.valueOf() === slot.start.valueOf()))
    const label = document.createElement('span')
    label.textContent = slot.label
    const reservation = document.createElement('em')
    reservation.textContent = 'Reservado para ti'
    reservation.setAttribute('aria-hidden', 'true')
    button.append(label, reservation)
    button.addEventListener('click', () => {
      selected = slot
      for (const other of hours.querySelectorAll('[data-slot]')) other.setAttribute('aria-pressed', String(other === button))
      slotStatus.textContent = slot.label + ', reservado para ti'
      next.disabled = false
      bookingError.hidden = true
    })
    hours.append(button)
  }
}

function showMonth() {
  const now = new Date()
  const end = offsetMonth(month, 1)
  const available = new Set<string>()
  for (let date = month; date < end; date = addDays(date, 1)) {
    if (slotsFor(date, now, mode()).length) available.add(date)
  }
  if (!day || !available.has(day)) day = available.values().next().value
  monthLabel.textContent = monthFormat.format(toDate(month))
  previous.disabled = month <= currentMonth()
  days.replaceChildren()
  for (let date = monday(month); date < month; date = addDays(date, 1)) days.append(document.createElement('span'))
  for (let date = month; date < end; date = addDays(date, 1)) {
    const button = document.createElement('button')
    button.type = 'button'
    button.textContent = String(Number(date.slice(-2)))
    button.disabled = !available.has(date)
    button.setAttribute('aria-label', dayLabel.format(toDate(date)))
    button.setAttribute('aria-pressed', String(date === day))
    button.addEventListener('click', () => {
      if (date === day) return
      day = date
      selected = undefined
      bookingError.hidden = true
      for (const other of days.querySelectorAll('button')) other.setAttribute('aria-pressed', String(other === button))
      showHours(new Date())
    })
    days.append(button)
  }
  showHours(now)
}

function move(target: number) {
  step = target
  panels.forEach((panel, index) => { panel.hidden = index !== target })
  const panel = panels[target]
  indicator.textContent = target === 3 ? 'Confirmación' : 'Paso ' + (target + 1) + ' de 3'
  next.hidden = target === 3
  back.hidden = target === 0 || target === 3
  next.disabled = target === 1 && !selected
  next.textContent = target === 2 ? 'Confirmar reserva de demostración' : 'Continuar'
  if (target === 1) {
    month = month < currentMonth() ? currentMonth() : month
    showMonth()
  }
  panel.querySelector('h2')!.focus()
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    animate(panel, { opacity: [.25, 1], y: [8, 0] }, { duration: .45, ease: [.22, 1, .36, 1] })
  }
}

function changeMonth(increment: number) {
  if (increment < 0 && month <= currentMonth()) return
  month = offsetMonth(month, increment)
  selected = undefined
  bookingError.hidden = true
  showMonth()
  if (previous.disabled && increment < 0) following.focus()
}

previous.addEventListener('click', () => changeMonth(-1))
following.addEventListener('click', () => changeMonth(1))
back.addEventListener('click', () => move(step - 1))
form.addEventListener('change', event => {
  if ((event.target as HTMLInputElement).name !== 'mode') return
  selected = undefined
  bookingError.hidden = true
  showMonth()
})
form.addEventListener('submit', event => {
  event.preventDefault()
  if (step < 2) {
    if (step === 1 && !selected) return
    move(step + 1)
    return
  }
  if (step !== 2 || !selected) return
  const data = new FormData(form)
  const value = (key: string) => String(data.get(key) ?? '').trim()
  const errors = validateBooking({ name: value('name'), email: value('email'), phone: value('phone'), privacy: data.has('privacy') })
  let firstError: HTMLInputElement | undefined
  for (const [name, message] of Object.entries(errors)) {
    form.querySelector('#error-' + name)!.textContent = message
    const input = form.querySelector<HTMLInputElement>('[name="' + name + '"]')!
    input.setAttribute('aria-invalid', String(Boolean(message)))
    if (message) firstError ??= input
  }
  if (firstError) {
    firstError.focus()
    return
  }
  const slot = selected
  if (slot.start.getTime() - Date.now() < 86_400_000) {
    selected = undefined
    move(1)
    bookingError.textContent = 'Ese hueco ya está a menos de 24 horas. Elige otro.'
    bookingError.hidden = false
    return
  }
  const summary = form.querySelector('[data-summary]')!
  const details = [['Nombre', value('name')], ['Motivo', value('reason')], ['Modalidad', mode()], ['Fecha y hora', appointment.format(slot.start) + ' (hora de Valencia)']]
  for (const [label, text] of details) {
    const term = document.createElement('dt')
    const description = document.createElement('dd')
    term.textContent = label
    description.textContent = text
    summary.append(term, description)
  }
  const download = form.querySelector<HTMLAnchorElement>('[data-calendar]')!
  download.href = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(calendarFile(slot.start, slot.end))
  move(3)
})
form.hidden = false
