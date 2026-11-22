import { demo, disciplines, sectors, type Sector } from '../data/company'
import { estimate, fileSize, number, reference, validateStep } from '../lib/offer'
import { documentRows, downloadDocument } from './documents'

const storageKey = 'ramal-oferta-v1'
interface Attachment { name: string; size: number }

export function mountOffer(form: HTMLFormElement, signal: AbortSignal) {
  const get = <T extends HTMLElement = HTMLElement>(selector: string) => form.querySelector<T>(selector)!
  const fields = [...form.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input[name], select[name]')]
  const values = () => Object.fromEntries(fields.filter(field => field.name !== 'disciplines').map(field => [field.name, field.value.trim()]))
  const selected = () => fields.filter(field => field.name === 'disciplines' && (field as HTMLInputElement).checked).map(field => field.value)
  let step = 1
  let attempted = false
  let files: Attachment[] = []

  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify({ step, values: values(), selected: selected(), files })) } catch {}
  }

  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? 'null')
    if (saved && saved.values && typeof saved.values === 'object') {
      for (const field of fields) {
        if (field instanceof HTMLInputElement && field.type === 'checkbox') {
          field.checked = Array.isArray(saved.selected) && saved.selected.includes(field.value)
        } else if (Object.hasOwn(saved.values, field.name) && typeof saved.values[field.name] === 'string') {
          field.value = saved.values[field.name]
        }
      }
      if (Array.isArray(saved.files)) files = saved.files.filter((entry: Attachment | null) =>
        entry && typeof entry.name === 'string' && Number.isSafeInteger(entry.size) && entry.size >= 0,
      ).map(({ name, size }: Attachment) => ({ name, size }))
      if ([2, 3, 4].includes(saved.step)) {
        while (step < saved.step && !Object.keys(validateStep(step, values(), selected())).length) step++
      }
    }
  } catch {}

  function showErrors(focus = false) {
    const errors = validateStep(step, values(), selected())
    for (const field of fields) {
      if (errors[field.name]) field.setAttribute('aria-invalid', 'true')
      else field.removeAttribute('aria-invalid')
    }
    form.querySelectorAll<HTMLElement>('[data-error]').forEach(node => {
      node.textContent = errors[node.dataset.error!] ?? ''
    })
    const first = Object.keys(errors)[0]
    if (first && focus) fields.find(field => field.name === first)?.focus()
    return !first
  }

  function updateEstimate() {
    const { area, sector } = values()
    const result = estimate(Number(area), sector, selected())
    const text = result
      ? `${result.minWeeks}–${result.maxWeeks} semanas · ${result.crew} técnicos`
      : 'Indica el tipo de obra, la superficie y las disciplinas para estimar el plazo y el equipo.'
    const output = get('[data-estimate]')
    if (output.textContent !== text) output.textContent = text
    const schedule = get('[data-schedule]')
    schedule.hidden = !result
    if (result) {
      get('[data-min-week]').textContent = String(result.minWeeks).padStart(2, '0')
      get('[data-max-week]').textContent = String(result.maxWeeks).padStart(2, '0')
      schedule.style.setProperty('--minimum', String(result.minWeeks / result.maxWeeks))
    }
  }

  function updateFiles() {
    get('[data-no-files]').hidden = files.length > 0
    get('[data-file-list]').replaceChildren(...files.map(({ name, size }, index) => {
      const item = document.createElement('li')
      const label = document.createElement('span')
      label.textContent = `${name} · ${fileSize(size)}`
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'text-button'
      button.textContent = 'Quitar'
      button.setAttribute('aria-label', 'Quitar ' + name)
      button.dataset.removeFile = String(index)
      item.append(label, button)
      return item
    }))
  }

  function summary() {
    const data = values()
    const selection = selected()
    const rows: [string, string][] = [
      ['Tipo de obra', sectors[data.sector as Sector]], ['Ubicación', data.location], ['Superficie', number(Number(data.area)) + ' m²'],
      ['Fase', data.phase], ['Disciplinas', disciplines.filter(({ id }) => selection.includes(id)).map(({ name }) => name).join(', ')],
      ['Documentación', files.map(file => `${file.name} (${fileSize(file.size)})`).join('; ') || 'Sin adjuntos'],
      ['Empresa', data.company], ['CIF o NIF', data.taxId], ['Persona de contacto', data.person], ['Cargo', data.role],
      ['Correo electrónico', data.email], ['Teléfono', data.phone], ['Plazo de respuesta', data.deadline],
    ]
    const code = reference(JSON.stringify({ data, selection, files }))
    return { code, rows }
  }

  function render(focus = false) {
    attempted = false
    form.querySelectorAll<HTMLElement>('[data-step]').forEach(panel => { panel.hidden = Number(panel.dataset.step) !== step })
    form.querySelectorAll<HTMLElement>('[data-progress]').forEach(item => {
      const position = Number(item.dataset.progress)
      item.classList.toggle('complete', position < step)
      if (position === step) item.setAttribute('aria-current', 'step')
      else item.removeAttribute('aria-current')
    })
    for (const field of fields) field.removeAttribute('aria-invalid')
    form.querySelectorAll('[data-error]').forEach(error => { error.textContent = '' })
    get('[data-back]').hidden = step === 1
    const next = get('[data-next]')
    next.hidden = step === 4
    next.textContent = step === 3 ? 'Ver resumen' : 'Continuar'
    updateEstimate()
    updateFiles()
    if (step === 4) {
      const { code, rows } = summary()
      get('[data-reference]').textContent = code
      get('[data-summary]').replaceChildren(...rows.map(([label, value]) => {
        const item = document.createElement('div')
        const term = document.createElement('dt')
        const detail = document.createElement('dd')
        term.textContent = label
        detail.textContent = value
        item.append(term, detail)
        return item
      }))
    }
    form.hidden = false
    if (focus) get('#paso-' + step).focus()
  }

  form.addEventListener('input', event => {
    if (!(event.target instanceof HTMLElement) || !fields.some(field => field === event.target)) return
    updateEstimate()
    if (attempted) showErrors()
    save()
  }, { signal })
  const attachments = get<HTMLInputElement>('[data-files]')
  attachments.addEventListener('change', () => {
    for (const { name, size } of Array.from(attachments.files ?? [])) {
      if (!files.some(file => file.name === name && file.size === size)) files.push({ name, size })
    }
    attachments.value = ''
    updateFiles()
    save()
  }, { signal })
  get('[data-file-list]').addEventListener('click', event => {
    if (!(event.target instanceof HTMLButtonElement) || event.target.dataset.removeFile === undefined) return
    files.splice(Number(event.target.dataset.removeFile), 1)
    updateFiles()
    save()
    attachments.focus()
  }, { signal })
  form.addEventListener('submit', event => {
    event.preventDefault()
    if (step === 4) return
    attempted = true
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
    files = []
    step = 1
    try { localStorage.removeItem(storageKey) } catch {}
    render(true)
  }, { signal })
  get('[data-receipt]').addEventListener('click', () => {
    const { code, rows } = summary()
    downloadDocument(code, 'Justificante ' + code, `<header><small>RAMAL INSTALACIONES TÉCNICAS</small><h1>Justificante de solicitud</h1><strong>${code}</strong></header><p>${demo}</p>${documentRows(rows)}`)
  }, { signal })
  render()
}
