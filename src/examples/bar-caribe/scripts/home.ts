import { dailyMenu, madridDay, weekday, weekdays } from '../lib/service'

const chalkboard = document.querySelector<HTMLElement>('[data-chalkboard]')!
const list = chalkboard.querySelector<HTMLOListElement>('[data-menu]')!
function updateMenu() {
  const day = madridDay()
  const menu = dailyMenu(day)
  chalkboard.querySelector('[data-weekday]')!.textContent = menu ? weekdays[weekday(day)] : 'Hoy cerrado, vuelva mañana'
  list.replaceChildren(...(menu ?? []).map(dish => {
    const item = document.createElement('li')
    item.textContent = dish
    return item
  }))
  list.hidden = !menu
  chalkboard.querySelector<HTMLElement>('[data-meal]')!.hidden = !menu
  chalkboard.querySelector<HTMLElement>('[data-menu-price]')!.hidden = !menu
}
updateMenu()
window.setInterval(updateMenu, 60_000)

const vitrina = document.querySelector<HTMLElement>('[data-vitrina]')!
const stage = vitrina.querySelector<HTMLElement>('.vitrina-sticky')!
const track = vitrina.querySelector<HTMLElement>('[data-vitrina-track]')!
const buttons = vitrina.querySelector<HTMLElement>('.rail-buttons')!
const back = buttons.querySelector<HTMLButtonElement>('[data-back]')!
const next = buttons.querySelector<HTMLButtonElement>('[data-next]')!
const reduced = matchMedia('(prefers-reduced-motion: reduce)')
const pinned = matchMedia('(prefers-reduced-motion: no-preference) and (hover: hover) and (min-width: 900px) and (min-height: 600px)')
let distance = 0
let frame = 0

function syncButtons() {
  back.disabled = track.scrollLeft <= 1
  next.disabled = track.scrollLeft >= distance - 1
}
function syncRail() {
  frame = 0
  if (pinned.matches) {
    const progress = -vitrina.getBoundingClientRect().top
    if (progress >= 0 && progress <= distance) track.scrollLeft = progress
  }
}
function measure() {
  distance = track.scrollWidth - track.clientWidth
  vitrina.style.setProperty('--rail-distance', distance + 'px')
  vitrina.style.setProperty('--rail-height', stage.offsetHeight + 'px')
  vitrina.toggleAttribute('data-scroll-rail', pinned.matches && distance > 0)
  buttons.hidden = distance <= 0
  syncButtons()
}
function advance(direction: number) {
  const behavior = reduced.matches ? 'instant' : 'smooth'
  const delta = track.clientWidth * .68 * direction
  if (pinned.matches) {
    const target = Math.max(0, Math.min(distance, track.scrollLeft + delta))
    window.scrollTo({ top: window.scrollY + vitrina.getBoundingClientRect().top + target, behavior })
  } else track.scrollBy({ left: delta, behavior })
}
back.addEventListener('click', () => advance(-1))
next.addEventListener('click', () => advance(1))
track.addEventListener('scroll', syncButtons, { passive: true })
window.addEventListener('scroll', () => {
  if (pinned.matches && !frame) frame = requestAnimationFrame(syncRail)
}, { passive: true })
pinned.addEventListener('change', measure)
new ResizeObserver(measure).observe(stage)
