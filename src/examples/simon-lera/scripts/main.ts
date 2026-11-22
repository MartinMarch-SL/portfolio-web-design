import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

const reduced = matchMedia('(prefers-reduced-motion: reduce)')
const desktop = matchMedia('(min-width: 761px)')
const finePointer = matchMedia('(hover: hover) and (pointer: fine)')

let lenis: Lenis | undefined
function syncMotion() {
  if (!reduced.matches && finePointer.matches) lenis ??= new Lenis({ autoRaf: true, anchors: false })
  else {
    lenis?.destroy()
    lenis = undefined
  }
}
syncMotion()
reduced.addEventListener('change', syncMotion)
finePointer.addEventListener('change', syncMotion)

function reveal(elements: Iterable<HTMLElement>) {
  if (reduced.matches) return
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.intersectionRatio >= .5) {
        entry.target.classList.remove('reveal-pending', 'reveal-entering')
        observer.unobserve(entry.target)
      } else if (entry.intersectionRatio >= .15 && entry.target.classList.contains('reveal-pending')) {
        entry.target.classList.replace('reveal-pending', 'reveal-entering')
      }
    }
  }, { threshold: [.15, .5] })
  for (const element of elements) {
    if (element.getBoundingClientRect().top < innerHeight) continue
    element.classList.add('reveal-pending')
    observer.observe(element)
  }
}

reveal(document.querySelectorAll<HTMLElement>('[data-reveal]'))

const hero = document.querySelector<HTMLElement>('[data-hero]')
if (hero && !reduced.matches && innerHeight > 530) {
  import('./hero').then(({ mountHero }) => mountHero(hero, reduced)).catch(() => {
    // The static artwork remains in the document.
  })
}

function mountWall(wall: HTMLElement) {
  const viewport = wall.querySelector<HTMLElement>('[data-rail-window]')!
  const track = wall.querySelector<HTMLElement>('[data-wall-track]')!
  const cards = [...wall.querySelectorAll<HTMLElement>('[data-work]')]
  const filters = document.querySelector<HTMLElement>('[data-filters]')!
  const note = document.querySelector<HTMLElement>('[data-series-note]')!
  const count = document.querySelector<HTMLElement>('[data-count]')!
  const empty = wall.querySelector<HTMLElement>('[data-empty]')!
  const selected: Record<string, string> = { series: '', state: '' }
  let distance = 0
  let frame = 0

  function render() {
    frame = 0
    const offset = Math.max(0, Math.min(distance, -wall.getBoundingClientRect().top))
    track.style.transform = distance ? `translate3d(${-offset}px, 0, 0)` : ''
  }

  function schedule() {
    if (!frame && distance) frame = requestAnimationFrame(render)
  }

  function measure() {
    distance = desktop.matches && !reduced.matches ? Math.max(0, track.scrollWidth - viewport.clientWidth) : 0
    wall.toggleAttribute('data-rail-active', distance > 0)
    wall.style.minHeight = distance ? `${viewport.offsetHeight + distance}px` : ''
    if (distance) viewport.scrollLeft = 0
    render()
  }

  filters.addEventListener('click', event => {
    const button = (event.target as Element).closest<HTMLButtonElement>('[data-filter]')
    if (!button) return
    const { filter, value, note: description } = button.dataset
    selected[filter!] = value!
    button.parentElement?.querySelector('[aria-pressed="true"]')?.setAttribute('aria-pressed', 'false')
    button.setAttribute('aria-pressed', 'true')
    if (description) note.textContent = description

    let total = 0
    for (const card of cards) {
      card.hidden = Object.entries(selected).some(([key, choice]) => choice && card.dataset[key] !== choice)
      if (!card.hidden) total++
    }
    empty.hidden = total > 0
    count.textContent = total === 1 ? '1 obra' : `${total} obras`
    viewport.scrollLeft = 0
    measure()
  })

  viewport.addEventListener('focusin', event => {
    const card = (event.target as Element).closest<HTMLElement>('[data-work]')
    if (!distance || !card) return
    const item = card.getBoundingClientRect()
    const windowRect = viewport.getBoundingClientRect()
    if (item.left >= windowRect.left && item.right <= windowRect.right) return
    const x = card.offsetLeft + card.offsetWidth / 2 - viewport.clientWidth / 2
    const top = window.scrollY + wall.getBoundingClientRect().top + Math.min(distance, Math.max(0, x))
    if (lenis) lenis.scrollTo(top, { immediate: true })
    else window.scrollTo({ top, behavior: 'instant' })
    render()
  })
  window.addEventListener('scroll', schedule, { passive: true })
  reduced.addEventListener('change', measure)
  const resize = new ResizeObserver(measure)
  resize.observe(viewport)
  resize.observe(track)
  filters.hidden = false
  measure()
}

const wall = document.querySelector<HTMLElement>('[data-wall]')
if (wall) mountWall(wall)

function mountDetail(detail: HTMLElement) {
  const painting = detail.querySelector<HTMLElement>('[data-painting]')!
  const scale = detail.querySelector<HTMLElement>('[data-scale]')!
  const scaleToggle = detail.querySelector<HTMLButtonElement>('[data-scale-toggle]')!
  const controls = detail.querySelector<HTMLElement>('[data-view-controls]')!
  const room = detail.querySelector<HTMLButtonElement>('[data-light="room"]')!
  const raking = detail.querySelector<HTMLButtonElement>('[data-light="raking"]')!
  const canvas = detail.querySelector<HTMLElement>('[data-raking-canvas]')!
  const note = detail.querySelector<HTMLElement>('[data-light-note]')!
  const form = detail.querySelector<HTMLFormElement>('form')!
  const confirmation = detail.querySelector<HTMLElement>('[data-confirmation]')!
  let mounted = false

  function setLight(isRaking: boolean) {
    room.setAttribute('aria-pressed', String(!isRaking))
    raking.setAttribute('aria-pressed', String(isRaking))
    canvas.hidden = !isRaking
  }

  function unavailable() {
    setLight(false)
    raking.disabled = true
    note.textContent = 'La luz rasante no está disponible en este dispositivo.'
  }

  room.addEventListener('click', () => setLight(false))
  raking.addEventListener('click', async () => {
    setLight(true)
    if (mounted) return
    mounted = true
    raking.setAttribute('aria-busy', 'true')
    try {
      const { mountRaking } = await import('./raking')
      await mountRaking(painting, canvas, detail.dataset.source!, reduced, unavailable)
    } catch {
      unavailable()
    } finally {
      raking.removeAttribute('aria-busy')
    }
  })

  scaleToggle.addEventListener('click', () => {
    const show = scale.hidden === true
    if (show) setLight(false)
    scale.hidden = !show
    painting.hidden = show
    room.disabled = show
    if (!note.textContent) raking.disabled = show
    scaleToggle.setAttribute('aria-pressed', String(show))
  })

  form.addEventListener('submit', event => {
    event.preventDefault()
    form.reset()
    confirmation.hidden = false
  })
  form.addEventListener('input', () => { confirmation.hidden = true })
  form.hidden = false
  controls.hidden = false
  setLight(false)
}

const detail = document.querySelector<HTMLElement>('[data-detail]')
if (detail) mountDetail(detail)

// A shared snapshot is needed only for the work involved in the navigation.
function prepareWallTransition(other: NavigationHistoryEntry | null | undefined) {
  if (!wall || !other?.url) return
  const slug = new URL(other.url).pathname.split('/').filter(Boolean).at(-1)
  for (const card of wall.querySelectorAll<HTMLElement>('[data-work]')) {
    card.classList.toggle('without-snapshot', card.dataset.work !== slug)
  }
}

window.addEventListener('pageswap', event => {
  if (event.viewTransition) prepareWallTransition(event.activation?.entry)
})
window.addEventListener('pagereveal', event => {
  if (!event.viewTransition) return
  prepareWallTransition(window.navigation?.activation?.from)
  void event.viewTransition.finished.finally(() => {
    wall?.querySelectorAll('.without-snapshot').forEach(card => card.classList.remove('without-snapshot'))
  }).catch(() => {})
})
window.addEventListener('pageshow', event => {
  if (event.persisted) wall?.querySelectorAll('.without-snapshot').forEach(card => card.classList.remove('without-snapshot'))
})
