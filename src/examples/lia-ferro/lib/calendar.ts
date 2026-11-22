export const phases = [
  { day: 1, title: 'Primer día', text: 'Lávate las manos antes de tocar la zona. Sigue la indicación del estudio sobre cuándo retirar el apósito.' },
  { day: 3, title: 'Días 2 a 4', text: 'Limpia la zona con suavidad y sécala a toques. Usa ropa limpia y holgada.' },
  { day: 7, title: 'Primera semana', text: 'Deja que la piel se descame a su ritmo. Evita rascar, frotar o sumergir la zona.' },
  { day: 14, title: 'Segunda semana', text: 'Observa cómo evoluciona la piel. Mantén la zona protegida del sol y evita el roce si sigue sensible.' },
  { day: 30, title: 'Al mes', text: 'Cuando la piel esté cerrada, protege el tatuaje del sol. Si sigue sensible o tienes dudas, contacta con el estudio.' },
]

export function dateKey(date: Date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
}

export function addDays(date: Date, days: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function availability(today = new Date()) {
  return Array.from({ length: 56 }, (_, index) => {
    const date = addDays(today, index + 1)
    const key = dateKey(date)
    const seed = Number(key.replaceAll('-', ''))
    return { date, key, morning: date.getDay() !== 0 && seed % 4 !== 0, afternoon: date.getDay() !== 0 && seed % 5 !== 0 }
  })
}

export function healingCalendar(start: string, now = new Date()) {
  const date = new Date(start + 'T12:00:00Z')
  if (Number.isNaN(+date) || date.toISOString().slice(0, 10) !== start) throw new RangeError('Fecha inválida')
  const stamp = now.toISOString().replace(/[-:]|\.\d{3}/g, '')
  const escape = (value: string) => value.replaceAll('\\', '\\\\').replaceAll('\n', '\\n').replaceAll(',', '\\,').replaceAll(';', '\\;')
  const dayKey = (offset: number) => new Date(+date + offset * 86400000).toISOString().slice(0, 10).replaceAll('-', '')
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Lia Ferro//Cuidados//ES', 'CALSCALE:GREGORIAN']
  for (const phase of phases) {
    lines.push('BEGIN:VEVENT', `UID:${start}-${phase.day}@lia-ferro.demo`, `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${dayKey(phase.day - 1)}`, `DTEND;VALUE=DATE:${dayKey(phase.day)}`,
      `SUMMARY:Lía Ferro · Día ${phase.day} · ${phase.title}`, `DESCRIPTION:${escape(phase.text)}`,
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'TRIGGER:PT9H', `DESCRIPTION:${escape(phase.title)}`, 'END:VALARM', 'END:VEVENT')
  }
  lines.push('END:VCALENDAR', '')
  const encoder = new TextEncoder()
  return lines.map(line => {
    let folded = '', bytes = 0
    for (const character of line) {
      const length = encoder.encode(character).length
      if (bytes + length > 75) { folded += '\r\n '; bytes = 1 }
      folded += character
      bytes += length
    }
    return folded
  }).join('\r\n')
}
