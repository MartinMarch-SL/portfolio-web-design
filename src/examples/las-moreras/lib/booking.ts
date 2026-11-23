import { bookingCode, hashSeed, isDate } from './registration'

export const surfaces = [
  { id: 'clay', name: 'Tierra batida', count: 8, member: 600, visitor: 1200 },
  { id: 'hard', name: 'Rápida', count: 3, member: 500, visitor: 1000 },
  { id: 'mini', name: 'Minitenis', count: 2, member: 300, visitor: 600 },
] as const
export const courts = surfaces.flatMap((surface, index) => Array.from({ length: surface.count }, (_, i) => ({
  id: [0, 8, 11][index] + i + 1, surface: surface.id, name: surface.name, member: surface.member, visitor: surface.visitor,
})))
export const hours = Array.from({ length: 14 }, (_, i) => 8 + i)
export const clock = (hour: number) => String(hour).padStart(2, '0') + ':00'

export type Slot = { date: string, court: number, hour: number }
export type Booking = Slot & { member: boolean, players: number, code: string }
export const maxBookings = 2
export const sameSlot = (a: Slot, b: Slot) => a.date === b.date && a.court === b.court && a.hour === b.hour

export function dateKey(date: Date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
}
export function week(start: Date) {
  return Array.from({ length: 7 }, (_, i) => dateKey(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)))
}
export function isActive(slot: Slot, now: Date) {
  return new Date(slot.date + 'T' + clock(slot.hour) + ':00').getTime() + 3600000 > +now
}
export function available(slot: Slot, bookings: readonly Slot[] = []) {
  if (!isDate(slot.date) || !courts.some(court => court.id === slot.court) || !hours.includes(slot.hour)) return false
  return hashSeed(`${slot.date}/${slot.court}/${slot.hour}`) % 10 >= 3 && !bookings.some(item => sameSlot(item, slot))
}
export function bookingPrice(courtId: number, hour: number, member: boolean) {
  const court = courts.find(item => item.id === courtId)
  if (!court || !hours.includes(hour)) return
  const base = member ? court.member : court.visitor
  const lights = hour >= 19 ? 400 : 0
  return { base, lights, total: base + lights }
}
export function makeBooking(slot: Slot, member: boolean, players: number, bookings: readonly Booking[], now: Date) {
  if (bookings.filter(item => isActive(item, now)).length >= maxBookings ||
      !available(slot, bookings) || !week(now).includes(slot.date) || !isActive(slot, now) ||
      !Number.isInteger(players) || players < 1 || players > 4) return
  return { ...slot, member, players, code: bookingCode(`${slot.date}/${slot.court}/${slot.hour}`) }
}

export function calendarFile(booking: Booking, now = new Date()) {
  const day = booking.date.replaceAll('-', '')
  const time = (hour: number) => clock(hour).replace(':', '') + '00'
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//CT Las Moreras//Reservas//ES', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
    `UID:${booking.code}@ctlasmoreras.example`, 'DTSTAMP:' + now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z'),
    `DTSTART:${day}T${time(booking.hour)}`, `DTEND:${day}T${time(booking.hour + 1)}`,
    `SUMMARY:CT Las Moreras - Pista ${booking.court}`, `DESCRIPTION:Reserva de demostración. Localizador ${booking.code}`,
    'END:VEVENT', 'END:VCALENDAR', '',
  ].join('\r\n')
}
