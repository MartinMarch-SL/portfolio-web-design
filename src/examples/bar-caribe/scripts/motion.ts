import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { animate, inView } from 'motion'

const motion = matchMedia('(prefers-reduced-motion: no-preference)')
const hover = matchMedia('(hover: hover)')
let lenis: Lenis | undefined
let animations: ReturnType<typeof animate>[] = []
let stopWatching: (() => void) | undefined

function updateMotion() {
  lenis?.destroy()
  lenis = undefined
  stopWatching?.()
  animations.forEach(animation => animation.cancel())
  animations = []
  if (!motion.matches) return
  if (hover.matches) lenis = new Lenis({ autoRaf: true })
  stopWatching = inView('[data-reveal]', element => {
    animations.push(animate(element, { opacity: [.55, 1], y: [16, 0] }, { duration: .45 }))
  })
}
motion.addEventListener('change', updateMotion)
hover.addEventListener('change', updateMotion)
updateMotion()
