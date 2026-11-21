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
const weekLabel = form.querySelector('[data-week]')!
const prevWeek = form.querySelector<HTMLButtonElement>('[data-prev-week]')!
const nextWeek = form.querySelector<HTMLButtonElement>('[data-next-week]')!
const bookingError = form.querySelector<HTMLElement>('[data-booking-error]')!
const mode = () => new FormData(form).get('mode') as Mode
const dayLabel = new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric', month: 'short', timeZone })
const appointment = new Intl.DateTimeFormat('es-ES', { dateStyle: 'full', timeStyle: 'short', timeZone })
const currentWeek = () => monday(dateKey(new Date()))
const toDate = (day: string) => new Date(day + 'T12:00:00Z')
let week = currentWeek()
let step = 0
let selected: ReturnType<typeof slotsFor>[number] | undefined

if (new URLSearchParams(location.search).get('modalidad') === 'llamada') {
  form.querySelector<HTMLInputElement>('input[value="Llamada gratuita"]')!.checked = true
}

function showWeek() {
  weekLabel.textContent = dayLabel.format(toDate(week)) + ' – ' + dayLabel.format(toDate(addDays(week, 4)))
  prevWeek.disabled = week <= currentWeek()
  days.replaceChildren()
  const now = new Date()
  for (let i = 0; i < 5; i++) {
    const day = addDays(week, i)
    const cell = document.createElement('div')
    const heading = document.createElement('h3')
    heading.textContent = dayLabel.format(toDate(day))
    cell.append(heading)
    const slots = slotsFor(day, now, mode())
    if (slots.length === 0) {
      const empty = document.createElement('p')
      empty.textContent = 'Sin huecos'
      cell.append(empty)
    }
    for (const slot of slots) {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'button secondary'
      button.textContent = slot.label
      button.dataset.slot = slot.start.toISOString()
      button.setAttribute('aria-label', appointment.format(slot.start))
      button.setAttribute('aria-pressed', String(selected?.start.valueOf() === slot.start.valueOf()))
      button.addEventListener('click', () => {
        selected = slot
        for (const other of days.querySelectorAll('[data-slot]')) other.setAttribute('aria-pressed', String(other === button))
        next.disabled = false
        bookingError.hidden = true
      })
      cell.append(button)
    }
    days.append(cell)
  }
}

function move(target: number) {
  step = target
  panels.forEach((panel, index) => { panel.hidden = index !== target })
  const panel = panels[target]
  indicator.textContent = target === 4 ? 'Confirmación' : 'Paso ' + (target + 1) + ' de 4'
  next.hidden = target === 4
  back.hidden = target === 0 || target === 4
  next.disabled = target === 2 && !selected
  next.textContent = target === 3 ? 'Confirmar reserva de demostración' : 'Continuar'
  if (target === 2) showWeek()
  panel.querySelector('h2')!.focus()
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    animate(panel, { opacity: [.25, 1], y: [8, 0] }, { duration: .45, ease: [.22, 1, .36, 1] })
  }
}

function changeWeek(increment: number) {
  if (increment < 0 && week <= currentWeek()) return
  week = addDays(week, increment * 7)
  selected = undefined
  next.disabled = true
  showWeek()
  if (prevWeek.disabled && increment < 0) nextWeek.focus()
}

prevWeek.addEventListener('click', () => changeWeek(-1))
nextWeek.addEventListener('click', () => changeWeek(1))
back.addEventListener('click', () => move(step - 1))
form.addEventListener('change', event => {
  if ((event.target as HTMLInputElement).name === 'mode') selected = undefined
})
form.addEventListener('submit', event => {
  event.preventDefault()
  if (step < 3) {
    if (step === 2 && !selected) return
    move(step + 1)
    return
  }
  if (step !== 3 || !selected) return
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
    move(2)
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
  move(4)
})
form.hidden = false
