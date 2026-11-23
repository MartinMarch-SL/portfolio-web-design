import crest from '../../../../public/examples/las-moreras/img/escudo.svg?raw'
import { schedules } from '../data/season'
import { calculateFee, categoryForBirthDate, isDate, money, registrationCode, validateStep, type Days, type Fields } from '../lib/registration'
import { downloadFile } from './download'

const storageKey = 'las-moreras-preinscripcion-v1'
const escape = (value: string) => value.replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]!))
type Row = [string, string]
const ledger = (rows: Row[]) => rows.map(([label, value]) => `<div><dt>${escape(label)}</dt><dd>${escape(value)}</dd></div>`).join('')

export function mountRegistration(form: HTMLFormElement, signal: AbortSignal) {
  const get = <T extends HTMLElement = HTMLElement>(selector: string) => form.querySelector<T>(selector)!
  const fields = [...form.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input[name], select[name]')]
  const birthParts = ['birthYear', 'birthMonth', 'birthDay'].map(name => fields.find(field => field.name === name)!)
  const panels = [...form.querySelectorAll<HTMLElement>('[data-step]')]
  let step = 1
  let attempted = false
  const values = (): Fields => ({
    ...Object.fromEntries(fields.map(field => [field.name, field instanceof HTMLInputElement && field.type === 'checkbox' && !field.checked ? '' : field.value])),
    birth: birthParts.every(field => field.value) ? birthParts.map(field => field.value).join('-') : '',
  })
  const save = () => {
    try { localStorage.setItem(storageKey, JSON.stringify({ step, values: values() })) } catch {}
  }
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? 'null')
    if (saved?.values && typeof saved.values === 'object') {
      for (const field of fields) {
        const value = saved.values[field.name]
        if (typeof value !== 'string') continue
        if (field instanceof HTMLInputElement && field.type === 'checkbox') field.checked = value === 'si'
        else field.value = value
      }
      while (step < Math.min(4, saved.step) && !Object.keys(validateStep(step, values())).length) step++
    }
  } catch {}

  const year = new URL(location.href).searchParams.get('anio')
  if (year && categoryForBirthDate(year + '-01-01')) {
    if (birthParts[0].value !== year) birthParts.forEach((field, index) => { field.value = index === 0 ? year : '' })
    step = 1
    history.replaceState(history.state, '', location.pathname + location.hash)
    save()
  }

  function quote(data: Fields) {
    const category = categoryForBirthDate(data.birth)
    const days = Number(data.days) as Days
    if (!category || ![1, 2, 3].includes(days)) return
    const quarterly = data.period === 'quarterly'
    const fee = calculateFee(category, days, /^\d{3,6}$/.test(data.member?.trim()), data.sibling === 'si', quarterly ? 'quarterly' : 'monthly')
    const rows: Row[] = [
      [quarterly ? 'Cuota de tres meses' : 'Cuota mensual', money(fee.base)],
      ['Familia socia · 15 %', fee.memberDiscount ? money(-fee.memberDiscount) : '—'],
      ['Segundo hermano · 10 %', fee.siblingDiscount ? money(-fee.siblingDiscount) : '—'],
      ['Pago trimestral · 5 %', fee.quarterlyDiscount ? money(-fee.quarterlyDiscount) : '—'],
      ['Cuota con descuentos', money(fee.tuition)], ['Matrícula', money(fee.enrollment)],
    ]
    return { category, days, quarterly, fee, rows, schedule: `${schedules[days - 1]} · ${category.time}` }
  }

  function summary(data: Fields) {
    const details = quote(data)!
    const code = registrationCode([data.birth, data.name, data.surname, data.guardianId].join('/'))
    const rows: Row[] = [
      ['Alumno o alumna', data.name + ' ' + data.surname], ['Fecha de nacimiento', data.birth.split('-').reverse().join('/')],
      ['Grupo', details.category.name + ' · ' + data.level], ['Horario', details.schedule],
      ['Mano · experiencia · polo', [data.hand, data.experience, data.size].join(' · ')],
      ['Tutor o tutora', data.guardian], ['Contacto', data.phone + ' · ' + data.email],
      ['Autorización de imagen', data.image], ...details.rows, ['Primer pago', money(details.fee.total)],
    ]
    if (data.level === 'Competición') rows.splice(3, 0, ['Acceso', 'Pendiente de prueba de nivel'])
    return { code, rows }
  }

  function render() {
    const data = values()
    const details = quote(data)
    panels.forEach((panel, index) => { panel.hidden = index + 1 !== step })
    form.querySelectorAll('[data-step-index]').forEach((item, index) => {
      if (index + 1 === step) item.setAttribute('aria-current', 'step')
      else item.removeAttribute('aria-current')
    })
    get('[data-back]').hidden = step === 1
    get('[data-next]').hidden = step === 4
    get('[data-next]').textContent = step === 3 ? 'Ver resumen' : 'Continuar'
    get('[data-trial]').hidden = data.level !== 'Competición'
    get('[data-adults]').hidden = !isDate(data.birth) || Boolean(details)
    get('[data-group-preview]').textContent = details
      ? `${details.category.name} · ${details.schedule} · ${money(details.category.fees[details.days - 1] * 100)} al mes antes de descuentos`
      : 'Indica una fecha de la escuela infantil para consultar el grupo.'
    get('[data-ficha-player]').textContent = [data.name, data.surname].filter(Boolean).join(' ') || 'Temporada 2026/27'
    get('[data-ficha-category]').textContent = details ? details.category.name + ' · ' + details.schedule : 'Grupo por determinar'
    get('[data-ficha-fees]').innerHTML = details ? ledger(details.rows) : ''
    get('[data-ficha-period]').textContent = details?.quarterly ? 'Primer trimestre' : 'Primer mes'
    get('[data-ficha-total]').textContent = details ? money(details.fee.total) : '—'
    if (step === 4) {
      const result = summary(data)
      get('[data-code]').textContent = result.code
      get('[data-registration-summary]').innerHTML = ledger(result.rows)
    }
  }

  function showErrors(focus = false) {
    const errors = attempted ? validateStep(step, values()) : {}
    for (const node of form.querySelectorAll<HTMLElement>('[data-error]')) {
      const name = node.dataset.error!
      node.textContent = errors[name] ?? ''
      node.hidden = !errors[name]
      const inputs = name === 'birth' ? birthParts : fields.filter(field => field.name === name)
      for (const field of inputs) {
        if (errors[name]) field.setAttribute('aria-invalid', 'true')
        else field.removeAttribute('aria-invalid')
      }
    }
    if (focus) panels[step - 1].querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
    return Object.keys(errors).length > 0
  }

  function changeStep(next: number) {
    step = next
    attempted = false
    render()
    showErrors()
    save()
    panels[step - 1].querySelector('h2')!.focus()
  }
  form.addEventListener('input', () => { render(); showErrors(); save() }, { signal })
  form.addEventListener('submit', event => {
    event.preventDefault()
    if (step >= 4) return
    attempted = true
    if (!showErrors(true)) changeStep(step + 1)
  }, { signal })
  get('[data-back]').addEventListener('click', () => changeStep(step - 1), { signal })
  get('[data-reset]').addEventListener('click', () => {
    form.reset()
    changeStep(1)
    try { localStorage.removeItem(storageKey) } catch {}
  }, { signal })
  get('[data-receipt]').addEventListener('click', () => {
    const { code, rows } = summary(values())
    downloadFile(code + '.html', 'text/html;charset=utf-8', `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="robots" content="noindex, nofollow"><title>${code} · Justificante</title>
      <style>body{font:16px/1.5 system-ui;color:#17233a;max-width:44rem;margin:2rem auto;padding:1rem}svg{width:72px}dl div{display:grid;grid-template-columns:1fr 1fr;border-top:1px solid #aaa;padding:.35rem}dd{margin:0;overflow-wrap:anywhere}@media print{button{display:none}}</style>
      ${crest}<h1>Justificante de preinscripción</h1><p>CT Las Moreras · Temporada 2026/27</p><p>${code}</p><dl>${ledger(rows)}</dl><p>Demostración: no se envía ningún dato</p><button onclick="window.print()">Imprimir justificante</button></html>`)
  }, { signal })
  render()
  get<HTMLButtonElement>('[data-next]').disabled = false
}
