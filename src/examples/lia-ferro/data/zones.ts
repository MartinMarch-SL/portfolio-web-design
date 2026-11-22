export type Point = readonly [number, number, number]

export interface Zone {
  id: string
  name: string
  center: Point
  normal: Point
  max: number
  difficulty: number
}

export const zones: Zone[] = [
  { id: 'antebrazo-interior', name: 'Antebrazo interior', center: [-27.7, 106, 1], normal: [0, 0, 1], max: 15, difficulty: 1 },
  { id: 'antebrazo-exterior', name: 'Antebrazo exterior', center: [27.5, 106, 1], normal: [.55, 0, -.83], max: 17, difficulty: 1 },
  { id: 'biceps', name: 'Bíceps', center: [21, 130, 0], normal: [.25, 0, 1], max: 16, difficulty: 1.05 },
  { id: 'hombro', name: 'Hombro', center: [-16, 142, 0], normal: [-.8, .22, .6], max: 15, difficulty: 1.15 },
  { id: 'clavicula', name: 'Clavícula', center: [6, 144, 3], normal: [0, .15, 1], max: 12, difficulty: 1.2 },
  { id: 'nuca', name: 'Nuca', center: [0, 151, 0], normal: [0, 0, -1], max: 8, difficulty: 1.2 },
  { id: 'espalda-alta', name: 'Espalda alta', center: [0, 134, 0], normal: [0, 0, -1], max: 28, difficulty: 1.1 },
  { id: 'costillas', name: 'Costillas', center: [-11, 118, 2], normal: [-.7, 0, 1], max: 18, difficulty: 1.4 },
  { id: 'muslo', name: 'Muslo', center: [10, 70, 0], normal: [0, 0, 1], max: 25, difficulty: 1 },
  { id: 'gemelo', name: 'Gemelo', center: [11, 33, -2], normal: [.90, 0, .44], max: 19, difficulty: 1.1 },
  { id: 'tobillo', name: 'Tobillo', center: [-11, 9, 0], normal: [-.7, 0, .7], max: 7, difficulty: 1.25 },
]
