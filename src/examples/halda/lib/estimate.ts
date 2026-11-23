import { sectors } from '../data/cases'

export const types = {
  inspection: 'Inspección', guiding: 'Guiado', measurement: 'Medición', reading: 'Lectura', hardware: 'Hardware',
}
export type Problem = keyof typeof types
export const demo = 'Demostración. Los datos se procesan en este navegador. No se envía ninguna solicitud ni se suben imágenes.'

const sensors = [[1280, 1024], [1920, 1200], [2448, 2048], [4096, 3000], [5472, 3648], [6464, 4852], [9344, 7000]]

export function optics(width: number, height: number, defect: number) {
  if (![width, height, defect].every(value => Number.isFinite(value) && value > 0)) return null
  const fov = [width * 1.15, height * 1.15]
  const pixelPitch = defect / 3
  const pixels = fov.map(size => Math.ceil(size / pixelPitch))
  if (![...fov, ...pixels].every(Number.isFinite)) return null
  const sensor = sensors.find(([x, y]) => x >= pixels[0] && y >= pixels[1])
  const aspect = sensor ? sensor[0] / sensor[1] : fov[0] / fov[1]
  const frame: [number, number] = [Math.max(fov[0], fov[1] * aspect), Math.max(fov[1], fov[0] / aspect)]
  // Objetivos de 16–35 mm y sensor de 11 mm de ancho, aproximación de lente delgada.
  const distance = [16, 35].map(focal => Math.round(focal * (1 + frame[0] / 11)))
  return { fov, frame, pixels, sensor, distance }
}

const baseWeeks: Record<Problem, number> = { inspection: 4, guiding: 5, measurement: 5, reading: 3, hardware: 6 }
export function estimate(type: Problem, complexity: 'standard' | 'high') {
  const weeks = baseWeeks[type] + (complexity === 'high' ? 2 : 0)
  return { weeks, phases: [
    { label: 'Muestras y criterios de aceptación', weeks: 1 },
    { label: 'Montaje óptico y ensayos', weeks: weeks - 2 },
    { label: 'Validación y plan de piloto', weeks: 1 },
  ] }
}

export function validate(step: number, fields: Record<string, string>) {
  const errors: Record<string, string> = {}
  if (step === 1) {
    if (!Object.hasOwn(types, fields.type)) errors.type = 'Selecciona el tipo de problema.'
    if (!sectors.some(sector => sector === fields.sector)) errors.sector = 'Selecciona un sector.'
    for (const field of ['rate', 'width', 'height', 'defect']) {
      if (!Number.isFinite(Number(fields[field])) || Number(fields[field]) <= 0) errors[field] = 'Introduce un valor mayor que cero.'
    }
    if (!errors.width && !errors.height && !errors.defect &&
      !optics(Number(fields.width), Number(fields.height), Number(fields.defect))) {
      errors.defect = 'Revisa la escala de las dimensiones y del defecto.'
    }
    if (!fields.environment) errors.environment = 'Indica las condiciones del puesto.'
  }
  if (step === 3) {
    if (!fields.person) errors.person = 'Indica tu nombre.'
    if (!fields.company) errors.company = 'Indica el nombre de la empresa.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email ?? '')) errors.email = 'Introduce un correo válido.'
  }
  return errors
}

export function reference(value: string) {
  let hash = 2166136261
  for (const character of value) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619)
  return 'HLD-26-' + ((hash >>> 0) % (36 ** 4)).toString(36).toUpperCase().padStart(4, '0')
}
