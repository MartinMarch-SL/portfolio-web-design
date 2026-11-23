import type { Tipo } from '../data/plataformas'

export const levels = [
  'Elige tu tipo de web', 'Tu negocio', 'Tu gusto', 'Páginas y estructura', 'Tu contenido',
  'Lo que podrás editar', 'Funcionalidades', 'Logística', 'Partida completada',
]

export function levelsFor(tipo: Tipo = 1) {
  return levels.map((_, level) => level).filter(level => (level !== 5 || tipo >= 2) && (level !== 6 || tipo >= 3))
}

export function recommendTipo({ edit, features, platform }: { edit: boolean; features: boolean; platform: boolean }): Tipo {
  return platform ? 4 : features ? 3 : edit ? 2 : 1
}
