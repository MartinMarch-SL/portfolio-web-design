const hover = matchMedia('(hover: hover) and (pointer: fine)')
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
const width = 280
const height = 350

for (const link of document.querySelectorAll<HTMLAnchorElement>('a[data-preview]')) {
  const template = link.querySelector<HTMLTemplateElement>('[data-preview-image]')!
  let preview: HTMLImageElement | undefined
  let frame = 0
  let x = 0
  let y = 0

  link.addEventListener('pointermove', event => {
    if (!hover.matches || reducedMotion.matches || event.pointerType === 'touch') return
    x = event.clientX
    y = event.clientY
    if (frame) return

    frame = requestAnimationFrame(() => {
      frame = 0
      if (!preview) {
        preview = template.content.querySelector('img')!.cloneNode() as HTMLImageElement
        document.body.append(preview)
        preview.addEventListener('load', () => {
          if (link.matches(':hover') && hover.matches && !reducedMotion.matches) preview?.classList.add('is-visible')
        }, { once: true })
      }
      const left = Math.max(12, Math.min(x + 24, innerWidth - width - 12))
      const top = Math.max(12, Math.min(y - height / 2, innerHeight - height - 12))
      preview.style.transform = `translate3d(${left}px, ${top}px, 0)`
      if (preview.complete && preview.naturalWidth) preview.classList.add('is-visible')
    })
  })

  function hide() {
    cancelAnimationFrame(frame)
    frame = 0
    preview?.classList.remove('is-visible')
  }

  link.addEventListener('pointerleave', hide)
  hover.addEventListener('change', hide)
  reducedMotion.addEventListener('change', hide)
  window.addEventListener('blur', hide)
}
