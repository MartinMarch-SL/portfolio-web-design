import { springValue } from 'motion'

const preview = document.querySelector<HTMLImageElement>('[data-floating-preview]')
const link = document.querySelector<HTMLAnchorElement>('a[data-preview]')
const hover = matchMedia('(hover: hover) and (pointer: fine) and (min-width: 701px)')
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')

if (preview && link?.dataset.preview) {
  const x = springValue<number>(0, { stiffness: 240, damping: 28 })
  const y = springValue<number>(0, { stiffness: 240, damping: 28 })
  let visible = false
  let navigating = false
  preview.src = link.dataset.preview

  function render() {
    if (!navigating) preview!.style.translate = `${x.get()}px ${y.get()}px`
  }

  x.on('change', render)
  y.on('change', render)

  link.addEventListener('pointermove', (event) => {
    if (!hover.matches || reducedMotion.matches || event.pointerType === 'touch' || navigating) return
    const width = preview.offsetWidth
    const height = preview.offsetHeight
    const left = Math.max(12, Math.min(event.clientX + 24, innerWidth - width - 12))
    const top = Math.max(12, Math.min(event.clientY - height / 2, innerHeight - height - 12))
    if (visible) {
      x.set(left)
      y.set(top)
    } else {
      x.jump(left)
      y.jump(top)
      render()
      visible = true
      preview.classList.add('is-visible')
    }
  })

  function hide() {
    if (navigating) return
    visible = false
    preview!.classList.remove('is-visible')
  }

  link.addEventListener('pointerleave', hide)
  hover.addEventListener('change', hide)
  reducedMotion.addEventListener('change', hide)

  link.addEventListener('click', async (event) => {
    if (reducedMotion.matches || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    const source = visible ? preview : link.querySelector<HTMLImageElement>('.inline-preview')
    if (!source || !source.offsetWidth || !source.complete || !source.naturalWidth || event.detail === 0) return
    event.preventDefault()
    if (navigating) return
    const { left, top, width, height } = source.getBoundingClientRect()
    navigating = true
    preview.classList.add('is-visible', 'is-expanding')
    preview.style.translate = 'none'
    const animation = preview.animate([
      { left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px` },
      { left: '0px', top: '0px', width: `${innerWidth}px`, height: `${innerHeight}px` },
    ], { duration: 480, easing: 'cubic-bezier(.2,.7,0,1)', fill: 'forwards' })
    await animation.finished.catch(() => undefined)
    location.assign(link.href)
  })

  window.addEventListener('pageshow', (event) => {
    if (!event.persisted) return
    navigating = false
    preview.getAnimations().forEach((animation) => animation.cancel())
    preview.classList.remove('is-expanding')
    hide()
  })
}
