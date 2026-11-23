import { demo, estimate, optics, reference, types, validate, type Problem } from '../lib/estimate'

const storageKey = 'halda-reto-v1'
const fmt = new Intl.NumberFormat('es', { maximumFractionDigits: 2 })
interface Attachment { name: string; size: number; preview?: string }

const labels: Record<string, string> = {
  type: 'Tipo de problema', sector: 'Sector', rate: 'Cadencia (piezas/min)', defect: 'Defecto mínimo (mm)',
  width: 'Ancho de pieza (mm)', height: 'Alto de pieza (mm)', environment: 'Entorno', samples: 'Notas sobre muestras',
  person: 'Nombre', company: 'Empresa', email: 'Correo', phone: 'Teléfono',
}

export function mountContact(form: HTMLFormElement, signal: AbortSignal) {
  const get = <T extends HTMLElement = HTMLElement>(selector: string) => form.querySelector<T>(selector)!
  const fields = [...form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('[name]')]
  const values = () => Object.fromEntries(fields.map(field => [field.name, field.value.trim()]))
  const metadata = () => attachments.map(({ name, size }) => ({ name, size }))
  let step = 1
  let attempted = false
  let attachments: Attachment[] = []
  let receiptUrl = ''

  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? 'null')
    if (saved?.values && typeof saved.values === 'object') {
      for (const field of fields) {
        if (typeof saved.values[field.name] === 'string') field.value = saved.values[field.name]
      }
      if (Array.isArray(saved.attachments)) {
        attachments = saved.attachments.filter((item: Attachment | null) =>
          item && typeof item.name === 'string' && Number.isSafeInteger(item.size) && item.size >= 0,
        ).map(({ name, size }: Attachment) => ({ name, size }))
      }
      if ([2, 3, 4].includes(saved.step)) {
        while (step < saved.step && !Object.keys(validate(step, values())).length) step++
      }
    }
  } catch {}

  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify({ step, values: values(), attachments: metadata() })) } catch {}
  }

  function showErrors(focus = false) {
    const errors = validate(step, values())
    for (const field of fields) {
      if (errors[field.name]) field.setAttribute('aria-invalid', 'true')
      else field.removeAttribute('aria-invalid')
      get('[data-error="' + field.name + '"]').textContent = errors[field.name] ?? ''
    }
    const first = Object.keys(errors)[0]
    if (first && focus) fields.find(field => field.name === first)?.focus()
    return !first
  }

  const input = get<HTMLInputElement>('[data-attachment]')
  function renderAttachments() {
    get('[data-files]').replaceChildren(...attachments.map(({ name, size, preview }, index) => {
      const item = document.createElement('li')
      const label = document.createElement('span')
      label.textContent = name + ' · ' + fmt.format(size / 1024) + ' kB' + (preview ? '' : ' · Metadatos guardados')
      if (preview) {
        const thumbnail = document.createElement('img')
        thumbnail.src = preview
        thumbnail.alt = 'Vista previa de ' + name
        item.append(thumbnail)
      }
      const remove = document.createElement('button')
      remove.type = 'button'
      remove.className = 'button'
      remove.textContent = 'Quitar'
      remove.setAttribute('aria-label', 'Quitar ' + name)
      remove.dataset.remove = String(index)
      item.append(label, remove)
      return item
    }))
  }

  function summary() {
    const data = values()
    const type = data.type as Problem
    const result = optics(Number(data.width), Number(data.height), Number(data.defect))!
    const complex = Number(data.rate) >= 120 || Number(data.defect) < .1 || type === 'hardware'
    const plan = estimate(type, complex ? 'high' : 'standard')
    const rows = Object.entries(data).filter(([, value]) => value).map(([name, value]) => [labels[name], name === 'type' ? types[type] : value])
    rows.push(
      ['Imágenes', attachments.map(file => file.name).join(', ') || 'Sin adjuntos'],
      ['Prueba de concepto', types[type] + ' · ' + plan.weeks + ' semanas'],
      ['Plan de fases', plan.phases.map(phase => phase.label + ' (' + phase.weeks + ' sem.)').join(' · ')],
      ['Resolución sugerida', result.sensor
        ? fmt.format(result.sensor[0] * result.sensor[1] / 1e6) + ' MP · ' + result.sensor.join(' × ') + ' px'
        : 'Sensor especial o captura en mosaico · mínimo ' + result.pixels.join(' × ') + ' px'],
      ['Campo de visión mínimo', result.fov.map(value => fmt.format(value)).join(' × ') + ' mm'],
      ...(result.sensor ? [['Campo de visión con el sensor sugerido', result.frame.map(value => fmt.format(value)).join(' × ') + ' mm']] : []),
      ['Distancia de trabajo aproximada', result.distance.map(value => fmt.format(value)).join('–') + ' mm · sensor de 11 mm, ópticas de 16–35 mm'],
      ['Criterio de muestreo', '3 píxeles por defecto mínimo y 15 % de margen de encuadre'],
    )
    return { rows, code: reference(JSON.stringify({ data, attachments: metadata() })) }
  }

  function render(focus = false) {
    attempted = false
    form.querySelectorAll<HTMLElement>('[data-step]').forEach(panel => { panel.hidden = Number(panel.dataset.step) !== step })
    form.querySelectorAll<HTMLElement>('[data-progress]').forEach(item => {
      if (Number(item.dataset.progress) === step) item.setAttribute('aria-current', 'step')
      else item.removeAttribute('aria-current')
    })
    for (const field of fields) {
      field.removeAttribute('aria-invalid')
      get('[data-error="' + field.name + '"]').textContent = ''
    }
    get('[data-back]').hidden = step === 1
    const next = get('[data-next]')
    next.hidden = step === 4
    next.textContent = step === 3 ? 'Ver resumen' : 'Continuar'
    if (step === 4) {
      const { rows, code } = summary()
      get('[data-reference]').textContent = code
      get('[data-summary]').replaceChildren(...rows.map(([label, value]) => {
        const row = document.createElement('div')
        const term = document.createElement('dt')
        const detail = document.createElement('dd')
        term.textContent = label
        detail.textContent = value
        row.append(term, detail)
        return row
      }))
    }
    form.hidden = false
    if (focus) get('[data-step="' + step + '"] h2').focus()
  }

  function revoke(file: Attachment) {
    if (file.preview) URL.revokeObjectURL(file.preview)
  }

  form.addEventListener('input', () => {
    if (attempted) showErrors()
    save()
  }, { signal })
  input.addEventListener('change', () => {
    let rejected = false
    for (const file of Array.from(input.files ?? [])) {
      if (!file.type.startsWith('image/')) {
        rejected = true
        continue
      }
      const existing = attachments.find(item => item.name === file.name && item.size === file.size)
      if (existing) {
        revoke(existing)
        existing.preview = URL.createObjectURL(file)
      } else attachments.push({ name: file.name, size: file.size, preview: URL.createObjectURL(file) })
    }
    get('[data-file-status]').textContent = rejected ? 'Solo se admiten archivos de imagen.' : ''
    input.value = ''
    renderAttachments()
    save()
  }, { signal })
  get('[data-files]').addEventListener('click', event => {
    if (!(event.target instanceof HTMLButtonElement) || event.target.dataset.remove === undefined) return
    const [file] = attachments.splice(Number(event.target.dataset.remove), 1)
    revoke(file)
    renderAttachments()
    save()
    input.focus()
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
    attachments.forEach(revoke)
    attachments = []
    step = 1
    try { localStorage.removeItem(storageKey) } catch {}
    get('[data-file-status]').textContent = ''
    renderAttachments()
    render(true)
  }, { signal })
  get('[data-receipt]').addEventListener('click', () => {
    const { code } = summary()
    const documentCopy = document.implementation.createHTMLDocument('Justificante ' + code)
    documentCopy.documentElement.lang = 'es'
    documentCopy.head.innerHTML = '<meta charset="utf-8"><meta name="robots" content="noindex, nofollow"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Justificante ' + code + '</title><style>body{font:16px/1.5 system-ui;color:#181818;max-width:720px;margin:32px auto;padding:0 20px}dt{font-weight:650}dd{margin:0 0 9px}dl div{break-inside:avoid}dd{overflow-wrap:anywhere}@media print{body{margin:0;padding:0}}</style>'
    const heading = documentCopy.createElement('h1')
    heading.textContent = 'HALDA · Justificante ' + code
    const notice = documentCopy.createElement('p')
    notice.textContent = demo
    documentCopy.body.append(heading, notice, get('[data-summary]').cloneNode(true))
    if (receiptUrl) URL.revokeObjectURL(receiptUrl)
    receiptUrl = URL.createObjectURL(new Blob(['<!doctype html>' + documentCopy.documentElement.outerHTML], { type: 'text/html;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = receiptUrl
    link.download = code + '.html'
    link.click()
  }, { signal })
  signal.addEventListener('abort', () => {
    attachments.forEach(revoke)
    if (receiptUrl) URL.revokeObjectURL(receiptUrl)
  }, { once: true })
  renderAttachments()
  render()
}
