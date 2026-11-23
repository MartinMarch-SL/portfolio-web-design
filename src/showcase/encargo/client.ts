import { APPS_SCRIPT_URL, STUDIO_EMAIL } from './config'
import { artifacts, motion, selectedPair, selectedPalette, textFields, type Answers, type PageText } from './data'
import { plataformas, type Tipo } from './data/plataformas'
import { buildJson, buildPrompt, filenames } from './lib/prompt'
import { levels, levelsFor, recommendTipo } from './lib/levels'
import { paint } from './lib/paint'
import type { createScene } from './lib/scene'
import { buildManifest, isHeic, planUpload, prepareFile, type Attachment, type Receipt } from './lib/upload'
import { fileTransaction, openFiles } from './lib/storage'
import { droppedFiles } from './lib/drop'
import { base64, OldDeployment, retryDelivery } from './lib/delivery'

const storageKey = 'encargo:v2'
const root = document.querySelector<HTMLElement>('[data-encargo]')!
const find = <T extends Element = HTMLElement>(selector: string) => root.querySelector<T>(selector)!
const all = <T extends Element = HTMLElement>(selector: string) => [...root.querySelectorAll<T>(selector)]
const form = find<HTMLFormElement>('.brief')
const sheets = all<HTMLElement>('[data-step]')
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
const fallback = find('[data-fallback]')
const fallbackLink = find<HTMLInputElement>('[data-fallback-link]')
const linkOnly = find<HTMLButtonElement>('[data-link-only]')
const query = new URLSearchParams(location.search)
const demo = !APPS_SCRIPT_URL || query.get('demo') === '1'
const forceFlat = query.get('mockup') === 'flat'
const memory = new Map<string, LocalFile>()
const thumbnails = new Map<string, string>()
type Delivery = { id: string; name: string; demo: boolean; created: boolean; done: boolean; uploaded: Record<string, Receipt> }
let answers: Answers = {}
let step = 0
let unlocked = [0]
let quiz: Record<string, string> = {}
let delivery: Delivery | undefined
let sending = false
let importing = 0
let imports = Promise.resolve()
let database: IDBDatabase | undefined
let painting = 0
let scene: ReturnType<typeof createScene> | undefined
let sceneRequest = 0
let webglFailed = false
let lastVisual = ''
let fontLoad: Promise<unknown> | undefined

try {
  const saved = JSON.parse(localStorage.getItem(storageKey) ?? '{}')
  if (saved.answers) {
    answers = saved.answers
    unlocked = levelsFor(answers.tipo).filter(level => level === 0 || saved.unlocked?.includes(level))
    step = unlocked.includes(saved.step) ? saved.step : 0
    quiz = saved.quiz ?? {}
    if (saved.delivery?.demo === demo) delivery = saved.delivery
  } else {
    const legacy = JSON.parse(localStorage.getItem('encargo:v1') ?? '{}').answers
    if (legacy) {
      answers = legacy
      if (answers.logo) delete answers.logo.image
    }
  }
} catch { /* Se puede jugar sin almacenamiento local. */ }

function save() {
  try { localStorage.setItem(storageKey, JSON.stringify({ answers, unlocked, step, quiz, delivery })) }
  catch { /* Se puede jugar sin almacenamiento local. */ }
}

function changed() {
  delivery = undefined
  status.textContent = ''
  fallback.hidden = true
  find('[data-progress]').hidden = true
  save()
}

function element<K extends keyof HTMLElementTagNameMap>(tag: K, text = '', className = '') {
  const node = document.createElement(tag)
  node.textContent = text
  if (className) node.className = className
  return node
}

function area(label: string, value: string, onInput: (value: string) => void) {
  const wrapper = element('label', label, 'field')
  const input = element('textarea')
  input.rows = 3
  input.maxLength = 3000
  input.value = value
  input.addEventListener('input', () => onInput(input.value))
  wrapper.append(input)
  return wrapper
}

function storageWarning() {
  const notice = find('[data-storage]')
  notice.hidden = false
  notice.textContent = 'No podemos guardar los archivos en este navegador. Puedes seguir jugando y enviarlos desde esta pestaña. Si recargas, tendrás que añadirlos de nuevo.'
}

interface LocalFile {
  name: string
  relativePath: string
  type: string
  size: number
  lastModified: number
  blob: Blob
}

async function snapshotFile(file: File, relativePath = file.webkitRelativePath): Promise<LocalFile> {
  const { name, type, size, lastModified } = file
  const bytes = await file.arrayBuffer()
  return { name, relativePath, type, size, lastModified, blob: new Blob([bytes], { type }) }
}

const readyFiles = (async () => {
  try {
    database = await openFiles()
    database.onversionchange = () => { database?.close(); database = undefined; storageWarning() }
  } catch { storageWarning() }
  for (const { id } of answers.files ?? []) {
    try {
      if (!database) break
      const file = await fileTransaction<LocalFile | File | undefined>(database, 'readonly', store => store.get(id))
      if (file instanceof File) {
        const snapshot = await snapshotFile(file)
        memory.set(id, snapshot)
        if (database) await fileTransaction(database, 'readwrite', store => store.put(snapshot, id))
      } else if (file) memory.set(id, file)
    } catch { storageWarning() }
  }
  if (step === 4) renderAttachments()
})()

function notice(message: string) {
  find('[data-file-notice]').textContent = message
}

async function addFiles(source: HTMLInputElement | DataTransfer, page: string, kind: Attachment['kind']) {
  importing++
  const previousImport = imports
  let release!: () => void
  imports = new Promise(resolve => { release = resolve })
  const messages = new Set<string>()
  const read = async (file: File, relativePath?: string) => {
    const heic = isHeic(file)
    const isImage = heic || file.type.startsWith('image/') || /\.(jpe?g|png|gif|webp|avif|bmp|tiff?|svg)$/i.test(file.name)
    if (kind === 'pdf' ? !(file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) : !isImage) {
      messages.add(kind === 'pdf' ? 'Solo se añaden documentos PDF en este selector.' : 'Hemos omitido los archivos que no son imágenes. Puedes añadir los PDF por separado.')
      return
    }
    try {
      return await snapshotFile(file, relativePath)
    } catch {
      messages.add(`No hemos podido leer «${file.name}».`)
    }
  }
  try {
    let files: (LocalFile | undefined)[]
    if (source instanceof HTMLInputElement) {
      source.disabled = true
      try {
        files = await Promise.all(Array.from(source.files ?? [], file => read(file)))
      } finally {
        source.value = ''
        source.disabled = false
      }
    } else {
      files = await droppedFiles(source, read, name => messages.add(`No hemos podido leer «${name}».`))
    }
    await previousImport
    await readyFiles
    for (const file of files) {
      if (!file) continue
      const attachment: Attachment = { id: crypto.randomUUID(), name: file.name, page, kind, size: file.size, caption: '' }
      const previous = answers.files ?? []
      const existing = previous.find(item => item.kind === kind &&
        (kind === 'logo' || (!memory.has(item.id) && item.page === page && item.name === file.name && item.size === file.size)))
      if (existing && kind !== 'logo') Object.assign(attachment, { id: existing.id, caption: existing.caption })
      const updated = existing ? previous.map(item => item === existing ? attachment : item) : [...previous, attachment]
      if (planUpload(updated).overLimit) {
        messages.add('Has alcanzado el límite de 150 archivos o 300 MB. Comparte el material que falta con un enlace.')
        continue
      }
      if (isHeic(file)) messages.add('Hemos añadido los archivos HEIC. Este navegador no muestra su miniatura.')
      if (database) {
        try {
          await fileTransaction(database, 'readwrite', store => store.put(file, attachment.id))
        } catch { storageWarning() }
      }
      memory.set(attachment.id, file)
      if (existing && existing.id !== attachment.id) await removeBlob(existing.id)
      answers.files = updated
      if (existing?.id === attachment.id) save()
      else changed()
    }
  } catch {
    messages.add('No hemos podido abrir esa carpeta. Elígela con el selector.')
  } finally {
    await previousImport
    release()
    importing--
    notice([...messages].join(' '))
    if (step === 4) renderAttachments()
  }
}

async function removeBlob(id: string) {
  memory.delete(id)
  const url = thumbnails.get(id)
  if (url) URL.revokeObjectURL(url)
  thumbnails.delete(id)
  if (database) {
    try { await fileTransaction(database, 'readwrite', store => store.delete(id)) }
    catch { storageWarning() }
  }
}

function fileList(files: Attachment[]) {
  const list = element('ol', '', 'files')
  files.forEach((attachment, index) => {
    const { id, name, kind } = attachment
    const file = memory.get(id)
    const item = element('li')
    const thumbnail = element('div')
    if (file && kind !== 'pdf' && !isHeic(file)) {
      const image = element('img')
      image.alt = ''
      image.loading = 'lazy'
      if (!thumbnails.has(id)) thumbnails.set(id, URL.createObjectURL(file.blob))
      image.src = thumbnails.get(id)!
      image.addEventListener('error', () => thumbnail.replaceChildren(element('span', 'Sin vista previa', 'note')))
      thumbnail.append(image)
    } else thumbnail.append(element('span', file ? 'Sin vista previa' : 'Archivo pendiente', 'note'))
    const info = element('div')
    info.append(element('strong', name))
    if (kind === 'image') {
      const label = element('label', 'Pie de foto', 'field')
      const caption = element('input')
      caption.setAttribute('aria-label', `Pie de foto de ${name}`)
      caption.maxLength = 250
      caption.value = attachment.caption
      caption.addEventListener('input', () => { attachment.caption = caption.value; changed() })
      label.append(caption)
      info.append(label)
    }
    const actions = element('div', '', 'file-actions')
    for (const [title, offset] of [['Subir posición', -1], ['Bajar posición', 1], ['Quitar', 0]] as const) {
      const button = element('button', title)
      button.type = 'button'
      button.setAttribute('aria-label', `${title} · ${name}`)
      const neighbor = files[index + offset]
      button.disabled = offset !== 0 && !neighbor
      button.addEventListener('click', () => {
        if (importing) return
        const records = answers.files ?? []
        if (offset === 0) {
          answers.files = records.filter(record => record.id !== id)
          void removeBlob(id)
        } else {
          const from = records.indexOf(attachment)
          const to = records.indexOf(neighbor)
          ;[records[from], records[to]] = [records[to], records[from]]
        }
        changed()
        renderAttachments()
        all<HTMLButtonElement>('.file-actions button').find(candidate => candidate.getAttribute('aria-label') === button.getAttribute('aria-label') && !candidate.disabled)?.focus()
      })
      actions.append(button)
    }
    info.append(actions)
    item.append(thumbnail, info)
    list.append(item)
  })
  return list
}

function renderStructure() {
  find('[data-structure]').replaceChildren(...(answers.pages ?? []).map(page =>
    area(`Secciones de ${page}`, answers.pageSections?.[page] ?? '', text => {
      ;(answers.pageSections ??= {})[page] = text
      changed()
    })))
}

function renderContent() {
  find('[data-content]').replaceChildren(...(answers.pages ?? []).map(page => {
    const section = element('section', '', 'content-page')
    section.append(element('h3', page))
    const content: PageText = (answers.content ??= {})[page] ??= {}
    for (const [key, label] of textFields) {
      const field = content[key] ??= {}
      const wrapper = area(`${label} de ${page}`, field.text ?? '', text => { field.text = text; changed() })
      const input = wrapper.querySelector('textarea')!
      input.disabled = !!field.studio
      const option = element('label', 'Lo escribís vosotros')
      const check = element('input')
      check.type = 'checkbox'
      check.checked = !!field.studio
      check.setAttribute('aria-label', `${label} de ${page}: lo escribís vosotros`)
      check.addEventListener('change', () => { input.disabled = field.studio = check.checked; changed() })
      option.prepend(check)
      section.append(wrapper, option)
    }
    const drop = element('label', `Carpeta de imágenes de ${page}`, 'drop field')
    const picker = element('input')
    picker.type = 'file'
    picker.multiple = true
    picker.setAttribute('webkitdirectory', '')
    picker.addEventListener('change', () => {
      void addFiles(picker, page, 'image')
    })
    drop.addEventListener('dragover', event => { event.preventDefault(); drop.dataset.drag = '' })
    drop.addEventListener('dragleave', () => { delete drop.dataset.drag })
    drop.addEventListener('drop', event => {
      event.preventDefault()
      delete drop.dataset.drag
      if (event.dataTransfer) void addFiles(event.dataTransfer, page, 'image')
    })
    drop.append(picker, element('span', 'Elige una carpeta o arrástrala aquí.', 'note'))
    const attachments = element('div')
    attachments.dataset.pageFiles = page
    section.append(drop, attachments)
    return section
  }))
}

function renderAttachments() {
  const files = answers.files ?? []
  // Keep the directory input mounted while Chromium enumerates the selected folder.
  for (const list of all('[data-page-files]')) {
    list.replaceChildren(fileList(files.filter(file => file.kind === 'image' && file.page === list.dataset.pageFiles)))
  }
  find('[data-extra-files]').replaceChildren(fileList(files.filter(file => file.kind !== 'image')))
}

all<HTMLInputElement>('[data-upload]').forEach(input => input.addEventListener('change', () => {
  const kind = input.dataset.upload === 'logo' ? 'logo' : 'pdf'
  void addFiles(input, kind === 'logo' ? 'Logo' : 'Documentos', kind)
}))
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
  find('[data-preview-material]').textContent = `${answers.texture ?? 'Papel'} · ${answers.mode ?? 'Oscuro'}`
  flat.setAttribute('role', 'img')
  const artifactNames = artifacts.filter(([id]) => answers.artifacts?.includes(id)).map(([, name]) => name)
  const description = [title, selectedPalette(answers)[0], selectedPair(answers)[0], answers.texture, answers.mode,
    answers.goal, answers.pages?.join(', '), artifactNames.join(', ')].filter(Boolean).join(' · ')
  flat.setAttribute('aria-label', `Maqueta de ${description}`)
  preview.setAttribute('aria-label', `Maqueta viva de ${description}`)
  const ticket = ++painting
  const redraw = () => {
    scene?.beforePaint()
    paint(desktop, { ...answers, mode: answers.mode ?? 'Oscuro' }, false)
    paint(phone, { ...answers, mode: answers.mode ?? 'Oscuro' }, true)
    scene?.afterPaint(Number(answers.motion ?? 1))
  }
  redraw()
  const fontSpecs = [`${weight} 40px "${heading}"`, `${bodyWeight} 20px "${body}"`]
  const ready = step === 2 || answers.pair ? loadFonts() : Promise.resolve()
  void ready.then(async () => {
    const pending = fontSpecs.filter(spec => !document.fonts.check(spec, title))
    if (!pending.length) return
    await Promise.allSettled(pending.map(spec => document.fonts.load(spec, title)))
    if (ticket === painting) redraw()
  })
}

async function configureScene() {
  const request = ++sceneRequest
  if (forceFlat || reduced.matches || (narrow.matches && !preview.hasAttribute('data-expanded'))) {
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

function restoreInputs() {
  const values = { ...answers, ...quiz } as Record<string, unknown>
  all<HTMLInputElement | HTMLTextAreaElement>('.brief [name]').forEach(input => {
    const value = values[input.name]
    if (input instanceof HTMLInputElement && input.type === 'radio') input.checked = String(value) === input.value
    else if (input instanceof HTMLInputElement && input.type === 'checkbox') input.checked = Array.isArray(value) && value.includes(input.value)
    else input.value = typeof value === 'string' ? value : input.name === 'motion' ? '1' : ''
  })
  updateBranches()
  renderContent()
}

function updateBranches() {
  find('[data-other]').hidden = answers.sector !== 'Otro'
  find('[data-type-four]').hidden = answers.tipo !== 4
  find('[data-marketplace]').hidden = answers.marketplace !== 'Sí'
  const dial = motion[Number(answers.motion ?? 1)]
  find('[data-motion]').textContent = dial
  find('[name="motion"]').setAttribute('aria-valuetext', dial)
  const quizComplete = ['quizEdit', 'quizFeatures', 'quizPlatform'].every(key => quiz[key])
  const recommendation = recommendTipo({ edit: quiz.quizEdit === 'Sí', features: quiz.quizFeatures === 'Sí', platform: quiz.quizPlatform === 'Sí' })
  const button = find<HTMLButtonElement>('[data-recommend]')
  button.hidden = !quizComplete
  button.value = String(recommendation)
  find('[data-recommendation]').textContent = quizComplete ? `Te recomendamos ${plataformas[recommendation - 1].nombre}.` : ''
}

function visibleAnswers(): Answers {
  const pages = answers.pages ?? []
  return {
    ...answers,
    files: answers.files?.filter(file => file.kind !== 'image' || pages.includes(file.page)),
    pageSections: Object.fromEntries(pages.map(page => [page, answers.pageSections?.[page] ?? ''])),
    content: Object.fromEntries(pages.map(page => [page, answers.content?.[page] ?? {}])),
    editable: (answers.tipo ?? 1) >= 2 ? answers.editable : undefined,
    admins: (answers.tipo ?? 1) >= 2 ? answers.admins : undefined,
    adminRoles: (answers.tipo ?? 1) >= 2 ? answers.adminRoles : undefined,
    features: (answers.tipo ?? 1) >= 3 ? answers.features : undefined,
    integrations: (answers.tipo ?? 1) >= 3 ? answers.integrations : undefined,
    workflow: (answers.tipo ?? 1) >= 3 ? answers.workflow : undefined,
    roles: answers.tipo === 4 ? answers.roles : undefined,
    permissions: answers.tipo === 4 ? answers.permissions : undefined,
    marketplace: answers.tipo === 4 ? answers.marketplace : undefined,
    sellers: answers.tipo === 4 && answers.marketplace === 'Sí' ? answers.sellers : undefined,
    commissions: answers.tipo === 4 && answers.marketplace === 'Sí' ? answers.commissions : undefined,
  }
}

function updateDocuments() {
  const current = visibleAnswers()
  find('[data-prompt]').textContent = buildPrompt(current)
  find('[data-json]').textContent = buildJson(current)
  const subject = encodeURIComponent(`Encargo web · ${current.business || 'Nuevo encargo'}`)
  const body = encodeURIComponent(`Hola,\n\nAdjunto el brief que he descargado.${current.shareLink ? `\n\nArchivos: ${current.shareLink}` : ''}`)
  find<HTMLAnchorElement>('[data-email]').href = `mailto:${STUDIO_EMAIL}?subject=${subject}&body=${body}`
}

function pendingState() {
  if (delivery?.done) {
    status.textContent = demo ? 'Envío de prueba completado.' : 'Recibido. Tu encargo ha llegado al estudio.'
    send.disabled = true
  } else if (delivery) {
    const count = Object.keys(delivery.uploaded).length
    const sent = count === 1 ? '1 archivo ya enviado' : `${count} archivos ya enviados`
    status.textContent = `Envío pendiente. ${sent}. Puedes continuar desde aquí.`
    send.textContent = 'Reanudar envío'
  }
}

function renderFinal() {
  const current = visibleAnswers()
  const platform = plataformas.find(item => item.tipo === current.tipo)
  const specs = [
    ['Proyecto', current.business || 'Sin indicar'],
    ['Tipo de web', platform?.nombre || 'Sin indicar'],
    ['Objetivo', current.goal || 'Sin indicar'],
    ['Diseño', `${current.mode ?? 'Oscuro'} · ${selectedPalette(current)[0]} · ${selectedPair(current)[0]}`],
    ...(current.pages ?? []).map(page => {
      const texts = Object.values(current.content?.[page] ?? {}).filter(field => field.studio || field.text?.trim()).length
      const images = current.files?.filter(file => file.kind === 'image' && file.page === page).length ?? 0
      return [page, `${texts} textos · ${images} imágenes`]
    }),
    ['Otros archivos', `${current.files?.filter(file => file.kind !== 'image').length ?? 0} adjuntos`],
  ]
  find('[data-specs]').replaceChildren(...specs.flatMap(([label, value]) => [element('dt', label), element('dd', value)]))
  fallbackLink.value = current.shareLink ?? ''
  send.disabled = false
  send.textContent = 'Enviar al estudio'
  updateDocuments()
  pendingState()
}

const summaries = [
  () => plataformas.find(item => item.tipo === answers.tipo)?.nombre ?? 'Tipo de web',
  () => answers.business ?? 'Tu negocio',
  () => `Paleta ${selectedPalette(answers)[0]} · ${selectedPair(answers)[0]}`,
  () => `${answers.pages?.length ?? 0} páginas`,
  () => `${visibleAnswers().files?.length ?? 0} archivos preparados`,
  () => `${answers.editable?.length ?? 0} elementos editables`,
  () => `${answers.features?.length ?? 0} funcionalidades`,
  () => 'Ficha del proyecto',
]

function showLevel(focus = false) {
  const path = levelsFor(answers.tipo)
  sheets.forEach((sheet, level) => { sheet.hidden = step !== level })
  all<HTMLButtonElement>('[data-level]').forEach((button, level) => {
    button.hidden = !path.includes(level)
    button.disabled = sending || !unlocked.includes(level)
    if (step === level) button.setAttribute('aria-current', 'step')
    else button.removeAttribute('aria-current')
    button.toggleAttribute('data-unlocked', unlocked.includes(level))
  })
  find('[data-level-label]').textContent = `Nivel ${String(step).padStart(2, '0')} · ${path.indexOf(step) + 1} de ${path.length}`
  back.disabled = sending || step === 0
  next.hidden = step === 8
  next.textContent = step === 7 ? 'Completar partida' : 'Siguiente'
  if (step === 2) {
    void loadFonts().then(() => renderPreview(true))
  }
  if (step === 3) renderStructure()
  if (step === 4) renderAttachments()
  if (step === 8) renderFinal()
  renderPreview()
  if (focus) {
    window.scrollTo({ top: 0, behavior: 'instant' })
    sheets[step].querySelector<HTMLElement>('h1,h2')?.focus({ preventScroll: true })
    sheets[step].animate(reduced.matches ? [{ opacity: .75 }, { opacity: 1 }] :
      [{ opacity: .5, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 200 })
  }
  save()
}

function navigate(level: number) {
  if (sending || importing || !unlocked.includes(level)) return
  step = level
  find('[data-unlock]').textContent = ''
  showLevel(true)
}

all<HTMLButtonElement>('[data-level]').forEach(button => button.addEventListener('click', () => navigate(Number(button.dataset.level))))
back.addEventListener('click', () => {
  const path = levelsFor(answers.tipo)
  navigate(path[path.indexOf(step) - 1])
})
form.addEventListener('submit', event => {
  event.preventDefault()
  if (sending || importing || step === 8) return
  if (step === 0 && !answers.tipo) {
    find('[data-unlock]').textContent = 'Elige un tipo de web para seguir.'
    find<HTMLInputElement>('[name="tipo"]').focus()
    return
  }
  for (const input of sheets[step].querySelectorAll<HTMLInputElement>('input[required], input[type="url"]')) {
    input.setCustomValidity(input.required && !input.value.trim() ? 'Completa este campo para continuar.' : '')
    if (!input.reportValidity()) return
  }
  const path = levelsFor(answers.tipo)
  const following = path[path.indexOf(step) + 1]
  if (!unlocked.includes(following)) unlocked.push(following)
  find('[data-unlock]').textContent = `Desbloqueado: ${levels[following]} · ${summaries[step]()}`
  step = following
  showLevel(true)
})

form.addEventListener('keydown', event => {
  const target = event.target
  if (event.key === 'Enter' && target instanceof HTMLInputElement && ['radio', 'checkbox'].includes(target.type)) {
    event.preventDefault()
    target.click()
  }
})
form.addEventListener('input', event => {
  const target = event.target
  if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) || !target.name) return
  target.setCustomValidity('')
  if (target.name.startsWith('quiz')) {
    quiz[target.name] = target.value
    save()
  } else {
    const values = answers as Record<string, unknown>
    if (target.name === 'tipo') {
      const type = Number(target.value) as Tipo
      if (type !== answers.tipo) {
        answers.tipo = type
        const path = levelsFor(type)
        const firstLocked = path.findIndex(level => !unlocked.includes(level))
        unlocked = firstLocked === -1 ? path : path.slice(0, firstLocked)
        showLevel()
      }
    } else {
      values[target.name] = target instanceof HTMLInputElement && target.type === 'checkbox'
        ? all<HTMLInputElement>(`[name="${target.name}"]:checked`).map(input => input.value)
        : target.value
    }
    changed()
    if (target.name === 'pages') {
      renderStructure()
      renderContent()
    }
  }
  if (target instanceof HTMLInputElement && target.checked && !reduced.matches) {
    target.nextElementSibling?.animate([
      { transform: 'translateY(3px) scale(.97)', opacity: .72 },
      { transform: 'none', opacity: 1 },
    ], { duration: 175, easing: 'ease-out' })
  }
  updateBranches()
  renderPreview()
})

find<HTMLButtonElement>('[data-recommend]').addEventListener('click', event => {
  const button = event.currentTarget as HTMLButtonElement
  const card = find<HTMLInputElement>(`[name="tipo"][value="${button.value}"]`)
  card.click()
  card.focus()
})

const reset = find<HTMLButtonElement>('[data-reset]')
reset.addEventListener('click', () => { if (!sending && !importing) resetDialog.showModal() })
resetDialog.addEventListener('close', async () => {
  if (resetDialog.returnValue !== 'reset') return
  resetDialog.returnValue = ''
  await readyFiles
  for (const { id } of answers.files ?? []) await removeBlob(id)
  answers = {}
  quiz = {}
  unlocked = [0]
  step = 0
  form.reset()
  restoreInputs()
  changed()
  notice('')
  find('[data-unlock]').textContent = ''
  showLevel(true)
})

function download() {
  const link = element('a')
  const objectUrl = URL.createObjectURL(new Blob([buildPrompt(visibleAnswers())], { type: 'text/markdown;charset=utf-8' }))
  link.href = objectUrl
  link.download = filenames(answers.business).markdown
  link.click()
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
}
find('[data-download]').addEventListener('click', download)
find('[data-copy]').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(buildPrompt(visibleAnswers()))
    status.textContent = 'Brief copiado.'
  } catch { status.textContent = 'Puedes seleccionar el texto del brief o descargarlo.' }
})
fallbackLink.addEventListener('input', () => {
  answers.shareLink = fallbackLink.value
  find<HTMLInputElement>('[name="shareLink"]').value = fallbackLink.value
  save()
  updateDocuments()
})

function showFallback(message: string, allowLinkOnly = true) {
  status.textContent = message
  fallback.hidden = false
  linkOnly.hidden = !allowLinkOnly
}

async function deliver(onlyLink = false) {
  if (sending || delivery?.done) return
  if (onlyLink && (!fallbackLink.value.trim() || !fallbackLink.reportValidity())) {
    fallbackLink.focus()
    status.textContent = 'Introduce un enlace para compartir los archivos.'
    return
  }
  const current = visibleAnswers()
  const { entries, overLimit } = planUpload(current.files ?? [])
  if (overLimit && !onlyLink) {
    showFallback('El material supera el límite. Comparte los archivos mediante un enlace.')
    return
  }
  sending = true
  send.disabled = back.disabled = reset.disabled = linkOnly.disabled = fallbackLink.disabled = true
  all<HTMLButtonElement>('[data-level]').forEach(button => { button.disabled = true })
  const active = delivery ??= {
    id: crypto.randomUUID(), name: filenames(current.business).base, demo, created: false, done: false, uploaded: {},
  }
  save()
  const request = (action: string, details: Record<string, unknown> = {}) =>
    retryDelivery({ action, name: active.name, session: active.id, ...details }, demo)
  const progress = find<HTMLProgressElement>('[data-total]')
  const fileProgress = find<HTMLProgressElement>('[data-file-progress]')
  const fileLabel = find('[data-current-file]')
  find('[data-progress]').hidden = false
  progress.max = entries.length + 2
  progress.value = Number(active.created) + Object.keys(active.uploaded).length
  fileProgress.value = 0
  fileLabel.textContent = 'Archivo actual'
  status.textContent = 'Preparando el envío…'
  try {
    await readyFiles
    if (!active.created) {
      await request('create', { markdown: buildPrompt(current), json: buildJson(current) })
      active.created = true
      progress.value++
      save()
    }
    const failures: string[] = []
    for (const file of onlyLink ? [] : entries) {
      if (active.uploaded[file.id]) continue
      fileLabel.textContent = file.name
      fileProgress.removeAttribute('value')
      try {
        const original = memory.get(file.id)?.blob
        if (!original) throw new Error('Vuelve a añadir el archivo.')
        const blob = await prepareFile(original, file.name, file.kind)
        if (blob.size > 12_000_000) throw new Error('Comparte este archivo por enlace.')
        const filename = blob === original ? file.filename : `${file.filename} (${file.id}).webp`
        const result = await request('upload', { folder: file.folder, filename, size: blob.size,
          mime: blob.type || 'application/octet-stream', base64: demo ? '' : await base64(blob) })
        if (typeof result.filename !== 'string' || typeof result.size !== 'number') throw new Error('No se ha confirmado el archivo.')
        active.uploaded[file.id] = { filename: result.filename, size: result.size }
        fileProgress.value = 1
        progress.value++
        save()
      } catch (error) {
        if (error instanceof OldDeployment) throw error
        fileProgress.value = 0
        failures.push(file.name)
      }
    }
    if (failures.length) {
      showFallback(`Quedan ${failures.length} archivos pendientes: ${failures.join(', ')}. Reintenta el envío, vuelve a añadirlos si faltan o comparte un enlace.`)
      send.textContent = 'Reintentar pendientes'
      return
    }
    await request('finish', { manifest: buildManifest(entries, active.uploaded, current.shareLink) })
    active.done = true
    save()
    progress.value = progress.max
    fallback.hidden = true
    pendingState()
  } catch (error) {
    showFallback(error instanceof OldDeployment ? error.message : 'No hemos podido completar el envío. Reintenta los pendientes o descarga el .md y compártelo por email junto con el enlace.', !(error instanceof OldDeployment))
    send.textContent = 'Reintentar envío'
  } finally {
    sending = false
    send.disabled = !!active.done
    back.disabled = reset.disabled = linkOnly.disabled = fallbackLink.disabled = false
    all<HTMLButtonElement>('[data-level]').forEach((button, level) => { button.disabled = !unlocked.includes(level) })
  }
}

send.addEventListener('click', () => { void deliver() })
linkOnly.addEventListener('click', () => { void deliver(true) })
restoreInputs()
showLevel()
void configureScene()
