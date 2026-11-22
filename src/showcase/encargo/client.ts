import { APPS_SCRIPT_URL, STUDIO_EMAIL } from './config'
import { artifacts, brandColors, isHex, motion, selectedPair, selectedPalette, type Answers } from './data'
import { buildJson, buildPrompt, filenames } from './lib/prompt'
import { readLogo } from './lib/logo'
import { paint, surface } from './lib/paint'
import type { createScene } from './lib/scene'

const storageKey = 'encargo:v1'
const root = document.querySelector<HTMLElement>('[data-encargo]')!
const find = <T extends Element = HTMLElement>(selector: string) => root.querySelector<T>(selector)!
const all = <T extends Element = HTMLElement>(selector: string) => [...root.querySelectorAll<T>(selector)]
const form = find<HTMLFormElement>('.brief')
const sheets = all<HTMLElement>('[data-step]')
const fields = all<HTMLInputElement | HTMLTextAreaElement>('.brief [name]')
const back = find<HTMLButtonElement>('[data-back]')
const next = find<HTMLButtonElement>('[data-next]')
const preview = find('[data-preview]')
const previewToggle = find<HTMLButtonElement>('.preview-toggle')
const desktop = find<HTMLCanvasElement>('[data-desktop]')
const phone = find<HTMLCanvasElement>('[data-phone]')
const flat = find('[data-flat]')
const host = find('[data-scene]')
const reduced = matchMedia('(prefers-reduced-motion: reduce)')
const narrow = matchMedia('(max-width: 800px)')
const resetDialog = find<HTMLDialogElement>('[data-reset-dialog]')
const send = find<HTMLButtonElement>('[data-send]')
const status = find('[data-delivery-status]')
let answers: Answers = {}
let step = 0
let saved: ReturnType<typeof setTimeout>
let displayed: HTMLElement | undefined
let painting = 0
let logoRequest = 0
let scene: ReturnType<typeof createScene> | undefined
let sceneRequest = 0
let webglFailed = false
let lastVisual = ''
let answerRevision = 0
let received = false
let fontLoad: Promise<unknown> | undefined

try {
  const stored = JSON.parse(localStorage.getItem(storageKey) ?? '{}')
  if (stored.answers && typeof stored.answers === 'object') answers = stored.answers
  if (Number.isInteger(stored.step)) step = Math.min(sheets.length - 1, Math.max(0, stored.step))
} catch { /* Storage is optional. */ }

function save() {
  clearTimeout(saved)
  try { localStorage.setItem(storageKey, JSON.stringify({ answers, step })) } catch { /* Storage is optional. */ }
}
function scheduleSave() {
  clearTimeout(saved)
  saved = setTimeout(save, 200)
}
window.addEventListener('pagehide', save)

function restoreInputs() {
  for (const field of fields) {
    const current = answers[field.name as keyof Answers]
    if (field instanceof HTMLInputElement && field.type === 'checkbox') {
      field.checked = Array.isArray(current) && current.includes(field.value)
    } else if (field instanceof HTMLInputElement && field.type === 'radio') {
      field.checked = current === field.value
    } else if (typeof current === 'string') field.value = current
  }
  updateBranches()
}

function updateBranches() {
  find('[data-other]').hidden = answers.sector !== 'Otro'
  find('[data-existing]').hidden = answers.brand !== 'Existente'
  find('[data-personality]').hidden = answers.brand !== 'A diseñar'
  const brand = brandColors(answers)
  const brandSample = find('[data-brand-palette]')
  brandSample.hidden = brand.length === 0
  if (brandSample.hidden && answers.palette === 'Tu paleta') {
    delete answers.palette
    find<HTMLInputElement>('[value="Tu paleta"]').checked = false
  }
  if (brand.length) {
    const [, ...colors] = selectedPalette({ ...answers, palette: 'Tu paleta' })
    brandSample.querySelectorAll<HTMLElement>('i').forEach((swatch, i) => swatch.style.setProperty('--sample', colors[i]))
  }
  for (let i = 1; i <= 3; i++) {
    const field = find<HTMLInputElement>(`[name="brandColor${i}"]`)
    const extracted = answers.logo?.colors[i - 1]
    const candidate = isHex(field.value) ? field.value : extracted
    field.placeholder = extracted ?? '#000000'
    find<HTMLInputElement>(`[data-picker="${i}"]`).value = isHex(candidate) ? candidate : '#000000'
  }
  const count = answers.artifacts?.length ?? 0
  all<HTMLInputElement>('[name="artifacts"]').forEach(input => { input.disabled = count >= 2 && !input.checked })
  find('[data-artifact-count]').textContent = `${count} de 2 seleccionados`
  const motionLabel = motion[Number(answers.motion ?? 1)] ?? motion[1]
  find('[data-motion]').textContent = motionLabel
  find<HTMLInputElement>('[name="motion"]').setAttribute('aria-valuetext', motionLabel)
  if (answers.logo) {
    const { name, width, height } = answers.logo
    find('[data-logo-status]').textContent = `${name} · ${width} × ${height} px`
  }
}

function loadFonts() {
  fontLoad ??= Promise.all([
    import('@fontsource-variable/fraunces/wght.css'),
    import('@fontsource-variable/manrope/wght.css'),
    import('@fontsource-variable/archivo/wght.css'),
    import('@fontsource-variable/bricolage-grotesque/wght.css'),
    import('@fontsource/bodoni-moda/latin-400.css'),
    import('@fontsource/instrument-serif/latin-400.css'),
  ]).catch(() => {})
  return fontLoad
}

function renderPreview(force = false) {
  const title = answers.business?.trim() || 'Tu negocio'
  const [, heading, body, weight, bodyWeight] = selectedPair(answers)
  const [, ...colors] = selectedPalette(answers)
  const visual = JSON.stringify([title, ...colors, heading, answers.mode, answers.texture, answers.goal,
    answers.sector, answers.otherSector, answers.city, answers.offer, answers.pages, answers.artifacts, answers.scale, answers.motion, answers.tone, answers.address])
  if (!force && lastVisual === visual) return
  lastVisual = visual
  all('[data-business-name]').forEach(el => { el.textContent = title })
  find('[data-preview-name]').textContent = title
  find('[data-preview-material]').textContent = `${answers.texture ?? 'Papel'} · ${answers.mode ?? 'Claro'}`
  flat.setAttribute('role', 'img')
  const artifactNames = artifacts.filter(([id]) => answers.artifacts?.includes(id)).map(([, name]) => name)
  const description = [title, selectedPalette(answers)[0], selectedPair(answers)[0], answers.texture, answers.mode,
    answers.goal, answers.pages?.join(', '), artifactNames.join(', ')].filter(Boolean).join(' · ')
  flat.setAttribute('aria-label', `Maqueta de ${description}`)
  preview.setAttribute('aria-label', `Maqueta viva de ${description}`)
  const ticket = ++painting
  const redraw = () => {
    scene?.beforePaint()
    paint(desktop, answers, false)
    paint(phone, answers, true)
    scene?.afterPaint(Number(answers.motion ?? 1))
  }
  redraw()
  const fontSpecs = [`${weight} 40px "${heading}"`, `${bodyWeight} 20px "${body}"`]
  const ready = answers.pair && heading !== 'Newsreader Variable' ? loadFonts() : Promise.resolve()
  void ready.then(async () => {
    const pending = fontSpecs.filter(spec => !document.fonts.check(spec, title))
    if (!pending.length) return
    await Promise.allSettled(pending.map(spec => document.fonts.load(spec, title)))
    if (ticket === painting) redraw()
  })
}

async function configureScene() {
  const request = ++sceneRequest
  if (reduced.matches || (narrow.matches && !preview.hasAttribute('data-expanded'))) {
    scene?.stop()
    scene = undefined
    host.hidden = true
    flat.style.visibility = ''
    return
  }
  if (scene || webglFailed) return
  const fallback = () => {
    scene = undefined
    webglFailed = true
    host.hidden = true
    host.replaceChildren()
    flat.style.visibility = ''
  }
  try {
    const { createScene } = await import('./lib/scene')
    if (request !== sceneRequest) return
    host.hidden = false
    scene = createScene(host, desktop, phone, fallback)
    scene.beforePaint()
    scene.afterPaint(Number(answers.motion ?? 1))
    flat.style.visibility = 'hidden'
  } catch { fallback() }
}

function expandPreview(expanded: boolean) {
  preview.toggleAttribute('data-expanded', expanded)
  previewToggle.setAttribute('aria-expanded', String(expanded))
  previewToggle.textContent = expanded ? 'Plegar maqueta' : 'Ampliar maqueta'
  void configureScene()
}
previewToggle.addEventListener('click', () => expandPreview(!preview.hasAttribute('data-expanded')))
reduced.addEventListener('change', () => { void configureScene() })
narrow.addEventListener('change', () => { void configureScene() })

function mailto(markdown: string) {
  const name = answers.business?.trim() || 'Nuevo encargo'
  const subject = encodeURIComponent(`Encargo web · ${name}`)
  const summary = [`Negocio: ${name}`, answers.goal ? `Objetivo: ${answers.goal}` : '', answers.email ? `Contacto: ${answers.email}` : ''].filter(Boolean).join('\n')
  const prefix = `mailto:${STUDIO_EMAIL}?subject=${subject}&body=`
  const inline = prefix + encodeURIComponent(`Hola,\n\n${summary}\n\n${markdown}`)
  return inline.length <= 1800 ? inline : prefix + encodeURIComponent(`Hola,\n\n${summary}\n\nAdjunto el brief en el archivo .md descargado.`)
}

function renderFinal() {
  const markdown = buildPrompt(answers)
  find('[data-prompt]').textContent = markdown
  find('[data-json]').textContent = buildJson(answers)
  find<HTMLAnchorElement>('[data-email]').href = mailto(markdown)
  find('[data-final-heading]').textContent = received ? 'Recibido' : 'Tu encargo'
  find('[data-final-intro]').textContent = received ? 'El brief y la ficha de respuestas han llegado al estudio.' : 'Revisa la maqueta y el brief antes de compartirlo con el estudio.'
  sheets[6].toggleAttribute('data-received', received)
  const specs = [
    ['Negocio', answers.business], ['Objetivo', answers.goal],
    ['Paleta', selectedPalette(answers)[0]], ['Materia y luz', `${answers.texture ?? 'Papel'} · ${answers.mode ?? 'Claro'}`],
    ['Tipografía', selectedPair(answers)[0]], ['Páginas', answers.pages?.join(', ')],
    ['Artefactos', artifacts.filter(([id]) => answers.artifacts?.includes(id)).map(([, name]) => name).join(', ')],
  ]
  find('[data-specs]').replaceChildren(...specs.flatMap(([term, definition]) => {
    const dt = document.createElement('dt')
    const dd = document.createElement('dd')
    dt.textContent = term ?? ''
    dd.textContent = definition || 'Sin indicar'
    return [dt, dd]
  }))
}

function showStep(focus = false, direction = 1) {
  const current = sheets[step]
  const old = displayed
  const animate = focus && old && old !== current && !reduced.matches
  for (const sheet of sheets) {
    sheet.getAnimations().forEach(animation => animation.cancel())
    sheet.hidden = sheet !== current
    sheet.inert = false
    sheet.classList.remove('departing')
    sheet.removeAttribute('aria-hidden')
  }
  displayed = current
  find('[data-progress]').textContent = step === 6 ? 'Ficha final / 06' : `Lámina 0${step + 1} / 06`
  all('.ticks i').forEach((tick, i) => {
    tick.toggleAttribute('data-current', i === step)
    tick.toggleAttribute('data-done', i < step)
  })
  back.disabled = step === 0
  next.hidden = step === 6
  next.textContent = step === 5 ? 'Ver mi encargo' : 'Siguiente'
  if (step === 3) void loadFonts()
  if (step === 6) {
    renderFinal()
    if (narrow.matches) expandPreview(true)
  }
  if (focus) {
    window.scrollTo({ top: 0, behavior: 'instant' })
    current.querySelector<HTMLElement>('h1,h2')?.focus({ preventScroll: true })
  }
  if (animate) {
    old.hidden = false
    old.inert = true
    old.setAttribute('aria-hidden', 'true')
    old.classList.add('departing')
    const duration = 810
    const easing = 'cubic-bezier(.22,.65,.24,1)'
    const leaving = old.animate([
      { opacity: 1, transform: 'none', offset: 0 },
      { opacity: .68, transform: `translateY(-17px) rotateX(13deg) rotateY(${direction * -9}deg)`, offset: .33 },
      { opacity: 0, transform: `translate3d(0,12px,-85px) rotateY(${direction * -14}deg) scale(.97)`, offset: 1 },
    ], { duration, easing })
    current.animate([{ opacity: 0, transform: `translateY(14px) rotateX(-8deg) rotateY(${direction * 6}deg)` },
      { opacity: 1, transform: 'none' }], { duration, easing })
    void leaving.finished.then(() => {
      old.hidden = true
      old.classList.remove('departing')
    }).catch(() => {})
  }
}

function advance() {
  if (step === 6) return
  for (const input of sheets[step].querySelectorAll<HTMLInputElement>('input[required]')) {
    input.setCustomValidity(input.value.trim() ? '' : 'Completa este campo para continuar.')
    if (!input.reportValidity()) return
  }
  step++
  save()
  showStep(true)
}

form.addEventListener('submit', event => { event.preventDefault(); advance() })
form.addEventListener('keydown', event => {
  const field = event.target
  if (event.key === 'Enter' && field instanceof HTMLInputElement && ['checkbox', 'radio'].includes(field.type)) {
    event.preventDefault()
    field.click()
  }
})
form.addEventListener('input', event => {
  const field = event.target
  if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) return
  if (field instanceof HTMLInputElement) field.setCustomValidity('')
  if (field.dataset.picker) {
    const hex = find<HTMLInputElement>(`[name="brandColor${field.dataset.picker}"]`)
    hex.value = field.value
    hex.dispatchEvent(new Event('input', { bubbles: true }))
    return
  }
  if (!field.name) return
  const values = answers as Record<string, unknown>
  values[field.name] = field instanceof HTMLInputElement && field.type === 'checkbox'
    ? all<HTMLInputElement>(`input[name="${field.name}"]:checked`).map(input => input.value)
    : field.value
  answerRevision++
  received = false
  status.textContent = ''
  updateBranches()
  renderPreview()
  scheduleSave()
})
find<HTMLInputElement>('[data-logo]').addEventListener('change', async event => {
  const input = event.currentTarget as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const ticket = ++logoRequest
  try {
    const logo = await readLogo(file)
    if (ticket !== logoRequest) return
    answers.logo = logo
    answerRevision++
    received = false
    updateBranches()
    renderPreview()
    scheduleSave()
  } catch {
    if (ticket === logoRequest) find('[data-logo-status]').textContent = 'No se pudo leer el archivo. Prueba con otra imagen.'
  }
})
back.addEventListener('click', () => { step--; save(); showStep(true, -1) })
next.addEventListener('click', advance)
find('[data-reset]').addEventListener('click', () => { resetDialog.returnValue = ''; resetDialog.showModal() })
resetDialog.addEventListener('close', () => {
  if (resetDialog.returnValue !== 'reset') return
  ++logoRequest
  ++answerRevision
  form.reset()
  answers = {}
  step = 0
  received = false
  send.disabled = false
  status.textContent = ''
  find('[data-logo-status]').textContent = ''
  all<HTMLDetailsElement>('details').forEach(details => { details.open = false })
  restoreInputs()
  save()
  expandPreview(false)
  renderPreview()
  showStep(true)
})

function download(markdown: string) {
  const href = URL.createObjectURL(new Blob([markdown], { type: 'text/markdown;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = href
  link.download = filenames(answers.business).markdown
  link.click()
  setTimeout(() => URL.revokeObjectURL(href), 1000)
}
find('[data-download]').addEventListener('click', () => download(buildPrompt(answers)))
find('[data-copy]').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(buildPrompt(answers))
    status.textContent = 'Brief copiado.'
  } catch {
    const range = document.createRange()
    range.selectNodeContents(find('[data-prompt]'))
    const selection = window.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(range)
    find('[data-prompt]').focus()
    status.textContent = 'Brief seleccionado. Puedes copiarlo con el teclado.'
  }
})
send.addEventListener('click', async () => {
  const markdown = buildPrompt(answers)
  const filename = filenames(answers.business).base
  const revision = answerRevision
  if (APPS_SCRIPT_URL) {
    send.disabled = true
    status.textContent = 'Enviando el encargo…'
    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ filename, markdown, json: buildJson(answers) }),
        signal: AbortSignal.timeout(15000),
      })
      if (!response.ok || (await response.json()).ok !== true) throw new Error('Respuesta de envío no válida')
      if (revision !== answerRevision) return
      received = true
      renderFinal()
      status.textContent = 'Encargo recibido.'
      return
    } catch {
      if (revision !== answerRevision) return
    } finally {
      send.disabled = false
    }
  }
  download(markdown)
  status.textContent = 'Brief descargado. Puedes adjuntarlo al escribir al estudio.'
})

const demos = new Map<HTMLElement, { visible: boolean; engaged: boolean }>()
const observer = new IntersectionObserver(entries => {
  for (const entry of entries) demos.get(entry.target as HTMLElement)!.visible = entry.isIntersecting
}, { threshold: .6 })
all('.artifact').forEach(demo => {
  const state = { visible: false, engaged: false }
  demos.set(demo, state)
  observer.observe(demo)
  demo.addEventListener('pointerenter', event => {
    state.engaged = event.pointerType !== 'touch' && matchMedia('(hover: hover)').matches
    if (state.engaged && !reduced.matches) demo.setAttribute('data-live', '')
  })
  demo.addEventListener('pointerleave', () => { state.engaged = false; demo.removeAttribute('data-live') })
  demo.addEventListener('focusin', () => {
    state.engaged = true
    if (!reduced.matches) demo.setAttribute('data-live', '')
  })
  demo.addEventListener('focusout', () => { state.engaged = false; demo.removeAttribute('data-live') })
})
let phase = false
setInterval(() => {
  phase = !phase
  for (const [demo, state] of demos) {
    demo.toggleAttribute('data-live', !reduced.matches && state.visible && (state.engaged || phase))
  }
}, 2200)
reduced.addEventListener('change', () => {
  if (reduced.matches) for (const demo of demos.keys()) demo.removeAttribute('data-live')
})

all<HTMLCanvasElement>('[data-texture]').forEach(canvas => {
  const context = canvas.getContext('2d')!
  context.fillStyle = '#d1c6b3'
  context.fillRect(0, 0, canvas.width, canvas.height)
  surface(context, Number(canvas.dataset.texture), 0, 0, canvas.width, canvas.height)
})
const grain = document.createElement('canvas')
grain.width = grain.height = 160
const grainContext = grain.getContext('2d')!
grainContext.globalAlpha = .48
surface(grainContext, 0, 0, 0, 160, 160)
root.style.setProperty('--grain', `url("${grain.toDataURL()}")`)
restoreInputs()
renderPreview()
showStep()
void configureScene()
