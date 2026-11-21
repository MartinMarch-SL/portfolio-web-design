const reducedMotionQuery = '(prefers-reduced-motion: reduce)'
const hoverQuery = '(hover: hover) and (pointer: fine)'

export function prefersReducedMotion(): boolean {
  return typeof matchMedia !== 'undefined' && matchMedia(reducedMotionQuery).matches
}

export function canHover(): boolean {
  return typeof matchMedia !== 'undefined' && matchMedia(hoverQuery).matches
}

export function onMotionPreferencesChange(update: () => void): void {
  matchMedia(reducedMotionQuery).addEventListener('change', update)
  matchMedia(hoverQuery).addEventListener('change', update)
}
