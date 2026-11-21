export const timeZone = 'Europe/Madrid'
export const modes = ['Presencial', 'Online', 'Llamada gratuita'] as const
export type Mode = typeof modes[number]

const dateFormat = new Intl.DateTimeFormat('en-CA', { timeZone, dateStyle: 'short' })
const offsetFormat = new Intl.DateTimeFormat('en', { timeZone, timeZoneName: 'longOffset' })

export function dateKey(now: Date) {
  return dateFormat.format(now)
}

export function addDays(day: string, count: number) {
  const date = new Date(day + 'T12:00:00Z')
  date.setUTCDate(date.getUTCDate() + count)
  return date.toISOString().slice(0, 10)
}

export function monday(day: string) {
  const weekday = new Date(day + 'T12:00:00Z').getUTCDay()
  return addDays(day, -((weekday + 6) % 7))
}

export function slotsFor(day: string, now: Date, mode: Mode) {
  const noon = new Date(day + 'T12:00:00Z')
  const weekday = noon.getUTCDay()
  if (weekday === 0 || weekday === 6) return []
  const offset = offsetFormat.formatToParts(noon).find(part => part.type === 'timeZoneName')!.value.slice(3)
  const seed = Number(day.replaceAll('-', ''))
  const hours = weekday === 5 ? [9, 10, 11, 12, 13] : [9, 10, 11, 12, 13, 16, 17, 18, 19]
  return hours.flatMap(hour => {
    const label = String(hour).padStart(2, '0') + ':00'
    const start = new Date(day + 'T' + label + ':00' + offset)
    if (start.getTime() - now.getTime() < 86_400_000 || (seed + hour) % 4 === 0) return []
    const end = new Date(start.getTime() + (mode === 'Llamada gratuita' ? 15 : 50) * 60_000)
    return [{ start, end, label }]
  })
}
