import { flash, styles, type Style } from '../data/flash'
import { zones } from '../data/zones'
import { availability, dateKey } from '../lib/calendar'
import { download } from '../lib/download'
import { estimate } from '../lib/pricing'
import { flashSource, formatSize, mountScan } from './scan'

const storageKey = 'lia-ferro-encargo-v1'
const spanishDate = new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
const appointmentDate = new Intl.DateTimeFormat('es-ES', { dateStyle: 'full' })
const number = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 })
const defaults = {
  step: 0, zone: '', design: '', style: 'Fine line' as Style, detail: 1, ink: 'black',
  size: 10, rotation: 0, x: 0, y: 0, week: 0, slot: '', customer: '', email: '',
  code: '', image: '', aspect: 1,
}

function restore() {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) ?? '{}')
    const state = { ...defaults }
    for (const key of Object.keys(defaults) as (keyof typeof defaults)[]) {
      if (typeof stored?.[key] === typeof defaults[key]) Object.assign(state, { [key]: stored[key] })
    }
    if (!styles.includes(state.style) || state.step < 0 || state.step > 6 || !Number.isInteger(state.step)) return { ...defaults }
    if (!zones.some(zone => zone.id === state.zone) && state.step > 0) return { ...defaults }
    if (!/^data:image\/(png|jpeg|webp|gif|avif|svg\+xml);base64,/i.test(state.image)) state.image = ''
    return state
  } catch { return { ...defaults } }
}

export function mountBooking(root: HTMLElement, signal: AbortSignal) {
  const state = restore()
  const form = root.querySelector<HTMLFormElement>('[data-booking-form]')!
  const input = (name: string) => form.elements.namedItem(name) as HTMLInputElement
  const steps = [...form.querySelectorAll<HTMLElement>('[data-step]')]
  const progress = [...root.querySelectorAll('[data-progress]')]
  const message = form.querySelector<HTMLElement>('[role=status]')!
  const next = form.querySelector<HTMLButtonElement>('[data-next]')!
  const back = form.querySelector<HTMLButtonElement>('[data-back]')!
  const days = availability()
  const search = flash.find(design => design.id === new URLSearchParams(location.search).get('flash'))
  const scan = mountScan(root.querySelector<HTMLElement>('[data-scan]')!, signal, pickZone)
  const list = form.querySelectorAll<HTMLButtonElement>('[data-zone]')
  const slots = form.querySelector<HTMLElement>('.slots')!
  let fileRequest = 0, reading = false

  if (search && history.state?.liaFlash !== search.id) {
    history.replaceState({ ...history.state, liaFlash: search.id }, '')
    Object.assign(state, { step: state.zone ? 1 : 0, design: search.id, size: search.size, style: search.style, image: '', aspect: 1, slot: '', code: '' })
  }
  if (state.step < 6 && state.slot && !days.some(day => day.key === state.slot.slice(0, 10) && (state.slot.endsWith('am') ? day.morning : day.afternoon))) {
    state.slot = ''
    state.step = Math.min(state.step, 4)
  }
  state.week = Math.max(0, Math.min(7, Math.floor(state.week)))
  const week = input('week') as unknown as HTMLSelectElement
  for (let i = 0; i < 8; i++) week.add(new Option(`${spanishDate.format(days[i * 7].date)} a ${spanishDate.format(days[i * 7 + 6].date)}`, String(i)))

  const selectedZone = () => zones.find(zone => zone.id === state.zone)
  const selectedFlash = () => flash.find(design => design.id === state.design)
  const price = () => estimate(state.size, state.style, selectedZone()?.difficulty ?? 1, state.detail, state.ink === 'color', selectedFlash()?.price, Math.min(state.aspect, 1 / state.aspect))
  const appointment = () => {
    const date = new Date(state.slot.slice(0, 10) + 'T12:00:00')
    return Number.isNaN(+date) ? '' : `${appointmentDate.format(date)} · ${state.slot.endsWith('am') ? '10:30' : '16:30'}`
  }

  function persist() {
    try { localStorage.setItem(storageKey, JSON.stringify(state)) } catch {
      try { localStorage.setItem(storageKey, JSON.stringify({ ...state, image: '', aspect: 1 })) } catch { /* Storage is optional. */ }
    }
  }

  function syncInputs() {
    for (const name of ['design', 'style', 'detail', 'ink', 'size', 'rotation', 'x', 'y', 'week', 'customer', 'email'] as const) input(name).value = String(state[name])
  }

  function updatePlacement() {
    const zone = selectedZone()
    const design = selectedFlash()
    input('size').max = String(zone?.max ?? 28)
    state.size = Math.max(2, Math.min(zone?.max ?? 28, state.size))
    if (input('size').value && Number(input('size').value) !== state.size) input('size').value = String(state.size)
    list.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.zone === state.zone)))
    form.querySelector('[data-dimensions]')!.textContent = `${formatSize(state.size, state.aspect)} · máximo ${zone?.max ?? 28} cm`
    scan({ ...state, zone, src: state.image || (design && flashSource(design)) })
    persist()
  }

  function pickZone(id: string) {
    if (state.step >= 5 || !zones.some(zone => zone.id === id)) return
    state.zone = id
    message.textContent = ''
    updatePlacement()
    if (state.step === 3) renderPrice()
  }

  function renderPrice() {
    const value = price()
    const rows = [
      ['Superficie', `${number.format(value.area)} cm²`], ['Estilo', `× ${number.format(value.factor)}`],
      ['Zona', `× ${number.format(selectedZone()?.difficulty ?? 1)}`], ['Detalle', `× ${number.format(state.detail)}`],
      ['Tinta', `× ${number.format(value.colorFactor)}`], ['Tiempo en cabina', `${number.format(value.hours)} h`],
      ['Sesiones (hasta 3 h)', String(value.sessions)], ['Rango estimado', `${value.low}–${value.high} €`], ['Señal', `${value.deposit} €`],
    ]
    form.querySelector('.estimate')!.replaceChildren(...rows.map(([key, amount]) => {
      const row = document.createElement('div')
      const label = document.createElement('dt')
      const data = document.createElement('dd')
      label.textContent = key
      data.textContent = amount
      row.append(label, data)
      return row
    }))
  }

  function renderSlots() {
    const fragment = document.createDocumentFragment()
    for (const day of days.slice(state.week * 7, state.week * 7 + 7)) {
      const row = document.createElement('div')
      row.className = 'slot-day'
      const date = document.createElement('time')
      date.dateTime = day.key
      date.textContent = spanishDate.format(day.date)
      row.append(date)
      for (const [key, available, label] of [['am', day.morning, 'Mañana'], ['pm', day.afternoon, 'Tarde']] as const) {
        const radio = document.createElement('input')
        radio.type = 'radio'
        radio.name = 'slot'
        radio.value = `${day.key}-${key}`
        radio.disabled = !available
        radio.checked = radio.value === state.slot
        radio.setAttribute('aria-label', `${label}, ${appointmentDate.format(day.date)}${available ? '' : ', ocupado'}`)
        const wrapper = document.createElement('label')
        wrapper.append(radio, label)
        row.append(wrapper)
      }
      fragment.append(row)
    }
    slots.replaceChildren(fragment)
  }

  function render(focus = false) {
    steps.forEach((step, index) => {
      step.hidden = index !== state.step
      step.querySelectorAll('input, select, button').forEach((element) => {
        if (element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLButtonElement) element.disabled = index !== state.step
      })
    })
    progress.forEach((item, index) => index === state.step ? item.setAttribute('aria-current', 'step') : item.removeAttribute('aria-current'))
    back.hidden = state.step === 0 || state.step === 6
    next.hidden = state.step === 6
    next.textContent = state.step === 5 ? 'Simular pago y reservar' : 'Continuar'
    message.textContent = ''
    if (state.step === 3) renderPrice()
    if (state.step === 4) renderSlots()
    if (state.step === 5) form.querySelector('[data-deposit]')!.textContent = `${price().deposit} € · ${appointment()}`
    if (state.step === 6) {
      form.querySelector('[data-code]')!.textContent = state.code
      form.querySelector('[data-appointment]')!.textContent = appointment()
    }
    if (focus) steps[state.step].querySelector<HTMLElement>('h2')!.focus()
    persist()
  }

  form.addEventListener('click', event => {
    const clicked = (event.target as HTMLElement).closest<HTMLButtonElement>('button')
    if (!clicked) return
    if (clicked.dataset.zone) pickZone(clicked.dataset.zone)
    if ('back' in clicked.dataset) { state.step--; input('card').value = ''; render(true) }
    if ('reset' in clicked.dataset) {
      fileRequest++
      reading = false
      Object.assign(state, defaults)
      input('file').value = ''
      input('card').value = ''
      syncInputs()
      updatePlacement()
      render(true)
    }
    if ('summary' in clicked.dataset) {
      const value = price()
      const text = ['Lía Ferro · Reserva de demostración', state.code, appointment(), state.customer, state.email,
        `${selectedZone()?.name} · ${selectedFlash()?.name ?? 'Pieza a medida'} · ${formatSize(state.size, state.aspect)}`,
        `${value.sessions} sesión(es) · Presupuesto ${value.low}–${value.high} €`, `Señal simulada: ${value.deposit} €. Sin cargo.`].join('\n')
      download(`${state.code}.txt`, text, 'text/plain;charset=utf-8')
    }
  }, { signal })

  form.addEventListener('input', event => {
    const target = event.target as HTMLInputElement
    if (target.name === 'size' && target.value) {
      state.size = Number(target.value)
      if (state.size < 2) return
      updatePlacement()
    }
    if (target.name === 'rotation' || target.name === 'x' || target.name === 'y') {
      state[target.name] = Number(target.value)
      updatePlacement()
    }
    if (target.name === 'customer' || target.name === 'email') { state[target.name] = target.value; persist() }
  }, { signal })

  form.addEventListener('change', event => {
    const target = event.target as HTMLInputElement
    switch (target.name) {
      case 'design': {
        fileRequest++
        reading = false
        state.design = target.value
        state.image = ''
        state.aspect = 1
        input('file').value = ''
        const design = selectedFlash()
        if (design) { state.style = design.style; state.size = design.size }
        syncInputs()
        updatePlacement()
        break
      }
      case 'file': {
        const file = target.files?.[0]
        if (!file) return
        if (!/^image\/(png|jpeg|webp|gif|avif|svg\+xml)$/i.test(file.type) || file.size > 2 * 1024 * 1024) {
          message.textContent = 'Elige un archivo de imagen compatible de hasta 2 MB.'
          target.value = ''
          return
        }
        const request = ++fileRequest
        const reader = new FileReader()
        reading = true
        const invalid = () => {
          if (request !== fileRequest || signal.aborted) return
          reading = false
          message.textContent = 'No se ha podido abrir la imagen.'
          target.value = ''
        }
        reader.onerror = invalid
        reader.onload = () => {
          const src = String(reader.result)
          const image = new Image()
          image.onerror = invalid
          image.onload = () => {
            if (request !== fileRequest || signal.aborted) return
            reading = false
            state.image = src
            state.aspect = image.naturalWidth / image.naturalHeight
            state.design = ''
            input('design').value = ''
            message.textContent = 'Referencia cargada en este dispositivo.'
            updatePlacement()
          }
          image.src = src
        }
        reader.readAsDataURL(file)
        break
      }
      case 'style': state.style = target.value as Style; break
      case 'detail': state.detail = Number(target.value); break
      case 'ink': state.ink = target.value; break
      case 'week': state.week = Number(target.value); renderSlots(); break
      case 'slot': state.slot = target.value; message.textContent = ''; break
    }
    persist()
  }, { signal })

  form.addEventListener('submit', event => {
    event.preventDefault()
    if (state.step === 0 && !selectedZone()) { message.textContent = 'Elige una zona para continuar.'; return }
    if (state.step === 1 && reading) { message.textContent = 'Espera a que se abra la referencia.'; return }
    if (state.step === 4 && !state.slot) { message.textContent = 'Elige un horario disponible.'; return }
    if (state.step === 4 && !state.customer.trim()) { message.textContent = 'Escribe tu nombre.'; input('customer').focus(); return }
    if (state.step === 5) {
      if (input('card').value.replaceAll(' ', '') !== '4242424242424242') {
        message.textContent = 'Introduce el número de prueba 4242 4242 4242 4242.'
        input('card').focus()
        return
      }
      input('card').value = ''
      const code = crypto.getRandomValues(new Uint32Array(1))[0].toString(36).toUpperCase().padStart(7, '0')
      state.code = `LF-${dateKey(new Date()).slice(5).replace('-', '')}-${code}`
    }
    if (state.step < 6) { state.step++; render(true) }
  }, { signal })

  syncInputs()
  updatePlacement()
  render()
}
