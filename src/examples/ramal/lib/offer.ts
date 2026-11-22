import { disciplines, sectors, type Discipline, type Sector } from '../data/company'

export const phases = ['Licitación', 'Adjudicada', 'En obra']
export const deadlines = ['5 días laborables', '10 días laborables', '15 días laborables', 'A convenir']
export const maxArea = 1_000_000
const decimal = new Intl.NumberFormat('es-ES', { useGrouping: 'always' })
export const number = (value: number) => decimal.format(value)
export const fileSize = (bytes: number) => bytes < 1024 ? `${bytes} B` : `${number(Math.round(bytes / 102.4) / 10)} KiB`

export function validTaxId(value: string) {
  const id = value.trim().toUpperCase().replace(/[ -]/g, '')
  if (/^\d{8}[A-Z]$/.test(id)) {
    return 'TRWAGMYFPDXBNJZSQVHLCKE'[Number(id.slice(0, 8)) % 23] === id[8]
  }
  if (!/^[ABCDEFGHJNPQRSUVW]\d{7}[0-9A-J]$/.test(id)) return false
  const sum = [...id.slice(1, 8)].reduce((total, digit, index) => {
    const n = Number(digit) * (index % 2 === 0 ? 2 : 1)
    return total + (n > 9 ? n - 9 : n)
  }, 0)
  const digit = (10 - sum % 10) % 10
  const letter = 'JABCDEFGHI'[digit]
  return (!'PQRSW'.includes(id[0]) && id[8] === String(digit)) ||
    (!'ABEH'.includes(id[0]) && id[8] === letter)
}

export function validPhone(value: string) {
  if (!/^\+?[\d\s().-]+$/.test(value.trim())) return false
  const phone = value.replace(/[\s().-]/g, '').replace(/^00/, '+')
  return /^(?:\+34)?[6789]\d{8}$/.test(phone) ||
    (/^\+[1-9]\d{7,14}$/.test(phone) && !phone.startsWith('+34'))
}

export function validEmail(value: string) {
  return /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i.test(value.trim())
}

export function reference(seed: string) {
  let hash = 2166136261
  for (const character of seed) hash = Math.imul(hash ^ character.codePointAt(0)!, 16777619)
  return 'RML-OF-26-' + ((hash >>> 0) % 36 ** 4).toString(36).toUpperCase().padStart(4, '0')
}

const sectorFactor: Record<Sector, number> = { logistica: .85, sanitario: 1.6, oficinas: 1, hotelero: 1.25, comercial: 1.1 }
const disciplineWeight: Record<Discipline, number> = {
  electricidad: 1.15, clima: 1.25, pci: .85, fontaneria: .9, fotovoltaica: .7, control: .55,
}

export function estimate(area: number, sector: string, selected: readonly string[]) {
  const weight = disciplines.reduce((sum, { id }) => sum + (selected.includes(id) ? disciplineWeight[id] : 0), 0)
  if (!(area >= 1 && area <= maxArea) || !Object.hasOwn(sectors, sector) || !weight) return null
  const workload = (area / 1000) * sectorFactor[sector as Sector] * weight
  const crew = Math.max(2, Math.ceil(Math.sqrt(workload) * 1.6 + weight))
  const minWeeks = Math.max(2, Math.ceil(1.5 + workload * 3 / crew))
  return { minWeeks, maxWeeks: Math.ceil(minWeeks * 1.3), crew }
}

export function validateStep(step: number, values: Record<string, string>, selected: readonly string[]) {
  const errors: Record<string, string> = {}
  if (step === 1) {
    if (!Object.hasOwn(sectors, values.sector)) errors.sector = 'Selecciona el tipo de obra.'
    if (!values.location?.trim()) errors.location = 'Indica la ubicación.'
    const area = Number(values.area)
    if (!(area >= 1 && area <= maxArea)) errors.area = 'Indica una superficie entre 1 y 1.000.000 m².'
    if (!disciplines.some(({ id }) => selected.includes(id))) errors.disciplines = 'Selecciona al menos una disciplina.'
    if (!phases.includes(values.phase)) errors.phase = 'Selecciona la fase de la obra.'
  }
  if (step === 3) {
    if (!values.company?.trim()) errors.company = 'Indica la razón social.'
    if (!validTaxId(values.taxId ?? '')) errors.taxId = 'Introduce un CIF o NIF válido.'
    if (!values.person?.trim()) errors.person = 'Indica la persona de contacto.'
    if (!values.role?.trim()) errors.role = 'Indica su cargo.'
    if (!validEmail(values.email ?? '')) errors.email = 'Introduce un correo válido.'
    if (!validPhone(values.phone ?? '')) errors.phone = 'Introduce un teléfono válido.'
    if (!deadlines.includes(values.deadline)) errors.deadline = 'Selecciona el plazo de respuesta.'
  }
  return errors
}
