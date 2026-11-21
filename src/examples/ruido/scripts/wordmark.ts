export function fitWordmark(word: HTMLElement, fill = 1) {
  const available = word.parentElement!.clientWidth
  if (word.offsetWidth) word.style.setProperty('--fit', String(available / word.offsetWidth * fill))
}

let observer: ResizeObserver | undefined
document.addEventListener('astro:page-load', () => {
  observer?.disconnect()
  observer = new ResizeObserver(entries => {
    for (const { target } of entries) {
      const word = target.matches('[data-wordmark]') ? target as HTMLElement : target.querySelector<HTMLElement>('[data-wordmark]')!
      fitWordmark(word)
    }
  })
  document.querySelectorAll<HTMLElement>('.ruido-footer [data-wordmark]').forEach(word => {
    fitWordmark(word)
    observer?.observe(word.parentElement!)
    observer?.observe(word)
  })
})
document.addEventListener('astro:before-swap', () => observer?.disconnect())
