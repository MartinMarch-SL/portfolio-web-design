import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { animate, inView, scroll } from 'motion'

if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  new Lenis({ autoRaf: true, anchors: true, duration: 1.3 })
  const ease = [0.22, 1, 0.36, 1] as const
  document.querySelectorAll('[data-title-line]').forEach((line, index) => {
    animate(line, { y: [16, 0] }, { duration: .9, delay: index * .12, ease })
  })
  inView('[data-reveal-image]', wrapper => {
    animate(wrapper.querySelector('img')!, { opacity: [.35, 1], scale: [.97, 1] }, { duration: 1, ease })
  })
  const process = document.querySelector<HTMLElement>('[data-process]')
  if (process) {
    const steps = process.querySelector<HTMLElement>('.steps')!
    scroll(progress => steps.style.setProperty('--line', String(progress)), {
      target: process, offset: ['start 0.85', 'end 0.55'],
    })
  }
}
