import Lenis from 'lenis'
import { canHover, onMotionPreferencesChange, prefersReducedMotion } from './motion-prefs'

let lenis: Lenis | undefined

function stop() {
  lenis?.destroy()
  lenis = undefined
}

function update() {
  stop()
  if (document.documentElement.classList.contains('ruido') && canHover() && !prefersReducedMotion()) {
    lenis = new Lenis({ autoRaf: true, syncTouch: false })
  }
}

document.addEventListener('astro:before-swap', stop)
document.addEventListener('astro:page-load', update)
onMotionPreferencesChange(update)
