export function validateBooking(details: { name: string; email: string; phone: string; privacy: boolean }) {
  const phone = details.phone.trim().replace(/[\s.-]/g, '')
  return {
    name: details.name.trim() ? '' : 'Escribe tu nombre.',
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email.trim()) ? '' : 'Introduce un correo válido.',
    phone: /^(?:(?:\+34|0034))?[6789]\d{8}$/.test(phone) ? '' : 'Introduce un teléfono español válido.',
    privacy: details.privacy ? '' : 'Acepta la política de privacidad para continuar.',
  }
}

function calendarDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
}

export function calendarFile(start: Date, end: Date, now = new Date()) {
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Consulta IA//Agenda//ES', 'BEGIN:VEVENT',
    'UID:' + calendarDate(start) + '@ines-arranz.example',
    'DTSTAMP:' + calendarDate(now), 'DTSTART:' + calendarDate(start), 'DTEND:' + calendarDate(end),
    'SUMMARY:Reserva de demostración · Consulta de psicología',
    'END:VEVENT', 'END:VCALENDAR', '',
  ].join('\r\n')
}
