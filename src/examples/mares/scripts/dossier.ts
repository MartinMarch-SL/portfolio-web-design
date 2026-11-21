import { palmaSun, roomIsLit } from '../lib/solar'

interface Scope { signal: AbortSignal; reduce: boolean }
const ease = 'cubic-bezier(.22,.72,.18,1)'

function rollDigits(container: HTMLElement) {
  const value = container.getAttribute('aria-label') ?? container.textContent ?? ''
  container.setAttribute('aria-label', value)
  const visual = document.createElement('span')
  visual.setAttribute('aria-hidden', 'true')
  Array.from(value).forEach((character, index) => {
    if (!/^[0-9]$/.test(character)) {
      visual.append(character)
      return
    }
    const window = document.createElement('span')
    window.className = 'digit-window'
    const column = document.createElement('span')
    column.className = 'digit-column'
    const start = (Number(character) + 7) % 10
    for (let step = 0; step < 4; step++) {
      const digit = document.createElement('span')
      digit.textContent = String((start + step) % 10)
      column.append(digit)
    }
    window.append(column)
    visual.append(window)
    column.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-75%)' }], {
      duration: 720, delay: index * 32, easing: ease, fill: 'forwards',
    })
  })
  container.replaceChildren(visual)
}

export function initCarousel(root: HTMLElement, { signal, reduce }: Scope) {
  const slides = [...root.querySelectorAll<HTMLElement>('[data-slide]')]
  const captions = [...root.querySelectorAll<HTMLElement>('[data-caption]')]
  const progress = root.querySelector<HTMLElement>('[data-progress]')!
  const pause = root.querySelector<HTMLButtonElement>('[data-hero-pause]')!
  const block = root.querySelector<HTMLElement>('[data-title-block]')!
  const interval = 8500
  const clock = progress.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: interval, fill: 'both' })
  let current = Math.max(0, slides.findIndex(slide => slide.hasAttribute('data-active')))
  let paused = reduce || pause.dataset.paused === 'true'

  if (reduce) {
    for (const field of root.querySelectorAll<HTMLElement>('[data-digits][aria-label]')) {
      field.textContent = field.getAttribute('aria-label')
      field.removeAttribute('aria-label')
    }
  }

  function syncClock() {
    const stopped = paused || document.hidden || block.contains(document.activeElement)
    if (stopped) clock.pause()
    else clock.play()
  }

  function select(index: number) {
    current = (index + slides.length) % slides.length
    slides.forEach((slide, i) => {
      slide.toggleAttribute('data-active', i === current)
      slide.setAttribute('aria-hidden', String(i !== current))
    })
    captions.forEach((caption, i) => { caption.hidden = i !== current })
    if (!reduce) captions[current].querySelectorAll<HTMLElement>('[data-digits]').forEach(rollDigits)
    clock.currentTime = 0
    syncClock()
  }

  function syncPause() {
    pause.textContent = paused ? 'Reanudar' : 'Pausar'
    block.setAttribute('aria-live', paused ? 'polite' : 'off')
    syncClock()
  }

  clock.onfinish = () => select(current + 1)
  signal.addEventListener('abort', () => { clock.onfinish = null; clock.cancel() }, { once: true })
  document.addEventListener('visibilitychange', syncClock, { signal })
  block.addEventListener('focusin', syncClock, { signal })
  block.addEventListener('focusout', () => queueMicrotask(() => { if (!signal.aborted) syncClock() }), { signal })
  root.querySelector('[data-hero-prev]')!.addEventListener('click', () => select(current - 1), { signal })
  root.querySelector('[data-hero-next]')!.addEventListener('click', () => select(current + 1), { signal })
  pause.addEventListener('click', () => {
    paused = !paused
    pause.dataset.paused = String(paused)
    syncPause()
  }, { signal })
  syncPause()
}

export function initIndex(root: HTMLElement, { signal, reduce }: Scope) {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return
  const preview = root.querySelector<HTMLElement>('.cursor-photo')!
  const image = preview.querySelector('img')!
  let frame = 0
  let x = 0, y = 0, targetX = 0, targetY = 0, tilt = 0
  function draw() {
    x += (targetX - x) * .13
    y += (targetY - y) * .13
    tilt += (Math.max(-5, Math.min(5, (targetX - x) * .12)) - tilt) * .12
    preview.style.transform = `translate3d(${x}px,${y}px,0) rotate(${tilt - 3}deg)`
    frame = requestAnimationFrame(draw)
  }
  function move(event: PointerEvent) {
    if (event.pointerType !== 'mouse') return
    const width = preview.offsetWidth
    const height = preview.offsetHeight
    targetX = Math.max(16, Math.min(innerWidth - width - 16, event.clientX + 38))
    targetY = Math.max(16, Math.min(innerHeight - height - 16, event.clientY - height / 2))
    if (reduce) {
      preview.style.transform = `translate(${targetX}px,${targetY}px)`
    } else if (!frame) {
      x = targetX
      y = targetY
      draw()
    }
  }
  function hide() {
    preview.removeAttribute('data-visible')
    cancelAnimationFrame(frame)
    frame = 0
  }
  root.querySelectorAll<HTMLElement>('[data-index-row]').forEach(row => {
    row.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'mouse') return
      image.src = row.dataset.preview!
      move(event)
      preview.setAttribute('data-visible', '')
    }, { signal })
    row.addEventListener('pointermove', move, { signal })
    row.addEventListener('pointerleave', hide, { signal })
  })
  signal.addEventListener('abort', hide, { once: true })
}

export function initLivePlan(root: HTMLElement, signal: AbortSignal) {
  const rooms = [...root.querySelectorAll<SVGGElement>('[data-room]')]
  const photos = [...root.querySelectorAll<HTMLElement>('[data-room-image]')]
  const info = root.querySelector<HTMLElement>('[data-room-info]')!
  function select(room: SVGGElement) {
    rooms.forEach(item => {
      item.toggleAttribute('data-selected', item === room)
      item.querySelector('button')!.setAttribute('aria-pressed', String(item === room))
    })
    const { name, area, orientation, photo } = room.dataset
    info.textContent = `${name} / ${area} m² / Fachada ${orientation}°`
    photos.forEach(image => {
      const active = image.dataset.roomImage === photo
      image.toggleAttribute('data-active', active)
      image.setAttribute('aria-hidden', String(!active))
    })
    root.toggleAttribute('data-no-photo', !photo)
  }
  rooms.forEach(room => {
    room.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') select(room) }, { signal })
    room.addEventListener('focusin', () => select(room), { signal })
    room.addEventListener('click', () => select(room), { signal })
  })
}

const palmaDate = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Madrid', dateStyle: 'short' })
const dateLabel = new Intl.DateTimeFormat('es', { timeZone: 'UTC', dateStyle: 'long' })

export function initSolar(root: HTMLElement, signal: AbortSignal) {
  const hour = root.querySelector<HTMLInputElement>('input[type="range"]')!
  const time = root.querySelector<HTMLOutputElement>('[data-hour]')!
  const sun = root.querySelector<SVGCircleElement>('[data-sun]')!
  const shadow = root.querySelector<SVGGElement>('[data-shadow]')!
  const status = root.querySelector<HTMLElement>('[data-solar-status]')!
  const rooms = [...root.querySelectorAll<SVGGElement>('[data-room]')]
  const date = palmaDate.format(new Date())
  root.querySelector('[data-solar-date]')!.textContent = dateLabel.format(new Date(date + 'T12:00:00Z'))

  function update() {
    const value = hour.valueAsNumber
    const minutes = Math.round(value * 60)
    time.value = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
    hour.setAttribute('aria-valuetext', time.value)
    const position = palmaSun(date, value)
    const angle = Math.PI * (value - 7) / 14
    sun.style.transform = `translate(${100 - 100 * Math.cos(angle)}px,${-100 * Math.sin(angle)}px)`
    shadow.style.transform = `rotate(${position.azimuth + 180}deg)`
    root.toggleAttribute('data-daylight', position.altitude > 0)
    const lit = rooms.filter(room => {
      const active = roomIsLit(position, Number(room.dataset.orientation))
      room.toggleAttribute('data-lit', active)
      return active
    })
    status.textContent = position.altitude <= 0 ? 'Sol bajo el horizonte.' : lit.length
      ? `Fachadas con sol: ${lit.map(room => room.dataset.name).join(', ')}.`
      : 'Sin incidencia directa en las fachadas representadas.'
  }
  hour.addEventListener('input', update, { signal })
  update()
}
