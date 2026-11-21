import { animate, scroll } from 'motion'
import { onMotionPreferencesChange, prefersReducedMotion } from './motion-prefs'
import { scrollVelocity } from './smooth-scroll'

type Cleanup = () => void
let cleanup: Cleanup | undefined
const desktop = matchMedia('(min-width: 769px)')
const clamp = (value: number) => Math.max(0, Math.min(1, value))

function hero(section: HTMLElement, reduced: boolean): Cleanup {
  const stage = section.querySelector<HTMLElement>('[data-hero-stage]')!
  const word = section.querySelector<HTMLElement>('[data-wordmark]')!
  const title = word.parentElement!
  const photo = section.querySelector<HTMLElement>('[data-hero-photo]')!
  const metadata = section.querySelectorAll<HTMLElement>('[data-hero-meta]')
  const bottom = section.querySelector<HTMLElement>('.bottom')!
  const ease = (value: number) => value < .5 ? 4 * value ** 3 : 1 - (-2 * value + 2) ** 3 / 2
  const size = 100
  let referenceWidth = 0
  let wordHeight = 0
  let leftOffset = 0
  let pinProgressScale = 1
  let stageHeight = 0
  let bottomGap = 0
  let progress = 0
  let active = true

  function render() {
    if (reduced) return
    const reveal = ease(clamp(progress / .7))
    const move = ease(clamp((progress - .35) / .5))
    photo.style.clipPath = `inset(${50 * (1 - reveal)}%)`
    const travel = (stageHeight - wordHeight) / 2 - bottomGap
    word.style.transform = `translate(${-leftOffset * move}px, ${travel * move}px) scale(${1 - .78 * move})`
    metadata.forEach(line => { line.style.opacity = String(1 - move) })
  }

  function fit() {
    stageHeight = reduced ? title.parentElement!.clientHeight : stage.clientHeight
    bottomGap = parseFloat(getComputedStyle(bottom).bottom)
    const fontSize = Math.min(size * title.clientWidth / referenceWidth, stageHeight * .65)
    stage.style.setProperty('--wordmark-size', `${fontSize}px`)
    wordHeight = word.offsetHeight
    leftOffset = (title.clientWidth - word.offsetWidth) / 2
    pinProgressScale = section.clientHeight / Math.max(1, section.clientHeight - stageHeight)
    render()
  }

  function measure() {
    word.style.fontSize = `${size}px`
    referenceWidth = parseFloat(getComputedStyle(word).width)
    word.style.removeProperty('font-size')
    fit()
  }

  measure()
  void document.fonts.ready.then(() => { if (active) measure() })
  const observer = new ResizeObserver(fit)
  observer.observe(stage)
  const stop = reduced ? undefined : scroll(value => {
    progress = clamp(value * pinProgressScale)
    render()
  }, { target: section, offset: ['start start', 'end start'] })

  return () => {
    active = false
    observer.disconnect()
    stop?.()
    stage.style.removeProperty('--wordmark-size')
    word.style.removeProperty('transform')
    photo.style.removeProperty('clip-path')
    metadata.forEach(line => line.style.removeProperty('opacity'))
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
      photo.style.transform = `translateY(${(progress - .5) * speed}px)`
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
