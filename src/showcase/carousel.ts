export {}

const carousel = document.querySelector<HTMLElement>('[data-carousel]')!
const stage = carousel.querySelector<HTMLElement>('[data-stage]')!
const projects = [...carousel.querySelectorAll<HTMLLIElement>('[data-project]')]
const links = projects.map(project => project.querySelector<HTMLAnchorElement>('a')!)
const filters = [...carousel.querySelectorAll<HTMLButtonElement>('[data-filter]')]
const name = carousel.querySelector<HTMLElement>('[data-name]')!
const details = carousel.querySelector<HTMLElement>('[data-details]')!

let visible = projects
let current = projects[0]
const angles = new Map<HTMLLIElement, number>()

function show(project: HTMLLIElement, recomposing = false) {
  if (carousel.hasAttribute('data-ready')) carousel.setAttribute('data-animated', '')
  current.removeAttribute('data-held')
  current = project
  const front = visible.indexOf(project)

  for (const screen of projects) {
    const index = visible.indexOf(screen)
    const count = visible.length
    const offset = index - front
    const distance = Math.abs(offset) > count / 2 ? offset - Math.sign(offset) * count : offset
    const angle = count === 2 ? distance * 57 : distance * 360 / count
    const previous = angles.get(screen) ?? angle
    const rotation = recomposing || count === 2 ? angle : angle + 360 * Math.round((previous - angle) / 360)
    if (index >= 0) {
      angles.set(screen, rotation)
      screen.style.setProperty('--angle', `${rotation}deg`)
    }
    const light = Math.abs(distance) === 1 ? .54 : .22
    screen.style.setProperty('--light', index < 0 ? '0' : screen === project ? '1' : String(light))
    screen.style.setProperty('--sink', index < 0 ? '80px' : '0px')
    screen.inert = index < 0
    if (screen.inert) screen.setAttribute('aria-hidden', 'true')
    else screen.removeAttribute('aria-hidden')
    screen.toggleAttribute('data-current', screen === project)
  }

  const link = links[projects.indexOf(project)]
  name.textContent = link.getAttribute('aria-label')
  details.textContent = `${project.dataset.kind} · ${project.dataset.sector}`
}

function move(direction: number, focus = false) {
  if (visible.length < 2) return
  const index = (visible.indexOf(current) + direction + visible.length) % visible.length
  show(visible[index])
  if (focus) links[projects.indexOf(current)].focus({ preventScroll: true })
}

for (const button of filters) {
  button.addEventListener('click', () => {
    if (button.getAttribute('aria-pressed') === 'true') return
    for (const filter of filters) filter.setAttribute('aria-pressed', String(filter === button))
    visible = projects.filter(project => !button.dataset.filter || project.dataset.kind === button.dataset.filter)
    show(visible.includes(current) ? current : visible[0], true)
  })
}

carousel.addEventListener('keydown', event => {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
  if ((event.target as Element).closest('[data-filter]') || event.altKey || event.metaKey || event.ctrlKey) return
  event.preventDefault()
  move(event.key === 'ArrowLeft' ? -1 : 1, stage.contains(document.activeElement))
})

let gesture: { id: number; x: number; y: number } | undefined
let hold: ReturnType<typeof setTimeout>
let suppressClick = false

for (const [index, link] of links.entries()) {
  const project = projects[index]
  link.addEventListener('focus', () => {
    if (link.matches(':focus-visible') && project !== current) show(project)
  })
  link.addEventListener('click', event => {
    if (event.detail && suppressClick) {
      event.preventDefault()
      suppressClick = false
      return
    }
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    if (project !== current) {
      event.preventDefault()
      show(project)
    }
  })
}

stage.addEventListener('pointerdown', event => {
  if (!event.isPrimary || event.button !== 0) return
  suppressClick = false
  gesture = { id: event.pointerId, x: event.clientX, y: event.clientY }
  if (event.pointerType !== 'mouse' && (event.target as Element).closest('[data-current]')) {
    hold = setTimeout(() => {
      current.setAttribute('data-held', '')
      suppressClick = true
    }, 320)
  }
})
window.addEventListener('pointermove', event => {
  if (gesture?.id !== event.pointerId) return
  if (Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > 10) clearTimeout(hold)
})
function endGesture(event: PointerEvent) {
  if (gesture?.id !== event.pointerId) return
  clearTimeout(hold)
  current.removeAttribute('data-held')
  const x = event.clientX - gesture.x
  const y = event.clientY - gesture.y
  if (event.type === 'pointerup' && Math.abs(x) > 35 && Math.abs(x) > Math.abs(y)) {
    suppressClick = true
    move(x < 0 ? 1 : -1)
  }
  gesture = undefined
}
window.addEventListener('pointerup', endGesture)
window.addEventListener('pointercancel', endGesture)

let wheelDistance = 0
let wheelEnd: ReturnType<typeof setTimeout>
let wheelMoved = false
stage.addEventListener('wheel', event => {
  if (event.ctrlKey || Math.abs(event.deltaX) <= Math.abs(event.deltaY) || visible.length < 2) return
  event.preventDefault()
  clearTimeout(wheelEnd)
  wheelEnd = setTimeout(() => { wheelDistance = 0; wheelMoved = false }, 180)
  wheelDistance += event.deltaX * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? stage.clientWidth : 1)
  if (!wheelMoved && Math.abs(wheelDistance) >= 25) {
    wheelMoved = true
    move(Math.sign(wheelDistance))
  }
}, { passive: false })

show(current)
carousel.querySelector<HTMLElement>('.filters')!.hidden = false
carousel.querySelector<HTMLElement>('[data-selection]')!.hidden = false
carousel.setAttribute('data-ready', '')
