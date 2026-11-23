import { Geometry, type OGLRenderingContext } from 'ogl'

export type XYZ = [number, number, number]
interface Surface { position: number[]; normal: number[]; index: number[] }
const mesh = (gl: OGLRenderingContext, surface: Surface) => new Geometry(gl, {
  position: { size: 3, data: new Float32Array(surface.position) },
  normal: { size: 3, data: new Float32Array(surface.normal) },
  index: { data: new Uint16Array(surface.index) },
})

function grid(gl: OGLRenderingContext, sides: number, columns: number, rows: number,
  sample: (side: number, column: number, row: number) => [XYZ, XYZ]) {
  const surface: Surface = { position: [], normal: [], index: [] }
  for (let side = 0; side < sides; side++) {
    const offset = surface.position.length / 3
    for (let y = 0; y <= rows; y++) {
      for (let x = 0; x <= columns; x++) {
        const [position, normal] = sample(side, x, y)
        surface.position.push(...position)
        surface.normal.push(...normal)
        if (x < columns && y < rows) {
          const i = offset + y * (columns + 1) + x
          surface.index.push(i, i + 1, i + columns + 1, i + 1, i + columns + 2, i + columns + 1)
        }
      }
    }
  }
  return mesh(gl, surface)
}

export function roundedBox(gl: OGLRenderingContext, size: XYZ, bevel: number) {
  const half = size.map(value => value / 2)
  const r = Math.min(bevel, ...half.map(value => value * .95))
  const inner = half.map(value => value - r)
  const ticks = half.map((h, axis) => [-h, -h + r * .35, -inner[axis], inner[axis], h - r * .35, h])
  const faces = [[0, 1, 2, 1], [0, 2, 1, -1], [1, 2, 0, 1], [1, 0, 2, -1], [2, 0, 1, 1], [2, 1, 0, -1]]
  return grid(gl, 6, 5, 5, (side, x, y) => {
    const [axis, u, v, sign] = faces[side]
    const point: XYZ = [0, 0, 0]
    point[axis] = half[axis] * sign
    point[u] = ticks[u][x]
    point[v] = ticks[v][y]
    const base = point.map((value, i) => Math.max(-inner[i], Math.min(inner[i], value)))
    const delta = point.map((value, i) => value - base[i])
    const length = Math.hypot(...delta)
    const normal = delta.map(value => value / length) as XYZ
    return [base.map((value, i) => value + normal[i] * r) as XYZ, normal]
  })
}

export function lathe(gl: OGLRenderingContext, profile: [number, number][], slices = 48) {
  return grid(gl, profile.length - 1, slices, 1, (band, x, y) => {
    const [radius, height] = profile[band + y]
    const [startRadius, startHeight] = profile[band]
    const [endRadius, endHeight] = profile[band + 1]
    const angle = x / slices * Math.PI * 2
    const c = Math.cos(angle), s = Math.sin(angle)
    const dy = endHeight - startHeight, dr = endRadius - startRadius
    const length = Math.hypot(dy, dr) || 1
    return [[radius * c, height, radius * s], [-dy / length * c, dr / length, -dy / length * s]]
  })
}

export function extrude(gl: OGLRenderingContext, outline: [number, number][], depth: number) {
  // Convex clockwise footprints in XZ; each side has a hard normal.
  const surface: Surface = { position: [], normal: [], index: [] }
  function face(points: XYZ[], normal: XYZ) {
    const start = surface.position.length / 3
    for (const point of points) {
      surface.position.push(...point)
      surface.normal.push(...normal)
    }
    for (let i = 1; i < points.length - 1; i++) surface.index.push(start, start + i, start + i + 1)
  }
  const top = outline.map(([x, z]): XYZ => [x, depth / 2, z])
  const bottom = outline.map(([x, z]): XYZ => [x, -depth / 2, z])
  face(top, [0, 1, 0])
  face([...bottom].reverse(), [0, -1, 0])
  for (let i = 0; i < outline.length; i++) {
    const j = (i + 1) % outline.length
    const dx = top[j][0] - top[i][0], dz = top[j][2] - top[i][2]
    const length = Math.hypot(dx, dz)
    face([top[j], top[i], bottom[i], bottom[j]], [-dz / length, 0, dx / length])
  }
  return mesh(gl, surface)
}

export function samplePoints(gl: OGLRenderingContext, geometry: Geometry, count: number, seed: number) {
  const source = geometry.attributes.position.data as Float32Array
  const index = geometry.attributes.index.data as Uint16Array
  const points = new Float32Array(count * 3)
  function random() {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0
    return seed / 4294967296
  }
  const areas: number[] = []
  let area = 0
  for (let i = 0; i < index.length; i += 3) {
    const a = index[i] * 3, b = index[i + 1] * 3, c = index[i + 2] * 3
    const x = source[b] - source[a], y = source[b + 1] - source[a + 1], z = source[b + 2] - source[a + 2]
    const u = source[c] - source[a], v = source[c + 1] - source[a + 1], w = source[c + 2] - source[a + 2]
    area += Math.hypot(y * w - z * v, z * u - x * w, x * v - y * u)
    areas.push(area)
  }
  for (let i = 0; i < count; i++) {
    const target = random() * area
    let low = 0, high = areas.length - 1
    while (low < high) {
      const mid = Math.floor((low + high) / 2)
      if (areas[mid] < target) low = mid + 1
      else high = mid
    }
    const triangle = low * 3
    const u = Math.sqrt(random()), v = random()
    for (let axis = 0; axis < 3; axis++) points[i * 3 + axis] =
      source[index[triangle] * 3 + axis] * (1 - u) +
      source[index[triangle + 1] * 3 + axis] * u * (1 - v) +
      source[index[triangle + 2] * 3 + axis] * u * v
  }
  return new Geometry(gl, { position: { size: 3, data: points } })
}
