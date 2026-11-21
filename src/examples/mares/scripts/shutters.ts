export function initShutters(body: HTMLElement, signal: AbortSignal) {
  const panels = [...body.querySelectorAll<HTMLElement>('[data-reveal]')]
  if (!panels.length || !('IntersectionObserver' in window)) return

  const groups = new Map<Element, HTMLElement[]>()
  const pending = new Set(panels)
  const inView = new Map<HTMLElement, number>()

  function open(panel: HTMLElement, immediately = false) {
    if (!pending.delete(panel)) return
    clearTimeout(inView.get(panel))
    inView.delete(panel)
    safety.unobserve(panel)
    if (immediately) panel.classList.remove('armed')
    else panel.classList.add('open')
  }

  // Lenis scrolls the document. The sticky cards share the stack's viewport entry.
  const reveal = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const { target, isIntersecting, intersectionRatio } = entry
      if (!isIntersecting || (!target.hasAttribute('data-reveal-stack') && intersectionRatio < .15)) continue
      reveal.unobserve(target)
      groups.get(target)?.forEach(panel => open(panel))
      groups.delete(target)
    }
  }, { root: null, rootMargin: '0px 0px 24px 0px', threshold: [0, .15] })

  const safety = new IntersectionObserver(entries => {
    for (const { target, isIntersecting } of entries) {
      const panel = target as HTMLElement
      if (!pending.has(panel)) continue
      if (isIntersecting && !inView.has(panel)) {
        inView.set(panel, window.setTimeout(() => open(panel, true), 1200))
      } else if (!isIntersecting) {
        clearTimeout(inView.get(panel))
        inView.delete(panel)
      }
    }
  }, { root: null, threshold: 0 })

  for (const panel of panels) {
    const target = panel.closest('[data-reveal-stack]') ?? panel
    const group = groups.get(target) ?? []
    group.push(panel)
    groups.set(target, group)
    panel.classList.add('armed')
    safety.observe(panel)
  }
  groups.forEach((_, target) => reveal.observe(target))

  const pageLoadSafety = window.setTimeout(() => {
    inView.forEach((_, panel) => open(panel, true))
  }, 2500)

  signal.addEventListener('abort', () => {
    reveal.disconnect()
    safety.disconnect()
    clearTimeout(pageLoadSafety)
    inView.forEach(timer => clearTimeout(timer))
    panels.forEach(panel => panel.classList.remove('armed', 'open'))
  }, { once: true })
}
