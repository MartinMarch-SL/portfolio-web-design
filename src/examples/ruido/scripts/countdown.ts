import { prefersReducedMotion } from './motion-prefs'

const madrid = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Madrid', year: 'numeric', month: 'numeric', day: 'numeric',
  hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23',
})

function madridClock(time: number) {
  const parts = Object.fromEntries(madrid.formatToParts(time).map(({ type, value }) => [type, Number(value)]))
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second)
}

function nextFriday(now: number) {
  const local = new Date(madridClock(now))
  const days = (5 - local.getUTCDay() + 7) % 7
  local.setUTCHours(18, 0, 0, 0)
  if (days === 0 && local.getTime() < madridClock(now)) local.setUTCDate(local.getUTCDate() + 7)
  local.setUTCDate(local.getUTCDate() + days)
  const wallTime = local.getTime()
  // Madrid's Friday evening is outside the DST changeover. Resolve the offset at the target date.
  return wallTime - (madridClock(wallTime) - wallTime)
}

let timer: number | undefined
function start() {
  window.clearInterval(timer)
  const digits = document.querySelectorAll<HTMLElement>('[data-digit]')
  const clock = document.querySelector<HTMLElement>('[data-section="countdown"] [role="timer"]')
  if (!clock || digits.length !== 8) return
  let target = nextFriday(Date.now())
  let previous = ''
  function tick() {
    const now = Date.now()
    if (now >= target) target = nextFriday(now + 1000)
    const seconds = Math.ceil((target - now) / 1000)
    const units = [Math.floor(seconds / 86400), Math.floor(seconds / 3600) % 24, Math.floor(seconds / 60) % 60, seconds % 60]
    const value = units.map(unit => String(unit).padStart(2, '0')).join('')
    if (value === previous) return
    clock!.setAttribute('aria-label', `${units[0]} días, ${units[1]} horas, ${units[2]} minutos, ${units[3]} segundos`)
    digits.forEach((digit, index) => {
      if (value[index] === previous[index]) return
      const old = digit.lastElementChild!
      const next = document.createElement('span')
      next.textContent = value[index]
      digit.replaceChildren(next)
      if (!previous || prefersReducedMotion()) return
      digit.prepend(old)
      const options = { duration: 340, easing: 'cubic-bezier(.2,.7,0,1)' }
      old.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-105%)' }], { ...options, fill: 'forwards' }).onfinish = () => old.remove()
      next.animate([{ transform: 'translateY(105%)' }, { transform: 'translateY(0)' }], options)
    })
    previous = value
  }
  tick()
  timer = window.setInterval(tick, 125)
}
document.addEventListener('astro:page-load', start)
document.addEventListener('astro:before-swap', () => window.clearInterval(timer))
