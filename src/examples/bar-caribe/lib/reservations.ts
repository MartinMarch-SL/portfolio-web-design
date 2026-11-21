import { madridDay, weekday } from './service'

export const slots = [
  ...Array.from({ length: 7 }, (_, i) => 13 * 60 + i * 30),
  ...Array.from({ length: 8 }, (_, i) => 20 * 60 + i * 30),
].map(minutes => `${Math.floor(minutes / 60)}:${minutes % 60 ? '30' : '00'}`)

export type Reservation = { name: string; phone: string; date: string; time: string; guests: number }

export function validateReservation(value: Reservation, today = madridDay()) {
  const day = new Date(value.date + 'T12:00:00Z')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value.date) || !Number.isFinite(day.valueOf()) ||
      day.toISOString().slice(0, 10) !== value.date) return 'Elige un día válido.'
  if (value.date < today) return 'Elige un día a partir de hoy.'
  if (weekday(value.date) === 1) return 'Los lunes cerramos. Elige otro día.'
  if (!slots.includes(value.time)) return 'Elige una hora de cocina.'
  if (!Number.isInteger(value.guests) || value.guests < 1 || value.guests > 12) return 'Indica de 1 a 12 comensales.'
  if (value.guests > 8) return 'Para más de 8, llámanos.'
  if (!value.name.trim()) return 'Pon un nombre para la mesa.'
  if (!/^(?:(?:\+34|0034))?[6789]\d{8}$/.test(value.phone.replace(/[\s()-]/g, ''))) return 'Indica un teléfono español válido.'
  return null
}
