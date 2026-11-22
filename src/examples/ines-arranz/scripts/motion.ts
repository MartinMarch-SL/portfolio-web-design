import { scroll } from 'motion'

const reduced = matchMedia('(prefers-reduced-motion: reduce)')
const pointer = matchMedia('(min-width: 901px) and (hover: hover) and (pointer: fine)')

function changeSlide(slides: HTMLElement[], index: number) {
  slides.forEach((slide, position) => {
    slide.classList.toggle('active', position === index)
    slide.setAttribute('aria-hidden', String(position !== index))
  })
}

function startMotion() {
  if (reduced.matches) return
  const cleanups: Array<() => void> = []

  for (const cycle of document.querySelectorAll<HTMLElement>('[data-cycle]')) {
    const stack = cycle.classList.contains('stack') ? cycle : cycle.querySelector('.stack')!
    const slides = Array.from(stack.children) as HTMLElement[]
    let index = 0
    let elapsed = 0
    cycle.classList.add('cycling')
    const timer = window.setInterval(() => {
      if (document.hidden || cycle.matches(':hover, :focus-within')) return
      elapsed += 250
      if (elapsed < 7500) return
      elapsed = 0
      index = (index + 1) % slides.length
      changeSlide(slides, index)
    }, 250)
    cleanups.push(() => {
      clearInterval(timer)
      cycle.classList.remove('cycling')
      changeSlide(slides, 0)
    })
  }

  const session = document.querySelector<HTMLElement>('[data-session]')
  if (session) {
    const dial = session.querySelector<HTMLElement>('.dial-ring')!
    const moments = Array.from(session.querySelectorAll<HTMLElement>('.moments li'))
    const marks = moments.map(moment => Number(moment.dataset.minute))
    let active = -1
    changeSlide(moments, 0)
    session.classList.add('enhanced')
    const stop = scroll(progress => {
      dial.style.setProperty('--turn', `${-progress * 300}deg`)
      const current = marks.findLastIndex(mark => mark <= progress * 50)
      if (current !== active) {
        active = current
        changeSlide(moments, current)
      }
    }, { target: session, offset: ['start start', 'end end'] })
    cleanups.push(() => {
      stop()
      session.classList.remove('enhanced')
      dial.style.removeProperty('--turn')
      moments.forEach(moment => moment.removeAttribute('aria-hidden'))
    })
  }

  for (const image of document.querySelectorAll<HTMLElement>('[data-parallax]')) {
    const stop = scroll(progress => {
      image.style.transform = 'translateY(' + (progress - .5) * 9 + '%)'
    }, { target: image.parentElement!, offset: ['start end', 'end start'] })
    cleanups.push(() => {
      stop()
      image.style.removeProperty('transform')
    })
  }

  for (const portrait of document.querySelectorAll<HTMLElement>('[data-layered]')) {
    const stop = scroll(progress => {
      portrait.style.setProperty('--portrait-offset', `${(progress - .5) * 6}%`)
      portrait.style.setProperty('--light-offset', `${(.5 - progress) * 13}%`)
    }, { target: portrait, offset: ['start end', 'end start'] })
    cleanups.push(() => {
      stop()
      portrait.style.removeProperty('--portrait-offset')
      portrait.style.removeProperty('--light-offset')
    })
  }

  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue
      entry.target.classList.add('reveal-ready')
      observer.unobserve(entry.target)
    }
  }, { threshold: .2 })
  document.querySelectorAll('[data-parallax] [data-reveal-image]').forEach(image => observer.observe(image))
  cleanups.push(() => observer.disconnect())
  return () => cleanups.forEach(cleanup => cleanup())
}

let stopMotion = startMotion()
reduced.addEventListener('change', () => {
  stopMotion?.()
  stopMotion = startMotion()
})

const index = document.querySelector('[data-post-list]')
if (index) {
  const preview = document.createElement('div')
  preview.className = 'cover-preview'
  preview.setAttribute('aria-hidden', 'true')
  const image = document.createElement('img')
  image.alt = ''
  preview.append(image)
  document.body.append(preview)

  let frame = 0
  let x = 0
  let y = 0
  let targetX = 0
  let targetY = 0

  function follow() {
    x += (targetX - x) * .16
    y += (targetY - y) * .16
    preview.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)'
    frame = Math.abs(targetX - x) + Math.abs(targetY - y) > .2 ? requestAnimationFrame(follow) : 0
  }

  index.addEventListener('pointermove', event => {
    const { target, clientX, clientY } = event as PointerEvent
    if (reduced.matches || !pointer.matches || !(target instanceof Element)) return
    const cover = target.closest('.essay-row')?.querySelector<HTMLImageElement>('.essay-cover img')
    if (!cover) return
    targetX = Math.max(8, Math.min(clientX + 25, innerWidth - 236))
    targetY = Math.max(8, Math.min(clientY - 75, innerHeight - 155))
    if (image.src !== cover.src) image.src = cover.src
    if (!preview.classList.contains('active')) {
      x = targetX
      y = targetY
      preview.classList.add('active')
    }
    if (!frame) frame = requestAnimationFrame(follow)
  })
  function hideCover() {
    preview.classList.remove('active')
    cancelAnimationFrame(frame)
    frame = 0
  }
  index.addEventListener('pointerleave', hideCover)
  reduced.addEventListener('change', hideCover)
  pointer.addEventListener('change', hideCover)
}
