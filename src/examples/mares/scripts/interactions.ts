import { animate } from 'motion'
import { euros, properties, type Area } from '../data/properties'
import { mortgage, valuation, type conditions, type valuationExtras } from '../lib/finance'
import { filterListings, readListing, writeListing } from '../lib/listing'

type Scope = { signal: AbortSignal; reduce: boolean }

export function initListings(root: HTMLElement, { signal, reduce }: Scope) {
  const form = root.querySelector<HTMLFormElement>('form')!
  const grid = root.querySelector<HTMLElement>('[data-results]')!
  const map = root.querySelector<HTMLElement>('[data-map-results]')!
  const empty = root.querySelector<HTMLElement>('[data-empty]')!
  const count = root.querySelector<HTMLElement>('[data-count]')!
  const cards = new Map([...grid.querySelectorAll<HTMLElement>('[data-property]')].map(card => [card.dataset.property!, card]))
  const pins = [...map.querySelectorAll<SVGElement | HTMLElement>('[data-pin]')]
  const buttons = root.querySelectorAll<HTMLButtonElement>('[data-view]')
  const fields = [...form.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[name]')]
  const view = form.querySelector<HTMLInputElement>('input[name=vista]')!
  const inline = root.querySelector<HTMLElement>('[data-filter-inline]')!
  const opener = root.querySelector<HTMLButtonElement>('[data-filter-open]')!
  const activeCount = root.querySelector<HTMLElement>('[data-filter-count]')!
  const sheet = root.querySelector<HTMLDialogElement>('.filter-sheet')!
  const close = sheet.querySelector<HTMLButtonElement>('[data-filter-close]')!
  const mobile = matchMedia('(width < 768px)')
  let countAnimation: ReturnType<typeof animate> | undefined
  signal.addEventListener('abort', () => countAnimation?.cancel(), { once: true })

  function syncFields(query: ReturnType<typeof readListing>, canonical: URLSearchParams) {
    fields.forEach(field => {
      if (field instanceof HTMLInputElement && field.type === 'checkbox') {
        field.checked = canonical.getAll(field.name).includes(field.value)
      } else {
        field.value = field.name === 'orden' ? query.orden : canonical.get(field.name) ?? (field === view ? 'lista' : '')
      }
    })
  }

  function render(params: URLSearchParams, updateUrl = false) {
    const query = readListing(params)
    const canonical = writeListing(query)
    const matching = filterListings(properties, query)
    const ids = new Set(matching.map(property => property.slug))
    syncFields(query, canonical)
    const filterCount = canonical.size - Number(canonical.has('orden')) - Number(canonical.has('vista'))
    activeCount.textContent = String(filterCount)
    cards.forEach((card, slug) => { card.hidden = !ids.has(slug) })
    matching.forEach(property => grid.append(cards.get(property.slug)!))
    pins.forEach(pin => pin.toggleAttribute('hidden', !ids.has(pin.dataset.pin!)))
    const summary = `${matching.length} ${matching.length === 1 ? 'vivienda' : 'viviendas'}`
    if (summary !== count.textContent && !reduce) {
      countAnimation?.cancel()
      countAnimation = animate(count, { y: [5, 0], opacity: [.9, 1] }, { duration: .45, ease: [.22, .72, .18, 1] })
    }
    count.textContent = summary
    grid.hidden = query.vista !== 'lista' || !matching.length
    map.hidden = query.vista !== 'mapa' || !matching.length
    empty.hidden = matching.length > 0
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === query.vista)))
    if (updateUrl) {
      const search = canonical.toString()
      history.replaceState(history.state, '', location.pathname + (search ? '?' + search : '') + location.hash)
    }
  }

  const submit = () => render(new URLSearchParams([...new FormData(form)].map(([key, value]) => [key, String(value)])), true)
  function syncLayout() {
    if (!mobile.matches && sheet.open) sheet.close()
    opener.hidden = !mobile.matches
    inline.hidden = mobile.matches
  }

  opener.addEventListener('click', () => {
    sheet.append(form)
    sheet.showModal()
  }, { signal })
  close.addEventListener('click', () => sheet.close(), { signal })
  sheet.addEventListener('close', () => {
    if (sheet.open) return
    const query = readListing(new URLSearchParams(location.search))
    syncFields(query, writeListing(query))
    inline.append(form)
    if (mobile.matches) opener.focus()
  }, { signal })
  mobile.addEventListener('change', syncLayout, { signal })
  signal.addEventListener('abort', () => {
    if (sheet.open) sheet.close()
    inline.append(form)
    inline.hidden = false
    opener.hidden = true
  }, { once: true })

  form.addEventListener('submit', event => {
    event.preventDefault()
    submit()
    if (sheet.open) sheet.close()
  }, { signal })
  form.addEventListener('change', () => { if (!sheet.open) submit() }, { signal })
  form.addEventListener('reset', event => {
    event.preventDefault()
    render(new URLSearchParams(view.value === 'mapa' ? 'vista=mapa' : ''), true)
    if (sheet.open) sheet.close()
  }, { signal })
  buttons.forEach(button => button.addEventListener('click', () => { view.value = button.dataset.view!; submit() }, { signal }))
  window.addEventListener('popstate', () => render(new URLSearchParams(location.search)), { signal })
  render(new URLSearchParams(location.search))
  syncLayout()
}

export function initMap(root: HTMLElement, { signal, reduce }: Scope) {
  const points = [...root.querySelectorAll<SVGAElement>('[data-area]')]
  const stats = [...root.querySelectorAll<HTMLAnchorElement>('[data-stat]')]
  let selected = stats.find(stat => stat.classList.contains('active'))?.dataset.stat
  let selectedBeforeTouch: string | undefined
  let effect: ReturnType<typeof animate> | undefined
  signal.addEventListener('abort', () => effect?.cancel(), { once: true })
  function select(area: string) {
    if (area === selected) return
    selected = area
    points.forEach(point => point.classList.toggle('active', point.dataset.area === area))
    stats.forEach(stat => {
      const active = stat.dataset.stat === area
      stat.classList.toggle('active', active)
      if (active && !reduce) {
        effect?.cancel()
        effect = animate(stat, { opacity: [.9, 1] }, { duration: .35 })
      }
    })
  }
  points.forEach(point => {
    const activate = () => select(point.dataset.area!)
    point.addEventListener('focus', activate, { signal })
    point.addEventListener('pointerdown', event => {
      if (event.pointerType === 'touch') selectedBeforeTouch = selected
    }, { signal })
    point.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') activate() }, { signal })
    point.addEventListener('click', event => {
      if (event instanceof PointerEvent && event.pointerType === 'touch' && selectedBeforeTouch !== point.dataset.area) {
        event.preventDefault()
        activate()
      }
    }, { signal })
  })
  stats.forEach(stat => {
    stat.addEventListener('focus', () => select(stat.dataset.stat!), { signal })
    stat.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') select(stat.dataset.stat!) }, { signal })
  })
}

export function initGallery(root: HTMLElement, { signal }: Scope) {
  const dialog = root.querySelector('dialog')!
  const frames = [...root.querySelectorAll<HTMLButtonElement>('[data-frame]')]
  const image = dialog.querySelector<HTMLImageElement>('[data-lightbox-img]')!
  const count = dialog.querySelector<HTMLElement>('[data-frame-count]')!
  const close = dialog.querySelector<HTMLButtonElement>('[data-close]')!
  const prev = dialog.querySelector<HTMLButtonElement>('[data-prev]')!
  const next = dialog.querySelector<HTMLButtonElement>('[data-next]')!
  const controls = [close, prev, next]
  let opener: HTMLButtonElement | undefined
  let current = 0

  function show(index: number) {
    current = (index + frames.length) % frames.length
    image.src = frames[current].dataset.src!
    image.alt = `Vista ${current + 1} de la vivienda`
    count.textContent = `${current + 1} / ${frames.length}`
  }
  frames.forEach((frame, index) => frame.addEventListener('click', () => {
    opener = frame
    show(index)
    dialog.showModal()
    close.focus()
  }, { signal }))
  close.addEventListener('click', () => dialog.close(), { signal })
  prev.addEventListener('click', () => show(current - 1), { signal })
  next.addEventListener('click', () => show(current + 1), { signal })
  dialog.addEventListener('close', () => opener?.focus(), { signal })
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close() }, { signal })
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault()
      show(current + (event.key === 'ArrowLeft' ? -1 : 1))
    }
    if (event.key !== 'Tab') return
    const index = controls.indexOf(document.activeElement as HTMLButtonElement)
    if ((index === 0 && event.shiftKey) || (index === controls.length - 1 && !event.shiftKey)) {
      event.preventDefault()
      controls[event.shiftKey ? controls.length - 1 : 0].focus()
    }
  }, { signal })
  signal.addEventListener('abort', () => { if (dialog.open) dialog.close() }, { once: true })
}

export function initMortgage(form: HTMLFormElement, { signal }: Scope) {
  const payment = form.querySelector<HTMLOutputElement>('[data-payment]')!
  const fields = [...form.querySelectorAll<HTMLInputElement>('input')]
  function update() {
    const [deposit, years, rate] = fields.map(field => field.valueAsNumber)
    payment.textContent = fields.every(field => field.validity.valid)
      ? euros(mortgage(Number(form.dataset.price), deposit, years, rate)) + '/mes'
      : 'Revisa los valores'
  }
  form.addEventListener('input', update, { signal })
  form.addEventListener('submit', event => event.preventDefault(), { signal })
  update()
}

export function initValuation(form: HTMLFormElement, { signal }: Scope) {
  const steps = [...form.querySelectorAll<HTMLFieldSetElement>('[data-step]')]
  const stepCount = form.querySelector<HTMLElement>('[data-step-count]')!
  const next = form.querySelector<HTMLButtonElement>('[data-step-next]')!
  const back = form.querySelector<HTMLButtonElement>('[data-back]')!
  const result = form.parentElement!.querySelector<HTMLElement>('[data-valuation-result]')!
  const output = result.querySelector<HTMLOutputElement>('[data-range]')!
  const edit = result.querySelector<HTMLButtonElement>('[data-edit]')!
  let current = 0
  const field = (name: string) => (form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement).value

  function show(index: number) {
    current = index
    steps.forEach((step, i) => { step.hidden = step.disabled = i !== index })
    back.hidden = index === 0
    next.textContent = index === 2 ? 'Calcular valoración ↗' : 'Continuar →'
    stepCount.textContent = `Paso ${index + 1} de 3`
    steps[index].querySelector<HTMLElement>('select, input')?.focus()
  }

  back.addEventListener('click', () => show(current - 1), { signal })
  edit.addEventListener('click', () => { result.hidden = true; form.hidden = false; show(0) }, { signal })
  form.addEventListener('submit', event => {
    event.preventDefault()
    if (current < 2) { show(current + 1); return }
    const extras = new FormData(form).getAll('extra') as (keyof typeof valuationExtras)[]
    const { min, max } = valuation(field('barrio') as Area, Number(field('superficie')), field('estado') as keyof typeof conditions, extras)
    output.textContent = `${euros(min)} – ${euros(max)}`
    form.hidden = true
    result.hidden = false
    output.tabIndex = -1
    output.focus()
  }, { signal })
}

export function initContact(form: HTMLFormElement, { signal }: Scope) {
  const status = form.querySelector<HTMLElement>('[data-contact-status]')!
  form.addEventListener('submit', event => {
    event.preventDefault()
    const slot = new FormData(form).get('franja')
    status.textContent = slot ? `Visita simulada para ${slot}. Gracias por tu interés.` : 'Solicitud simulada. Gracias por compartir los datos de tu vivienda.'
    form.reset()
  }, { signal })
}
