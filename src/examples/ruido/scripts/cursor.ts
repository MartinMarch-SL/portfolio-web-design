import { canHover, onMotionPreferencesChange, prefersReducedMotion } from './motion-prefs'

let cleanup: (() => void) | undefined

function update() {
  cleanup?.()
  if (!document.documentElement.classList.contains('ruido') || !canHover() || prefersReducedMotion()) return
  const cursor = document.createElement('div')
  cursor.className = 'ruido-cursor'
  cursor.setAttribute('aria-hidden', 'true')
  document.body.append(cursor)

  const root = document.documentElement
  const listeners = new AbortController()
  const { signal } = listeners
  function hide() {
    cursor.classList.remove('is-visible')
    root.classList.remove('has-cursor')
  }

  document.addEventListener('pointermove', (event) => {
    const target = event.target
    if (event.pointerType === 'touch' || !(target instanceof Element) || target.closest(':popover-open, input, textarea, select')) {
      hide()
      return
    }
    const label = target.closest<HTMLElement>('[data-cursor]')?.dataset.cursor
    if (label !== cursor.dataset.label) {
      if (label) cursor.dataset.label = label
      else delete cursor.dataset.label
    }
    cursor.style.transform = `translate3d(calc(${event.clientX}px - 50%), calc(${event.clientY}px - 50%), 0)`
    root.classList.add('has-cursor')
    cursor.classList.add('is-visible')
  }, { signal })

  root.addEventListener('pointerleave', hide, { signal })
  window.addEventListener('blur', hide, { signal })
  document.addEventListener('toggle', (event) => {
    if (event.target instanceof Element && event.target.matches(':popover-open')) hide()
  }, { capture: true, signal })
  cleanup = () => {
    listeners.abort()
    hide()
    cursor.remove()
    cleanup = undefined
  }
}

document.addEventListener('astro:before-swap', () => cleanup?.())
document.addEventListener('astro:page-load', update)
onMotionPreferencesChange(update)
