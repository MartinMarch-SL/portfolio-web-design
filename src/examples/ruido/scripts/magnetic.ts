import { springValue } from 'motion'
import { canHover, onMotionPreferencesChange, prefersReducedMotion } from './motion-prefs'

let cleanup: (() => void) | undefined

function update() {
  cleanup?.()
  if (!canHover() || prefersReducedMotion()) return

  const listeners = new AbortController()
  const { signal } = listeners
  const restores = Array.from(document.querySelectorAll<HTMLElement>('[data-magnetic]'), (element) => {
    const x = springValue<number>(0, { stiffness: 340, damping: 26 })
    const y = springValue<number>(0, { stiffness: 340, damping: 26 })
    const previousTranslate = element.style.translate
    function render() {
      element.style.translate = `${x.get()}px ${y.get()}px`
    }
    const unsubscribeX = x.on('change', render)
    const unsubscribeY = y.on('change', render)

    element.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'touch') return
      const rect = element.getBoundingClientRect()
      x.set((event.clientX - rect.left + x.get() - rect.width / 2) * .2)
      y.set((event.clientY - rect.top + y.get() - rect.height / 2) * .2)
    }, { signal })
    element.addEventListener('pointerleave', () => {
      x.set(0)
      y.set(0)
    }, { signal })

    return () => {
      unsubscribeX()
      unsubscribeY()
      x.destroy()
      y.destroy()
      element.style.translate = previousTranslate
    }
  })

  cleanup = () => {
    listeners.abort()
    restores.forEach((restore) => restore())
    cleanup = undefined
  }
}

document.addEventListener('astro:before-swap', () => cleanup?.())
document.addEventListener('astro:page-load', update)
onMotionPreferencesChange(update)
