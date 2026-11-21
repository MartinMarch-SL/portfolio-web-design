import { animate, scroll } from 'motion'
import { onMotionPreferencesChange, prefersReducedMotion } from './motion-prefs'
import { scrollVelocity } from './smooth-scroll'

type Cleanup = () => void
let cleanup: Cleanup | undefined
const desktop = matchMedia('(min-width: 769px)')
const clamp = (value: number) => Math.max(0, Math.min(1, value))

function hero(section: HTMLElement, reduced: boolean): Cleanup {
  const word = section.querySelector<HTMLElement>('[data-wordmark]')!
  const title = word.parentElement!
  const campaign = section.querySelector<HTMLElement>('[data-campaign]')!
  let progress = 0
  let fit = 1
  function render() {
    word.style.transform = `translateY(${-18 * progress}%) scale(${fit * (1 - .28 * progress)}, ${1 - .12 * progress})`
    word.style.opacity = String(1 - .22 * progress)
    campaign.style.transform = `translateY(${65 * (1 - progress)}%)`
  }
  function measure() {
    fit = title.clientWidth / (word.offsetWidth || title.clientWidth || 1)
    if (reduced) word.style.transform = `scaleX(${fit})`
    else render()
  }
  const observer = new ResizeObserver(measure)
  observer.observe(title)
  observer.observe(word)
  const stop = reduced ? undefined : scroll(value => {
    progress = value
    render()
  }, { target: section, offset: ['start 52px', 'start -260px'] })
  measure()
  return () => {
    observer.disconnect()
    stop?.()
    word.removeAttribute('style')
    campaign.removeAttribute('style')
  }
}

function ticker(track: HTMLElement): Cleanup {
  let frame = 0
  let lastTime = 0
  let lastY = window.scrollY
  let position = 0
  let direction = 1
  let speed = 34
  let visible = false
  const item = track.firstElementChild!
  let cycle = item.getBoundingClientRect().width
  const resize = new ResizeObserver(([entry]) => { cycle = entry.contentRect.width })
  resize.observe(item)
  function render(time: number) {
    const elapsed = Math.min(40, time - lastTime) || 16
    lastTime = time
    const velocity = scrollVelocity() ?? (window.scrollY - lastY) * 16 / elapsed
    lastY = window.scrollY
    if (Math.abs(velocity) > .05) direction = Math.sign(velocity)
    speed += (direction * (34 + Math.min(300, Math.abs(velocity) * 9)) - speed) * .22
    if (cycle > 0) {
      position = ((position + speed * elapsed / 1000) % cycle + cycle) % cycle
      track.style.transform = `translateX(${-position}px)`
    }
    if (visible) frame = requestAnimationFrame(render)
  }
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
    cancelAnimationFrame(frame)
    if (visible) {
      lastTime = performance.now()
      lastY = window.scrollY
      frame = requestAnimationFrame(render)
    }
  })
  observer.observe(track.parentElement!)
  return () => { observer.disconnect(); resize.disconnect(); cancelAnimationFrame(frame); track.style.removeProperty('transform') }
}

function rail(section: HTMLElement): Cleanup {
  const stage = section.querySelector<HTMLElement>('[data-rail-stage]')!
  const windowElement = section.querySelector<HTMLElement>('[data-rail-window]')!
  const track = section.querySelector<HTMLElement>('[data-rail-track]')!
  let travel = 0
  let stopScroll: Cleanup | undefined
  section.dataset.railActive = ''
  function measure() {
    travel = Math.max(0, track.offsetWidth - windowElement.clientWidth)
    section.style.setProperty('--stage-height', `${stage.offsetHeight}px`)
    section.style.setProperty('--travel', `${travel}px`)
    stopScroll?.()
    stopScroll = scroll(progress => {
      section.style.setProperty('--offset', `${-progress * travel}px`)
      section.style.setProperty('--progress', String(progress))
    }, { target: section, offset: ['start start', `${travel}px start`] })
  }
  const observer = new ResizeObserver(measure)
  observer.observe(stage)
  observer.observe(track)
  measure()
  return () => { observer.disconnect(); stopScroll?.(); delete section.dataset.railActive; section.removeAttribute('style') }
}

function manifesto(section: HTMLElement): Cleanup {
  const words = Array.from(section.querySelectorAll<HTMLElement>('[data-word]'))
  const applied = words.map(() => 1)
  // Motion batches scroll callbacks in its animation frame.
  const stop = scroll(progress => {
    const position = progress * (words.length + 3)
    words.forEach((word, index) => {
      const opacity = .15 + .85 * clamp((position - index) / 3)
      if (Math.abs(opacity - applied[index]) <= .02) return
      word.style.opacity = String(opacity)
      applied[index] = opacity
    })
  }, { target: section, offset: ['start 85%', 'end 65%'] })
  return () => { stop(); words.forEach(word => word.style.removeProperty('opacity')) }
}

function lookbook(section: HTMLElement): Cleanup {
  const restores = Array.from(section.querySelectorAll<HTMLElement>('[data-parallax]'), photo => {
    const speed = Number(photo.dataset.parallax)
    const stop = scroll(progress => {
      photo.style.transform = `translateY(${(progress - .5) * speed}px) scale(1.15)`
    }, { target: photo.closest('figure')!, offset: ['start end', 'end start'] })
    return () => { stop(); photo.removeAttribute('style') }
  })
  return () => restores.forEach(restore => restore())
}

function workshop(stats: HTMLElement): Cleanup {
  const numbers = Array.from(stats.querySelectorAll<HTMLElement>('[data-count]'))
  let controls: ReturnType<typeof animate> | undefined
  const observer = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return
    observer.disconnect()
    controls = animate(0, 1, {
      duration: .95, ease: 'easeOut',
      onUpdate: progress => numbers.forEach(number => {
        number.textContent = String(Math.round(progress * Number(number.dataset.count)))
      }),
    })
  }, { threshold: .4 })
  observer.observe(stats)
  return () => { observer.disconnect(); controls?.stop(); numbers.forEach(number => { number.textContent = number.dataset.count! }) }
}

function update() {
  cleanup?.()
  cleanup = undefined
  const home = document.querySelector('.ruido-home')
  if (!home) return
  const find = (selector: string) => home.querySelector<HTMLElement>(selector)!
  const listeners = new AbortController()
  const { signal } = listeners
  const form = home.querySelector<HTMLFormElement>('[data-newsletter-form]')!
  form.addEventListener('submit', event => {
    event.preventDefault()
    form.hidden = true
    const status = find('[data-section="newsletter"] [role="status"]')
    status.textContent = 'Apuntado. Nos vemos en la próxima tirada.'
    status.focus()
  }, { signal })

  const reduced = prefersReducedMotion()
  const restores = [hero(find('[data-section="hero"]'), reduced)]
  if (!reduced) {
    restores.push(ticker(find('[data-ticker-track]')), manifesto(find('[data-section="manifesto"]')),
      lookbook(find('[data-section="lookbook"]')), workshop(find('[data-workshop-stats]')))
    if (desktop.matches) restores.push(rail(find('[data-section="drop"]')))
  }
  cleanup = () => { listeners.abort(); restores.forEach(restore => restore()) }
}

document.addEventListener('astro:page-load', update)
document.addEventListener('astro:before-swap', () => { cleanup?.(); cleanup = undefined })
desktop.addEventListener('change', update)
onMotionPreferencesChange(update)
