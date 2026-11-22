import crest from '../../../../public/examples/los-almendros/img/escudo.svg?raw'
import { calculateFee, categoryForBirthDate, money, registrationCode, validateStep, type FormData } from '../lib/registration'

const storageKey = 'los-almendros-preinscripcion-v1'
const escape = (value: string) => value.replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]!))

export function mountRegistration(form: HTMLFormElement, signal: AbortSignal) {
  const input = (name: string) => form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement
  const get = <T extends HTMLElement = HTMLElement>(selector: string) => form.querySelector<T>(selector)!
  const fields = Array.from(form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('[name]'))
  const birthParts = [input('birthYear'), input('birthMonth'), input('birthDay')]
  const birth = () => birthParts.every(part => part.value) ? birthParts.map(part => part.value).join('-') : ''
  const setBirth = (date: string) => {
    const parts = date.split('-')
    birthParts.forEach((part, index) => { part.value = parts[index] ?? '' })
  }
  const panels = Array.from(form.querySelectorAll<HTMLElement>('[data-step]'))
  const note = get('[data-year-note]')
  let step = 1
  let submitted = false
  let partialYear = false
  const values = (): FormData => ({
    ...Object.fromEntries(fields.map(field => [
      field.name, field instanceof HTMLInputElement && field.type === 'checkbox' && !field.checked ? '' : field.value,
    ])),
    birth: birth(),
  })
  const save = () => {
    try { localStorage.setItem(storageKey, JSON.stringify({ step, values: values(), partialYear })) } catch {}
  }
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? 'null')
    if (saved && typeof saved.values === 'object' && saved.values) {
      for (const field of fields) {
        const value = Object.hasOwn(saved.values, field.name) ? saved.values[field.name] : undefined
        if (typeof value !== 'string') continue
        if (field instanceof HTMLInputElement && field.type === 'checkbox') field.checked = value === 'si'
        else field.value = value
      }
      if (!Object.hasOwn(saved.values, 'birthYear') && typeof saved.values.birth === 'string') setBirth(saved.values.birth)
      partialYear = saved.partialYear === true && Boolean(birth())
      if (!partialYear && [2, 3, 4].includes(saved.step)) {
        while (step < saved.step && !Object.keys(validateStep(step, values())).length) step++
      }
    }
  } catch {}

  const year = new URL(location.href).searchParams.get('anio')
  if (year && /^\d{4}$/.test(year) && categoryForBirthDate(year + '-01-01')) {
    if (input('birthYear').value !== year) {
      setBirth(year + '-01-01')
      partialYear = true
    }
    step = 1
    history.replaceState(history.state, '', location.pathname + location.hash)
    save()
  }

  function showErrors(focus = false) {
    const errors = validateStep(step, values())
    if (step === 1 && partialYear) errors.birth = 'Confirma el día y el mes de nacimiento.'
    for (const field of fields) {
      const key = field.name.startsWith('birth') ? 'birth' : field.name
      const message = errors[key]
      get('#' + key + '-error').textContent = message ?? ''
      if (message) field.setAttribute('aria-invalid', 'true')
      else field.removeAttribute('aria-invalid')
    }
    const first = Object.keys(errors)[0]
    if (first && focus) input(first === 'birth' ? 'birthDay' : first).focus()
    return !first
  }

  function refreshFicha() {
    const category = categoryForBirthDate(birth(), input('female').value === 'si')
    const label = get('[data-ficha-category]')
    label.hidden = !category
    label.textContent = category ? category.label + ' ' : ''
    const schedule = get('[data-ficha-schedule]')
    const details = category
      ? `${category.team.days}, ${category.team.time} · ${category.team.field} · ${money(category.fee * 100)} al año${category.label === category.name ? ' (horario de referencia del equipo A)' : ''}.`
      : birth() ? 'No hay categoría para esa fecha. Consulta con secretaría.' : 'Introduce la fecha para consultar la categoría.'
    if (schedule.textContent !== details) schedule.textContent = details
    const data = values()
    const player = [data.name.trim(), data.surname.trim()].filter(Boolean).join(' ')
    const identity = [data.birth.split('-').reverse().join('/'), data.school.trim(), data.size && `Talla ${data.size}`].filter(Boolean).join(' · ')
    get('[data-ficha-player]').textContent = player
    get('[data-ficha-player]').hidden = !player
    get('[data-ficha-identity]').textContent = identity
    get('[data-ficha-identity]').hidden = !identity
    const fees = get('[data-ficha-fees]')
    fees.hidden = !category
    if (category) {
      const fee = calculateFee(category.fee, data.member === 'no', data.sibling === 'si', 1)
      const amounts = [fee.base, fee.enrollment, -fee.discount || 0, fee.total]
      fees.querySelectorAll('dd').forEach((cell, index) => { cell.textContent = index === 1 && !data.member ? 'Pendiente' : money(amounts[index]) })
    }
    get('[data-year-prefill]').hidden = !partialYear
    note.textContent = partialYear ? `Año seleccionado: ${input('birthYear').value}. Cambia el día y el mes sugeridos o confirma la fecha si nació el 1 de enero.` : ''
  }

  function summary() {
    const data = values()
    const category = categoryForBirthDate(data.birth, data.female === 'si')!
    const fee = calculateFee(category.fee, data.member === 'no', data.sibling === 'si', data.instalments === '3' ? 3 : 1)
    const code = registrationCode([data.name, data.surname, data.birth, data.email].map(value => value.trim()).join('|'))
    const player = `${data.name.trim()} ${data.surname.trim()} · ${category.label}`
    const breakdown = [
      ['Cuota anual', money(fee.base)], ['Matrícula', money(fee.enrollment)],
      ['Descuento por hermanos', money(-fee.discount || 0)], ['Total', money(fee.total)],
    ]
    const payments = fee.instalments.map((payment, index) => `Plazo ${index + 1} · ${money(payment)}`)
    return { code, player, breakdown, payments }
  }

  function refreshSummary() {
    const { code, player, breakdown, payments } = summary()
    get('[data-code]').textContent = code
    get('[data-player]').textContent = player
    for (const [index, key] of ['base', 'enrollment', 'discount', 'total'].entries()) {
      get(`[data-${key}]`).textContent = breakdown[index][1]
    }
    get('[data-payments]').replaceChildren(...payments.map(payment => {
      const item = document.createElement('li')
      item.textContent = payment
      return item
    }))
  }

  function render(focus = false) {
    submitted = false
    for (const field of fields) {
      field.removeAttribute('aria-invalid')
      get('#' + (field.name.startsWith('birth') ? 'birth' : field.name) + '-error').textContent = ''
    }
    for (const panel of panels) panel.hidden = Number(panel.dataset.step) !== step
    form.querySelectorAll('[data-progress]').forEach(item => {
      const number = Number((item as HTMLElement).dataset.progress)
      item.classList.toggle('complete', number < step)
      if (number === step) item.setAttribute('aria-current', 'step')
      else item.removeAttribute('aria-current')
    })
    get('[data-back]').hidden = step === 1
    get('[data-next]').hidden = step === 4
    get('[data-next]').textContent = step === 3 ? 'Ver resumen' : 'Continuar'
    refreshFicha()
    if (step === 4) refreshSummary()
    form.hidden = false
    if (focus) get('#step-' + step).focus()
  }

  form.addEventListener('input', event => {
    if (birthParts.some(part => part === event.target)) partialYear = false
    refreshFicha()
    if (step === 4) refreshSummary()
    if (submitted) showErrors()
    save()
  }, { signal })
  get('[data-confirm-date]').addEventListener('click', () => {
    partialYear = false
    refreshFicha()
    if (submitted) showErrors()
    save()
    input('birthDay').focus()
  }, { signal })
  form.addEventListener('submit', event => {
    event.preventDefault()
    if (step === 4) return
    submitted = true
    if (!showErrors(true)) return
    step++
    save()
    render(true)
  }, { signal })
  get('[data-back]').addEventListener('click', () => {
    step--
    save()
    render(true)
  }, { signal })
  get('[data-reset]').addEventListener('click', () => {
    form.reset()
    partialYear = false
    step = 1
    try { localStorage.removeItem(storageKey) } catch {}
    render(true)
  }, { signal })
  get('[data-download]').addEventListener('click', () => {
    const { code, player, breakdown, payments } = summary()
    const layers = Array.from({ length: 4 }, (_, index) => `<div style="transform:translateZ(${index}px)">${crest}</div>`).join('')
    const html = `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex, nofollow">
<title>Justificante ${code}</title><style>body{font:16px system-ui;color:#0f3a2b;max-width:42rem;margin:2rem auto;padding:0 1rem}header{border-bottom:1px solid;display:flex;align-items:center;justify-content:space-between;gap:1rem}dl div{display:flex;justify-content:space-between;gap:1rem;border-bottom:1px solid #bfc8c2;padding:.5rem 0}dd{margin:0}.crest{width:85px;height:100px;position:relative;transform-style:preserve-3d}.crest div{position:absolute;inset:0}.crest svg{width:100%;height:100%}@media(hover:hover) and (prefers-reduced-motion:no-preference){.crest{transition:transform .45s}.crest:hover{transform:perspective(400px) rotateY(-12deg) rotateX(6deg)}}</style>
<header><div><p>UD Los Almendros · Temporada 2026/27</p><h1>Justificante de preinscripción</h1></div><div class="crest" aria-hidden="true">${layers}</div></header>
<p>Demostración: no se envía ningún dato</p><p><strong>${code}</strong></p><p>${escape(player)}</p>
<dl>${breakdown.map(([label, amount]) => `<div><dt>${label}</dt><dd>${amount}</dd></div>`).join('')}</dl>
<ol>${payments.map(payment => `<li>${payment}</li>`).join('')}</ol></html>`
    const objectUrl = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = code + '.html'
    link.click()
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
  }, { signal })
  render()
}
