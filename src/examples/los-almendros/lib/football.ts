type Point = [number, number, number]

const phi = (1 + Math.sqrt(5)) / 2
const signs = [-1, 1]
const vertices: Point[] = signs.flatMap(a => signs.flatMap(b => [
  [0, a, b * phi], [a, b * phi, 0], [b * phi, 0, a],
] as Point[]))
const dot = (a: Point, b: Point) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const cross = (a: Point, b: Point): Point => [
  a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0],
]
const mix = (a: Point, b: Point, t: number): Point => a.map((value, index) => value + (b[index] - value) * t) as Point
const unit = (a: Point): Point => a.map(value => value / Math.hypot(...a)) as Point
const centerOf = (points: Point[]): Point => [0, 1, 2].map(axis => points.reduce((sum, point) => sum + point[axis], 0) / points.length) as Point

export function footballPanels() {
  const neighbors = vertices.map(a => vertices.flatMap((b, index) =>
    Math.abs(dot(a, b) - phi) < 1e-6 ? [index] : []))
  const edge = (a: number, b: number) => mix(vertices[a], vertices[b], 1 / 3)
  const panels = neighbors.map((adjacent, a) => ({ dark: true, points: adjacent.map(b => edge(a, b)) }))
  neighbors.forEach((adjacent, a) => {
    for (const b of adjacent.filter(b => b > a)) {
      for (const c of adjacent.filter(c => c > b && neighbors[b].includes(c))) {
        panels.push({ dark: false, points: [edge(a, b), edge(b, a), edge(b, c), edge(c, b), edge(c, a), edge(a, c)] })
      }
    }
  })
  return panels.map(({ dark, points }) => {
    const center = centerOf(points)
    const normal = unit(center)
    const u = unit(points[0].map((value, axis) => value - center[axis]) as Point)
    const v = cross(normal, u)
    const angle = (point: Point) => Math.atan2(dot(point, v), dot(point, u))
    return { dark, center, points: points.sort((a, b) => angle(a) - angle(b)) }
  })
}

export function footballGeometry() {
  const positions: number[] = [], normals: number[] = [], tones: number[] = [], edges: number[] = []
  const resolution = 8
  for (const { points, center, dark } of footballPanels()) {
    for (let side = 0; side < points.length; side++) {
      const a = points[side]
      const b = points[(side + 1) % points.length]
      const vertex = (i: number, j: number) => {
        const normal = unit(center.map((value, axis) =>
          value + (a[axis] - value) * i / resolution + (b[axis] - value) * j / resolution) as Point)
        positions.push(...normal)
        normals.push(...normal)
        tones.push(dark ? 1 : 0)
        edges.push(1 - (i + j) / resolution)
      }
      for (let i = 0; i < resolution; i++) {
        for (let j = 0; j < resolution - i; j++) {
          vertex(i, j)
          vertex(i + 1, j)
          vertex(i, j + 1)
          if (i + j + 1 < resolution) {
            vertex(i + 1, j)
            vertex(i + 1, j + 1)
            vertex(i, j + 1)
          }
        }
      }
    }
  }
  return { positions: new Float32Array(positions), normals: new Float32Array(normals), tones: new Float32Array(tones), edges: new Float32Array(edges) }
}
