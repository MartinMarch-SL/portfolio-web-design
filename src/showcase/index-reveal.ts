const projects = document.querySelector('.projects')
projects?.classList.add('is-revealing')
projects?.lastElementChild?.addEventListener('animationend', () => {
  projects.classList.remove('is-revealing')
}, { once: true })

const clock = document.querySelector<HTMLTimeElement>('[data-madrid-clock]')
const madridTime = new Intl.DateTimeFormat('es-ES', {
  timeZone: 'Europe/Madrid',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

function updateClock() {
  if (clock) {
    clock.textContent = madridTime.format()
    clock.dateTime = clock.textContent
  }
}

updateClock()
window.setInterval(updateClock, 1000)
