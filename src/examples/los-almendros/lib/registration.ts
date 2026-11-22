import { categories } from '../data/season'

export function categoryForBirthDate(date: string, female = false) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return
  const parsed = new Date(date + 'T00:00:00Z')
  if (Number.isNaN(+parsed) || parsed.toISOString().slice(0, 10) !== date) return
  const year = parsed.getUTCFullYear()
  const category = categories.find(({ first, last }) => year >= first && year <= last)
  if (!category) return
  const team = female && category.female ? category.teams.find(team => team.name.endsWith(' femenino'))! : category.teams[0]
  return { ...category, team, label: female && category.female ? team.name : category.name }
}

// All amounts are in cents. Any remainder is distributed across the first instalments.
export function calculateFee(annual: number, newPlayer: boolean, sibling: boolean, count: 1 | 3) {
  const base = Math.round(annual * 100)
  const discount = sibling ? Math.round(base / 10) : 0
  const enrollment = newPlayer ? 4000 : 0
  const total = base - discount + enrollment
  const instalments = Array.from({ length: count }, (_, index) => Math.floor(total / count) + Number(index < total % count))
  return { base, discount, enrollment, total, instalments }
}

export const money = (cents: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(cents / 100)

export function validIdentity(input: string) {
  const id = input.trim().toUpperCase()
  if (!/^(?:\d{8}|[XYZ]\d{7})[A-Z]$/.test(id)) return false
  const number = Number(id.slice(0, -1).replace(/^[XYZ]/, prefix => String('XYZ'.indexOf(prefix))))
  return 'TRWAGMYFPDXBNJZSQVHLCKE'[number % 23] === id.at(-1)
}

export type FormData = Record<string, string>
export function validateStep(step: number, values: FormData) {
  const errors: FormData = {}
  const required = (name: string, message: string) => {
    if (!values[name]?.trim()) errors[name] = message
  }
  if (step === 1) {
    if (!categoryForBirthDate(values.birth ?? '')) errors.birth = values.birth
      ? 'La fecha debe corresponder a un nacimiento entre 2008 y 2022. Si tienes dudas, escribe a secretaría.'
      : 'Indica la fecha de nacimiento completa.'
  }
  if (step === 2) {
    required('name', 'Escribe el nombre del jugador o jugadora.')
    required('surname', 'Escribe los apellidos.')
    required('school', 'Indica el centro educativo.')
    required('size', 'Selecciona una talla.')
    required('played', 'Indica si ha jugado antes.')
    required('member', 'Indica si ya ha estado inscrito en el club.')
    if (values.identity?.trim() && !validIdentity(values.identity)) errors.identity = 'Comprueba el número y la letra del DNI o NIE.'
  }
  if (step === 3) {
    required('guardian', 'Escribe el nombre y los apellidos de la persona tutora.')
    if (!/^(?:\+34)?[6789]\d{8}$/.test((values.phone ?? '').replace(/[\s()-]/g, ''))) errors.phone = 'Introduce un teléfono español válido.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email?.trim() ?? '')) errors.email = 'Introduce un correo electrónico válido.'
    required('medical', 'Confirma la autorización médica.')
    required('image', 'Indica tu decisión sobre el uso de imágenes.')
    required('privacy', 'Confirma que has leído la información de protección de datos.')
  }
  return errors
}

export function registrationCode(seed: string) {
  let hash = 2166136261
  for (const character of seed.normalize('NFC').trim().toLowerCase()) {
    hash = Math.imul(hash ^ character.codePointAt(0)!, 16777619)
  }
  return 'ALM-26-' + ((hash >>> 0) % 36 ** 5).toString(36).padStart(5, '0').toUpperCase()
}
