import { categories, levels } from '../data/season'

export function isDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false
  const parsed = new Date(date + 'T00:00:00Z')
  return Number.isFinite(+parsed) && parsed.toISOString().slice(0, 10) === date
}

export function categoryForBirthDate(date: string) {
  if (!isDate(date)) return
  const year = Number(date.slice(0, 4))
  return categories.find(({ first, last }) => year >= first && year <= last)
}

export type Days = 1 | 2 | 3
export type Period = 'monthly' | 'quarterly'

// Discounts apply successively to tuition; matrícula is charged once in the first period.
export function calculateFee(category: (typeof categories)[number], days: Days, member: boolean, sibling: boolean, period: Period) {
  const months = period === 'quarterly' ? 3 : 1
  const base = category.fees[days - 1] * 100 * months
  const memberDiscount = member ? Math.round(base * .15) : 0
  const siblingDiscount = sibling ? Math.round((base - memberDiscount) * .1) : 0
  const net = base - memberDiscount - siblingDiscount
  const quarterlyDiscount = months === 3 ? Math.round(net * .05) : 0
  const tuition = net - quarterlyDiscount
  const enrollment = 3000
  return { base, memberDiscount, siblingDiscount, quarterlyDiscount, tuition, enrollment, total: tuition + enrollment }
}

const currency = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })
export const money = (cents: number) => currency.format(cents / 100)

export function validIdentity(input: string) {
  const id = input.trim().toUpperCase()
  if (!/^(?:\d{8}|[XYZ]\d{7})[A-Z]$/.test(id)) return false
  const number = Number(id.slice(0, -1).replace(/^[XYZ]/, prefix => String('XYZ'.indexOf(prefix))))
  return 'TRWAGMYFPDXBNJZSQVHLCKE'[number % 23] === id.at(-1)
}

export const validPhone = (value: string) => /^(?:(?:\+|00)34)?[6789]\d{8}$/.test(value.replace(/[\s().-]/g, ''))
export const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())

export type Fields = Record<string, string>
export function validateStep(step: number, values: Fields): Fields {
  const errors: Fields = {}
  const required = (name: string, message: string) => {
    if (!values[name]?.trim()) errors[name] = message
  }
  if (step === 1) {
    if (!categoryForBirthDate(values.birth ?? '')) errors.birth = isDate(values.birth ?? '')
      ? 'Para otras edades, consulta la escuela de adultos o escribe a secretaría.'
      : 'Indica una fecha de nacimiento válida.'
    if (!levels.includes(values.level)) errors.level = 'Selecciona un nivel.'
    if (!['1', '2', '3'].includes(values.days)) errors.days = 'Indica los días de entrenamiento.'
  }
  if (step === 2) {
    required('name', 'Escribe el nombre.')
    required('surname', 'Escribe los apellidos.')
    required('hand', 'Indica la mano dominante.')
    required('experience', 'Indica la experiencia previa.')
    required('size', 'Selecciona la talla del polo.')
    if (values.identity?.trim() && !validIdentity(values.identity)) errors.identity = 'Comprueba el número y la letra del DNI o NIE.'
  }
  if (step === 3) {
    required('guardian', 'Escribe el nombre completo del tutor o tutora.')
    if (!validIdentity(values.guardianId ?? '')) errors.guardianId = 'Comprueba el número y la letra del DNI o NIE.'
    if (!validPhone(values.phone ?? '')) errors.phone = 'Introduce un teléfono español válido.'
    if (!validEmail(values.email ?? '')) errors.email = 'Introduce un correo electrónico válido.'
    if (values.member?.trim() && !/^\d{3,6}$/.test(values.member.trim())) errors.member = 'Escribe un número de socio de 3 a 6 cifras.'
    required('medical', 'Confirma la autorización médica.')
    required('image', 'Indica tu decisión sobre el uso de imágenes.')
    required('privacy', 'Confirma que has leído la información de protección de datos.')
  }
  return errors
}

export function hashSeed(seed: string) {
  let hash = 2166136261
  for (const character of seed.normalize('NFC').trim().toLowerCase()) {
    hash = Math.imul(hash ^ character.codePointAt(0)!, 16777619)
  }
  return hash >>> 0
}

function code(prefix: string, seed: string) {
  return prefix + (hashSeed(seed) % 36 ** 5).toString(36).padStart(5, '0').toUpperCase()
}
export const registrationCode = (seed: string) => code('CTM-26-', seed)
export const bookingCode = (seed: string) => code('CTM-R-', seed)
