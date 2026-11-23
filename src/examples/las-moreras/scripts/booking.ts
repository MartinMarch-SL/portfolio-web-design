import { available, bookingPrice, calendarFile, clock, courts, hours, isActive, makeBooking, maxBookings, sameSlot, week, type Booking, type Slot } from '../lib/booking'
import { money } from '../lib/registration'
import { downloadFile } from './download'

const storageKey = 'las-moreras-reservas-v1'
const dayFormat = new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
const labelDate = (date: string) => dayFormat.format(new Date(date + 'T12:00:00'))
const describe = (slot: Slot) => `Pista ${slot.court} · ${courts.find(court => court.id === slot.court)?.name} · ${labelDate(slot.date)} · ${clock(slot.hour)}–${clock(slot.hour + 1)}`
type State = { bookings: Booking[], date: string, draft?: Slot, surface: string, member: boolean, players: number }

export function mountBooking(root: HTMLElement, signal: AbortSignal) {
  const get = <T extends HTMLElement = HTMLElement>(selector: string) => root.querySelector<T>(selector)!
  const days = get('[data-days]')
  const grid = get('[data-grid]')
  const surface = get<HTMLSelectElement>('[data-surface]')
  const member = get<HTMLInputElement>('[data-member]')
  const players = get<HTMLSelectElement>('[data-players]')
  const status = get('[data-booking-status]')
  const confirm = get<HTMLButtonElement>('[data-confirm]')
  const active = get('[data-active]')
  const windowDays = week(new Date())
  let date = windowDays[0]
  let bookings: Booking[] = []
  let draft: Slot | undefined
  let highlightedHour: number | undefined

  function read(): Partial<State> | undefined {
    try { return JSON.parse(localStorage.getItem(storageKey) ?? 'null') ?? undefined } catch { return undefined }
  }
  function current(items: unknown): Booking[] {
    if (!Array.isArray(items)) return []
    return items.filter(item => item && typeof item.date === 'string' && available(item) && isActive(item, new Date()) &&
      typeof item.code === 'string' && /^CTM-R-[A-Z0-9]{5}$/.test(item.code) &&
      typeof item.member === 'boolean' && Number.isInteger(item.players) && item.players >= 1 && item.players <= 4)
  }
  const saved = read()
  if (saved) {
    bookings = current(saved.bookings)
    if (saved.date && windowDays.includes(saved.date)) date = saved.date
    if (saved.draft?.date === date && available(saved.draft, bookings) && isActive(saved.draft, new Date())) draft = saved.draft
    surface.value = ['', 'clay', 'hard', 'mini'].includes(saved.surface ?? '') ? saved.surface ?? '' : ''
    member.checked = saved.member === true
    if ([1, 2, 3, 4].includes(saved.players ?? 0)) players.value = String(saved.players)
  }
  const params = new URL(location.href).searchParams
  const requested = params.get('fecha')
  if (requested && windowDays.includes(requested)) {
    if (requested !== date) draft = undefined
    date = requested
    const hour = Number(params.get('hora'))
    if (hours.includes(hour)) highlightedHour = hour
    history.replaceState(history.state, '', location.pathname + location.hash)
  }

  function save() {
    const state: State = { date, bookings, draft, surface: surface.value, member: member.checked, players: Number(players.value) }
    try { localStorage.setItem(storageKey, JSON.stringify(state)) } catch {}
  }

  function renderGrid() {
    days.innerHTML = windowDays.map(day => `<button type="button" data-day="${day}" aria-pressed="${day === date}">${labelDate(day)}</button>`).join('')
    const now = new Date()
    const rows = courts.filter(court => !surface.value || surface.value === court.surface)
    grid.innerHTML = `<caption class="sr-only">Disponibilidad por pista y hora</caption><thead><tr><th scope="col">Pista</th>${hours.map(hour => `<th id="turno-${hour}" scope="col"${hour === highlightedHour ? ' class="hour-highlight"' : ''}>${clock(hour)}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(court => `<tr><th scope="row">${String(court.id).padStart(2, '0')} <small>${court.name}</small></th>${hours.map(hour => {
        const slot = { date, court: court.id, hour }
        const free = available(slot, bookings) && isActive(slot, now)
        const selected = draft && sameSlot(draft, slot)
        return `<td><button type="button" data-slot="${court.id}/${hour}" aria-label="Pista ${court.id}, ${clock(hour)}, ${free ? 'libre' : 'no disponible'}" aria-pressed="${Boolean(selected)}" ${free ? '' : 'disabled'}>${free ? (selected ? 'Elegida' : 'Libre') : '—'}</button></td>`
      }).join('')}</tr>`).join('')}</tbody>`
  }

  function renderQuote() {
    const price = draft && bookingPrice(draft.court, draft.hour, member.checked)
    get('[data-selection]').textContent = draft ? describe(draft) : 'Selecciona una pista libre en la parrilla.'
    get('[data-booking-price]').innerHTML = price ? `<div><dt>Tarifa ${member.checked ? 'de socio' : 'general'}</dt><dd>${money(price.base)}</dd></div>
      <div><dt>Suplemento de luz</dt><dd>${money(price.lights)}</dd></div><div><dt>Total</dt><dd data-booking-total>${money(price.total)}</dd></div>` : ''
    confirm.disabled = !price || bookings.length >= maxBookings
  }

  function renderActive() {
    active.innerHTML = bookings.length ? bookings.map(item => {
      const price = bookingPrice(item.court, item.hour, item.member)!
      return `<article class="booking-ticket">
        <div><h3 class="locator">${item.code}</h3><p>${describe(item)}</p>
        <p>${item.players} ${item.players === 1 ? 'jugador' : 'jugadores'} · ${item.member ? 'Socio' : 'No socio'} · Pista ${money(price.base)} + luz ${money(price.lights)} · Total ${money(price.total)}</p></div>
        <div class="actions"><button type="button" data-calendar="${item.code}">Descargar .ics</button><button type="button" class="plain" data-cancel="${item.code}">Cancelar reserva</button></div>
      </article>`
    }).join('') : '<p>No tienes reservas activas.</p>'
  }

  function render() {
    renderGrid()
    renderQuote()
    renderActive()
  }
  const syncBookings = () => {
    const stored = read()
    bookings = current(stored?.bookings ?? bookings)
    if (draft && !available(draft, bookings)) draft = undefined
  }

  days.addEventListener('click', event => {
    const button = (event.target as Element).closest<HTMLButtonElement>('[data-day]')
    if (!button) return
    date = button.dataset.day!
    if (draft?.date !== date) draft = undefined
    highlightedHour = undefined
    renderGrid()
    renderQuote()
    days.querySelector<HTMLButtonElement>('[aria-pressed="true"]')?.focus()
    save()
  }, { signal })
  grid.addEventListener('click', event => {
    const button = (event.target as Element).closest<HTMLButtonElement>('[data-slot]')
    if (!button || button.disabled) return
    const key = button.dataset.slot!
    const [court, hour] = key.split('/').map(Number)
    const selection = { date, court, hour }
    syncBookings()
    if (!available(selection, bookings) || !isActive(selection, new Date())) {
      status.textContent = 'Ese turno ya no está disponible.'
      render()
      return
    }
    draft = selection
    status.textContent = bookings.length >= maxBookings ? 'Ya tienes dos reservas activas. Cancela una para reservar otra pista.' : ''
    renderGrid()
    renderQuote()
    grid.querySelector<HTMLButtonElement>(`[data-slot="${key}"]`)?.focus({ preventScroll: true })
    save()
  }, { signal })
  surface.addEventListener('change', () => { renderGrid(); save() }, { signal })
  for (const field of [member, players]) field.addEventListener('change', () => { renderQuote(); save() }, { signal })
  confirm.addEventListener('click', () => {
    syncBookings()
    const result = draft && makeBooking(draft, member.checked, Number(players.value), bookings, new Date())
    if (!result) {
      status.textContent = bookings.length >= maxBookings ? 'Ya tienes dos reservas activas.' : 'Ese turno ya no está disponible.'
      draft = undefined
    } else {
      bookings.push(result)
      status.textContent = 'Reserva guardada. Localizador ' + result.code + '.'
      draft = undefined
    }
    save()
    render()
    if (result) active.querySelector<HTMLButtonElement>(`[data-calendar="${result.code}"]`)?.focus()
  }, { signal })
  active.addEventListener('click', event => {
    const button = (event.target as Element).closest<HTMLButtonElement>('button')
    if (!button) return
    if (button.dataset.cancel) {
      syncBookings()
      bookings = bookings.filter(item => item.code !== button.dataset.cancel)
      status.textContent = 'Reserva cancelada.'
      save()
      render()
      get('[data-booking-status]').setAttribute('tabindex', '-1')
      status.focus()
      return
    }
    const item = bookings.find(item => item.code === button.dataset.calendar)
    if (item) downloadFile(item.code + '.ics', 'text/calendar;charset=utf-8', calendarFile(item))
  }, { signal })
  addEventListener('storage', event => {
    if (event.key !== storageKey) return
    bookings = current(read()?.bookings)
    if (draft && !available(draft, bookings)) draft = undefined
    render()
  }, { signal })
  render()
  if (highlightedHour !== undefined) {
    const cell = grid.querySelector<HTMLElement>('.hour-highlight')!
    const container = grid.parentElement!
    container.scrollLeft = cell.offsetLeft - grid.querySelector('th')!.offsetWidth
  }
}
