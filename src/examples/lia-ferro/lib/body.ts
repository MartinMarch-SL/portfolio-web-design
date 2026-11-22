import type { Point } from '../data/zones'

type Capsule = [Point, Point, number, number, number]
// Measurements are in centimetres. The crown is at 170, with an approximately
// 21 cm head, relaxed shoulders and the weight over the straighter left leg.
const capsules: Capsule[] = [
  [[0, 147, 0], [-.5, 153, -.5], 4.4, 3.9, .95],
  [[-10, 142, 0], [11, 143, -.5], 5.6, 5.8, 1.18],
  [[-1, 94, 0], [-1, 119, 0], 9.7, 10.3, .70],
]
const ellipsoids: [Point, Point][] = [
  [[-.7, 160.6, -.7], [7.2, 9.4, 7.5]],
  [[-.5, 154.4, 2.4], [5.2, 5.4, 4.8]],
  [[-.5, 158.6, 6], [1.2, 2.4, 2.2]],
  [[-1, 132, -.2], [14, 15, 8.4]],
  [[-1.3, 108, 0], [9.5, 14, 6.4]],
  [[-.6, 94, -.9], [12.5, 12.1, 8.1]],
]
for (const side of [-1, 1]) {
  const at = (x: number, y: number, z = 0): Point => [x * side, y, z]
  const tilt = side * .8
  const rear = side === 1 ? -2 : 1
  ellipsoids.push(
    [at(7, 138 + tilt, 4.2), [7.4, 5.8, 4.9]],
    [at(6.7, 145 + tilt, 4.5), [7.4, 1.8, 2.2]],
    [at(6.8, 94 - tilt, -2), [7.8, 9.5, 7.5]],
    [at(7.2, 158.5, -.9), [1.15, 2.6, 1.7]],
    [at(10.7, 35, rear - 1.2), [5.2, 13.5, 5.6]],
    [at(10, 49, rear + 1.4), [3.6, 4.3, 3.6]],
  )
  capsules.push(
    [at(15, 141 + tilt), at(19, 134 + tilt), 5.6, 4.75, 1.03],
    [at(19, 134 + tilt), at(24, 116 + tilt), 4.75, 3.25, 1.02],
    [at(24, 116 + tilt), at(26, 110 + tilt, 1), 3.25, 4.05, 1.05],
    [at(26, 110 + tilt, 1), at(30.5, 94 + tilt, 2.5), 4.05, 2.05, .93],
    [at(8, 89 - tilt, rear), at(8.8, 77, rear), 7.4, 6.7, .98],
    [at(8.8, 77, rear), at(10, 49, rear + 1), 6.7, 3.8, 1.06],
    [at(10, 49, rear + 1), at(10.7, 38, rear), 3.8, 4.4, .99],
    [at(10.7, 38, rear), at(11.4, 6, rear), 4.4, 2.35, 1.04],
    [at(11.4, 3.5, rear -.3), at(12, 2.6, rear + 7), 3.45, 2.55, 1.05],
    [at(31, 91.5 + tilt, 2.7), at(32, 87 + tilt, 2.9), 2.05, 2.35, .62],
    [at(32, 87 + tilt, 2.9), at(32.9, 82.5 + tilt, 3.65), 2.25, 1.15, .62],
    [at(30.3, 89.8 + tilt, 3.35), at(28.9, 86 + tilt, 4.15), 1.16, .68, .85],
  )
}

const parts = capsules.map(([a, b, start, end, scale]) => {
  const dx = b[0] - a[0], dy = b[1] - a[1], dz = (b[2] - a[2]) / scale
  const lengthSquared = dx * dx + dy * dy + dz * dz
  return { a, dx, dy, dz, start, change: end - start, scale, lengthSquared,
    low: Math.min(a[1], b[1]) - Math.max(start, end) - 3,
    high: Math.max(a[1], b[1]) + Math.max(start, end) + 3 }
})

function join(a: number, b: number, width: number) {
  const blend = Math.max(0, 1 - Math.abs(a - b) / width)
  return Math.min(a, b) - blend * blend * width * .25
}

const atHeight = (y: number) => parts.filter(part => y >= part.low && y <= part.high)
const ellipsoidsAtHeight = (y: number) => ellipsoids.filter(([[, cy], [, ry]]) => Math.abs(y - cy) <= ry + 4)

export function field(x: number, y: number, z: number, capsulesAtY = atHeight(y), ellipsoidsAtY = ellipsoidsAtHeight(y)) {
  let distance = 4
  for (const [[cx, cy, cz], [rx, ry, rz]] of ellipsoidsAtY) {
    const qx = (x - cx) / rx, qy = (y - cy) / ry, qz = (z - cz) / rz
    const radius = Math.sqrt(qx * qx + qy * qy + qz * qz)
    distance = join(distance, (radius - 1) * Math.min(rx, ry, rz), 2.5)
  }
  for (const part of capsulesAtY) {
    const px = x - part.a[0], py = y - part.a[1], pz = (z - part.a[2]) / part.scale
    const t = Math.max(0, Math.min(1, (px * part.dx + py * part.dy + pz * part.dz) / part.lengthSquared))
    const dx = px - part.dx * t, dy = py - part.dy * t, dz = pz - part.dz * t
    const next = Math.sqrt(dx * dx + dy * dy + dz * dz) - part.start - part.change * t
    distance = join(distance, next, 2.25)
  }
  return distance
}

function gradient(x: number, y: number, z: number): Point {
  const capsulesAtY = atHeight(y), ellipsoidsAtY = ellipsoidsAtHeight(y)
  return [
    field(x + .15, y, z, capsulesAtY, ellipsoidsAtY) - field(x - .15, y, z, capsulesAtY, ellipsoidsAtY),
    field(x, y + .15, z) - field(x, y - .15, z),
    field(x, y, z + .15, capsulesAtY, ellipsoidsAtY) - field(x, y, z - .15, capsulesAtY, ellipsoidsAtY),
  ]
}

let cached: { points: Float32Array; lines: Float32Array; scanNormals: Float32Array; lineNormals: Float32Array; skin: Float32Array; normals: Float32Array; indices: Uint16Array } | undefined

export function scanGeometry() {
  if (cached) return cached
  const points: number[] = [], lines: number[] = []
  const scanNormals: number[] = [], lineNormals: number[] = []
  const skin: number[] = [], normals: number[] = [], indices: number[] = []
  const spacing = 1, columns = 79, rows = 33, levels = 173
  const layerSize = columns * rows, gridSize = layerSize * (levels + 1)
  const offsets = [0, 1, columns, columns + 1, layerSize, layerSize + 1, layerSize + columns, layerSize + columns + 1]
  // Six tetrahedra share the cube diagonal, so adjacent cells meet cleanly.
  const tetrahedra = [[0, 1, 3, 7], [0, 3, 2, 7], [0, 2, 6, 7], [0, 6, 4, 7], [0, 4, 5, 7], [0, 5, 1, 7]]
  const vertexByEdge = new Map<number, number>()
  let previous = new Float32Array(columns * rows).fill(4)
  for (let level = 0; level <= levels; level++) {
    const y = level * spacing - 1
    const layer = new Float32Array(columns * rows)
    const capsulesAtY = atHeight(y), ellipsoidsAtY = ellipsoidsAtHeight(y)
    for (let z = 0; z < rows; z++) {
      for (let x = 0; x < columns; x++) {
        const px = (x - 39) * spacing, pz = (z - 16) * spacing
        const index = z * columns + x
        const value = layer[index] = field(px, y, pz, capsulesAtY, ellipsoidsAtY)
        function edge(neighbor: number, dx: number, dy: number, dz: number) {
          if ((value < 0) === (neighbor < 0)) return
          const t = spacing * value / (value - neighbor)
          const hit: Point = [px + t * dx, y + t * dy, pz + t * dz]
          points.push(...hit)
          scanNormals.push(...gradient(...hit))
        }

        if (x) edge(layer[index - 1], -1, 0, 0)
        if (z) edge(layer[index - columns], 0, 0, -1)
        edge(previous[index], 0, -1, 0)
        if (level && x && z) {
          const left = index - 1, back = index - columns, diagonal = back - 1
          const values = [value, layer[left], layer[back], layer[diagonal],
            previous[index], previous[left], previous[back], previous[diagonal]]
          if (values.some(v => v < 0) && values.some(v => v >= 0)) {
            const cell = level * layerSize + index
            const vertex = (a: number, b: number) => {
              const key = (cell - offsets[Math.min(a, b)]) * gridSize + cell - offsets[Math.max(a, b)]
              const cached = vertexByEdge.get(key)
              if (cached !== undefined) return cached
              const t = values[a] / (values[a] - values[b])
              const offset = (bit: number) => Number(Boolean(a & bit)) * (1 - t) + Number(Boolean(b & bit)) * t
              const vx = px - spacing * offset(1), vy = y - spacing * offset(4), vz = pz - spacing * offset(2)
              const vertexIndex = skin.length / 3
              skin.push(vx, vy, vz)
              normals.push(...gradient(vx, vy, vz))
              vertexByEdge.set(key, vertexIndex)
              return vertexIndex
            }
            for (const tetra of tetrahedra) {
              const inside = tetra.filter(i => values[i] < 0)
              const outside = tetra.filter(i => values[i] >= 0)
              if (inside.length === 1) indices.push(...outside.map(i => vertex(inside[0], i)))
              if (outside.length === 1) indices.push(...inside.map(i => vertex(outside[0], i)))
              if (inside.length === 2) {
                const [a, b] = inside, [c, d] = outside
                const ac = vertex(a, c), ad = vertex(a, d), bc = vertex(b, c), bd = vertex(b, d)
                indices.push(ac, ad, bc, ad, bd, bc)
              }
            }
          }
        }
        if (level % 5 === 0 && x && z) {
          const corners = [value, layer[index - 1], layer[index - columns - 1], layer[index - columns]]
          const positions = [[px, pz], [px - spacing, pz], [px - spacing, pz - spacing], [px, pz - spacing]]
          const crossings: Point[] = []
          for (let i = 0; i < 4; i++) {
            const j = (i + 1) % 4
            if ((corners[i] < 0) === (corners[j] < 0)) continue
            const t = corners[i] / (corners[i] - corners[j])
            crossings.push([positions[i][0] + (positions[j][0] - positions[i][0]) * t, y, positions[i][1] + (positions[j][1] - positions[i][1]) * t])
          }
          for (const hit of crossings) {
            lines.push(...hit)
            lineNormals.push(...gradient(...hit))
          }
        }
      }
    }
    previous = layer
  }
  cached = { points: new Float32Array(points), lines: new Float32Array(lines),
    scanNormals: new Float32Array(scanNormals), lineNormals: new Float32Array(lineNormals), skin: new Float32Array(skin), normals: new Float32Array(normals), indices: new Uint16Array(indices) }
  return cached
}

export function surface(center: readonly number[], normal: readonly number[], reach = 19): Point | undefined {
  for (let distance = reach; distance >= -2;) {
    const x = center[0] + normal[0] * distance
    const y = center[1] + normal[1] * distance
    const z = center[2] + normal[2] * distance
    const value = field(x, y, z)
    if (value < .035) return [x, y, z]
    distance -= Math.min(1.2, value * .55)
  }
}
