import type { Game } from '../lib/competition'

const rounds = [[0, 1], [2, 3], [2, 0], [1, 3], [0, 3], [1, 2]]
const dates = ['2026-11-07', '2026-11-07', '2026-11-14', '2026-11-14', '2026-11-21', '2026-11-21']

function group(id: string, name: string, opponents: string[], scores: Game['score'][], leaders: [string, string, number][]) {
  const teams = [name, ...opponents]
  const games = rounds.map(([home, away], index): Game => ({ home: teams[home], away: teams[away], score: scores[index], date: dates[index] }))
  return { id, name, teams, games, leaders }
}

export const groups = [
  group('mini', 'Mini A', ['CB Los Olmos', 'Basket Valverde', 'CB La Vega'],
    [[48, 41], [55, 42], [57, 53], [49, 52], [64, 58], [45, 61]],
    [['Nico Acedo', 'Puntos', 14.3], ['Hugo Sierra', 'Rebotes', 7.7], ['Martín León', 'Asistencias', 4.3]]),
  group('infantil', 'Infantil femenino', ['CB Alameda', 'Basket Pradera', 'CB Arroyo'],
    [[58, 51], [48, 44], [49, 54], [50, 55], [52, 46], [51, 56]],
    [['Lola Pardo', 'Puntos', 15.7], ['Vega Salas', 'Rebotes', 8.3], ['Irene Lozano', 'Asistencias', 5.0]]),
  group('junior', 'Júnior A', ['CB Estación', 'Basket Encinar', 'CB Puente'],
    [[71, 65], [69, 74], [76, 72], [73, 70], [79, 68], [72, 80]],
    [['Joel Vidal', 'Puntos', 19.3], ['Bruno Reyes', 'Rebotes', 10.0], ['Álvaro Cruz', 'Asistencias', 6.3]]),
]

export const nextMatch = { home: 'Pinar Alto', away: 'CB Los Olmos', team: 'Mini A', date: '2026-11-28', label: 'SÁB 28 NOV', time: '10:30' }
export const results = groups.flatMap(({ name, games }) => games.filter(game =>
  game.date === '2026-11-21' && (game.home === name || game.away === name)).map(game => ({ ...game, team: name })))
