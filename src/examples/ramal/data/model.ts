type Point = [number, number, number]
export interface Part { at: Point; size: Point; shade?: number; axis?: number }
const box = (x: number, y: number, z: number, w: number, h: number, d: number, shade?: number): Part =>
  ({ at: [x, y, z], size: [w, h, d], shade })
const pipe = (x: number, y: number, z: number, length: number, diameter: number, axis: number, shade?: number): Part => {
  const size: Point = [diameter, diameter, diameter]
  size[axis] = length
  return { at: [x, y, z], size, shade, axis }
}

export const layers = [
  { id: 'estructura', code: 'A-00', name: 'Estructura', size: '12.000 × 9.000 mm', color: '#C9CCC9', lift: 0,
    parts: [
      box(0, -.17, 0, 12, .34, 9),
      ...[-5.55, 5.55].flatMap(x => [-4.05, 4.05].map(z => box(x, 1.5, z, .36, 3, .36))),
    ] },
  { id: 'fontaneria', code: 'F-04', name: 'Fontanería', size: 'DN 50 / DN 110', color: '#3F8C7A', lift: .72,
    parts: [
      ...[-3.28, -2.95].flatMap((z, i) => [
        pipe(-1.1, .22, z, 7.8, .12 + i * .06, 0),
        pipe(2.76, .22, z + 2.2, 4.4, .12 + i * .06, 2),
        pipe(-4.95, .6, z, .88, .12, 1),
      ]),
      pipe(2.76, .22, 1.6, .78, .25, 2, .8),
    ] },
  { id: 'pci', code: 'PCI-03', name: 'Incendios', size: 'DN 80 / DN 25', color: '#B5473A', lift: 1.45,
    parts: [
      pipe(-3.6, 2.12, 0, 7, .14, 2),
      ...[-3.45, -.15, 3.45].flatMap(z => [
        pipe(.4, 2.12, z, 8.05, .1, 0),
        ...[-1.5, 1.35, 4.4].flatMap(x => [
          pipe(x, 1.99, z, .23, .07, 1),
          pipe(x, 1.86, z, .055, .19, 1, .8),
        ]),
      ]),
    ] },
  { id: 'clima', code: 'M-02', name: 'Climatización', size: '600 × 350 mm', color: '#4F8FB8', lift: 2.22,
    parts: [
      box(.3, 2.72, -.95, 8.8, .35, .6),
      box(-4.6, 2.65, -.95, 1.15, .62, 1.2, .82),
      ...[-2.85, .1, 3.85].flatMap(x => [
        box(x, 2.72, .85, .46, .35, 3.25),
        box(x, 2.46, 2.35, .64, .16, .64, .83),
        ...[-.19, 0, .19].map(offset => box(x + offset, 2.37, 2.35, .035, .035, .55, .62)),
      ]),
    ] },
  { id: 'electricidad', code: 'E-01', name: 'Electricidad', size: '300 × 60 mm', color: '#D9A441', lift: 3,
    parts: [
      box(-.3, 3.15, 2.98, 9, .06, .3),
      ...[2.82, 3.14].map(z => box(-.3, 3.23, z, 9, .16, .045)),
      ...Array.from({ length: 23 }, (_, i) => box(-4.55 + i * .38, 3.20, 2.98, .05, .035, .3, .75)),
      box(4.17, 2.58, 2.98, .3, 1.2, .3),
      box(4.17, 1.27, 2.98, .88, 1.55, .53, .8),
      box(4.17, 1.65, 3.26, .44, .22, .04, .63),
    ] },
  { id: 'fotovoltaica', code: 'FV-05', name: 'Fotovoltaica', size: '12 módulos · cubierta', color: '#7B6FB0', lift: 4,
    parts: [
      box(0, 3.72, -1.45, 11.6, .15, 5.05, .85),
      ...[-3, -1.45, .1].flatMap(z => [-3.6, -1.2, 1.2, 3.6].flatMap(x => [
        box(x, 3.9, z, 2, .12, 1.12),
        box(x, 3.97, z, 1.92, .025, 1.04, .78),
        box(x, 4, z, .036, .028, 1.04),
        box(x, 4, z, 1.92, .028, .032),
      ])),
    ] },
]

export const modelProjection = ([x, y, z]: number[]) =>
  [347 + (x - z) * 25, 382 + (x + z) * 12 - y * 32].map(Math.round)

const unitCorners: Point[] = [
  [-.5, -.5, -.5], [.5, -.5, -.5], [.5, -.5, .5], [-.5, -.5, .5],
  [-.5, .5, -.5], [.5, .5, -.5], [.5, .5, .5], [-.5, .5, .5],
]
const boxFaces = [[0, 1, 2, 3], [4, 7, 6, 5], [0, 4, 5, 1], [1, 5, 6, 2], [2, 6, 7, 3], [3, 7, 4, 0]]
const corners = ({ at, size }: Part) => unitCorners.map(point =>
  point.map((value, axis) => at[axis] + value * size[axis]) as Point,
)
export function rgb(hex: string, shade = 1) {
  return [1, 3, 5].map(start => Math.min(255, parseInt(hex.slice(start, start + 2), 16) * shade))
}

export function mesh(part: Part) {
  const { axis, at, size } = part
  if (axis === undefined) return { points: corners(part), faces: boxFaces }
  const u = (axis + 1) % 3
  const v = (axis + 2) % 3
  const ring = Array.from({ length: 8 }, (_, i) => i)
  const points = [-.5, .5].flatMap(end => ring.map(i => {
    const point: Point = [...at]
    const angle = i * Math.PI / 4
    point[axis] += size[axis] * end
    point[u] += size[u] * .5 * Math.cos(angle)
    point[v] += size[v] * .5 * Math.sin(angle)
    return point
  }))
  return {
    points,
    faces: [
      [...ring].reverse(),
      ring.map(i => i + 8),
      ...ring.map(i => [i, (i + 1) % 8, (i + 1) % 8 + 8, i + 8]),
    ],
  }
}

export function faceNormal([a, b, c]: Point[]) {
  const [x, y, z] = b.map((value, i) => value - a[i])
  const [u, v, w] = c.map((value, i) => value - a[i])
  const normal = [y * w - z * v, z * u - x * w, x * v - y * u]
  const length = Math.hypot(...normal)
  return normal.map(value => value / length)
}

export const faceColor = (layer: (typeof layers)[number], part: Part, [x, y, z]: number[]) => {
  const hex = layer.id === 'fotovoltaica' && part.size[0] > 10 ? '#deded8' : layer.color
  const light = .91 + .04 * x + .15 * y + .075 * z
  const tint = rgb(hex, light * (part.shade ?? 1))
  const blend = layer.id === 'estructura' || hex === '#deded8' ? .045 : .29
  return rgb('#252b30', light).map((value, i) => value * (1 - blend) + tint[i] * blend)
}

export function layerSpread(progress: number, index: number) {
  const amount = Math.max(0, Math.min(1, (progress - (index - 1) * .115) / .46))
  return amount * amount * (3 - 2 * amount)
}
