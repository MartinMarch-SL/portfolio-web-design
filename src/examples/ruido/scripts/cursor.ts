import { canHover, onMotionPreferencesChange, prefersReducedMotion } from './motion-prefs'

let cleanup: (() => void) | undefined

function update() {
  cleanup?.()
  const cursor = document.querySelector<HTMLElement>('[data-ruido-cursor]')
  if (!cursor || !canHover() || prefersReducedMotion()) return

  const root = document.documentElement
  const listeners = new AbortController()
  const { signal } = listeners
  function hide() {
    cursor?.classList.remove('is-visible')
    root.classList.remove('has-cursor')
  }

  document.addEventListener('pointermove', (event) => {
    const target = event.target
    if (event.pointerType === 'touch' || !(target instanceof Element) || target.closest(':popover-open, input, textarea, select')) {
      hide()
      return
    }
    const label = target.closest<HTMLElement>('[data-cursor]')?.dataset.cursor
    if (label) cursor.dataset.label = label
    else delete cursor.dataset.label
    cursor.style.translate = `calc(${event.clientX}px - 50%) calc(${event.clientY}px - 50%)`
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
    cleanup = undefined
  }
}

document.addEventListener('astro:before-swap', () => cleanup?.())
document.addEventListener('astro:page-load', update)
onMotionPreferencesChange(update)
