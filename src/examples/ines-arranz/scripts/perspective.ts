import { Camera, Geometry, Mesh, Program, Renderer, Texture, Transform } from 'ogl'
import type { OGLRenderingContext } from 'ogl'
import { scroll } from 'motion'

const width = 1200
const height = 760
const typeSize = 152
const fov = 34
const radius = 9
const orbit = Math.PI / 12
const reduced = matchMedia('(prefers-reduced-motion: reduce)')
const hover = matchMedia('(hover: hover) and (pointer: fine)')

type Point = [number, number]

const vertex = `
  attribute vec3 position, positionB, printA, printB;
  attribute vec2 bevelA, bevelB;
  attribute vec3 normal;
  uniform mat4 modelViewMatrix, projectionMatrix;
  varying vec3 vPrintA, vPrintB, vView, vNormal;
  varying vec2 vBevel;
  uniform float turn;
  void main() {
    vec4 point = modelViewMatrix * vec4(mix(position, positionB, turn), 1.);
    vPrintA = printA;
    vPrintB = printB;
    vBevel = mix(bevelA, bevelB, turn);
    vView = -point.xyz;
    float angle = (2. * turn - 1.) * ${orbit};
    float c = cos(angle), s = sin(angle);
    vec3 rotatedNormal = vec3(c * normal.x + s * normal.z, normal.y, c * normal.z - s * normal.x);
    vNormal = mat3(modelViewMatrix) * rotatedNormal;
    gl_Position = projectionMatrix * point;
  }
`

const fragment = `
  precision highp float;
  uniform sampler2D thought, reframe;
  uniform float visibility, turn, stageWidth;
  varying vec3 vPrintA, vPrintB, vView, vNormal;
  varying vec2 vBevel;
  void main() {
    vec3 view = normalize(vView);
    vec3 normal = normalize(vNormal);
    float fresnel = pow(1. - abs(dot(view, normal)), 2.);
    float edge = vBevel.x * stageWidth;
    float rim = 1. - smoothstep(.35, 1.25, edge);
    float thickness = (1. - smoothstep(1.1, 2.4, edge)) * vBevel.y;
    vec3 light = normalize(vec3(mix(-.55, .5, turn), .36, 1.));
    float glint = pow(max(dot(normal, normalize(light + view)), 0.), 40.);
    float glass = min(1., .062 + .045 * fresnel + .055 * glint
      + rim * (.52 + .23 * fresnel + .20 * glint) + .13 * thickness);
    float graphite = texture2D(thought, vPrintA.xy / vPrintA.z).a * (1. - smoothstep(.12, .52, turn));
    float plum = texture2D(reframe, vPrintB.xy / vPrintB.z).a * smoothstep(.48, .90, turn);
    float ink = graphite + plum;
    vec3 inkColor = (graphite * vec3(32.,34.,39.) + plum * vec3(74.,44.,58.)) / 255.;
    float alpha = ink + glass * (1. - ink);
    vec3 tint = mix(vec3(.64,.78,.98), vec3(1.,1.,.99), max(rim, glint));
    gl_FragColor = vec4(inkColor + tint * glass * (1. - ink), alpha) * visibility;
  }
`

function typeset(phrase: string, reframe: boolean) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')!
  const words = phrase.split(' ')
  const font = (size: number) => `${reframe ? 'italic ' : ''}${size}px "Newsreader Variable", Georgia, serif`
  context.font = font(typeSize)
  let lines = [phrase]
  if (context.measureText(phrase).width > width * .87) {
    const splits = words.slice(1).map((_, index) => [words.slice(0, index + 1).join(' '), words.slice(index + 1).join(' ')])
    const lineWidth = (line: string[]) => Math.max(...line.map(value => context.measureText(value).width))
    lines = splits.reduce((best, split) => lineWidth(split) < lineWidth(best) ? split : best)
  }
  const widest = Math.max(...lines.map(line => context.measureText(line).width))
  const size = Math.min(typeSize, typeSize * width * .87 / widest)
  context.font = font(size)
  context.textAlign = 'center'
  context.textBaseline = 'alphabetic'
  lines.forEach((line, index) => {
    context.fillText(line, width / 2, height / 2 + size * (.25 + (index - (lines.length - 1) / 2) * .88))
  })
  return { canvas, multiline: lines.length > 1 }
}

function clip(polygon: Point[], a: Point, b: Point): Point[] {
  const distance = ([x, y]: Point) => (x - (a[0] + b[0]) / 2) * (b[0] - a[0]) +
    (y - (a[1] + b[1]) / 2) * (b[1] - a[1])
  return polygon.flatMap((end, index) => {
    const start = polygon[(index + polygon.length - 1) % polygon.length]
    const from = distance(start)
    const to = distance(end)
    const points: Point[] = []
    if ((from < 0) !== (to < 0)) {
      const t = from / (from - to)
      points.push([start[0] + (end[0] - start[0]) * t, start[1] + (end[1] - start[1]) * t])
    }
    if (to <= 0) points.push(end)
    return points
  })
}

function polygonCenter(polygon: Point[]): Point {
  return [
    polygon.reduce((sum, point) => sum + point[0], 0) / polygon.length,
    polygon.reduce((sum, point) => sum + point[1], 0) / polygon.length,
  ]
}

function makePolygons(random: () => number, multiline: boolean) {
  const hull: Point[] = [
    [.04, .44], [.14, .32], [.43, .28], [.71, .30], [.93, .36],
    [.96, .54], [.82, .64], [.56, .68], [.23, .66], [.06, .59],
  ]
  const sites = Array.from({ length: 16 }, (_, index): Point => {
    const x = .07 + (index + random() * .88) * .86 / 16
    return [x, .34 + random() * .31]
  })
  const cells = sites.flatMap(site => {
    let polygon = sites.reduce((cell, neighbor) => neighbor === site ? cell : clip(cell, site, neighbor), hull)
    const upper = multiline ? .29 + random() * .053 : .33 + random() * .069
    const lower = multiline ? .64 + random() * .038 : .59 + random() * .074
    polygon = clip(clip(polygon, [0, upper + .1], [0, upper - .1]), [0, lower - .1], [0, lower + .1])
    if (polygon.length < 3) return []
    while (polygon.length > 7) {
      const lengths = polygon.map(([x, y], index) => Math.hypot(
        x - polygon[(index + 1) % polygon.length][0], y - polygon[(index + 1) % polygon.length][1],
      ))
      const shortest = lengths.indexOf(Math.min(...lengths))
      polygon = polygon.filter((_, index) => index !== shortest)
    }
    while (polygon.length < 5) {
      const [x, y] = polygon[0]
      const bevel = ([a, b]: Point): Point => [x + (a - x) * .023, y + (b - y) * .023]
      polygon = [bevel(polygon.at(-1)!), bevel(polygon[1]), ...polygon.slice(1)]
    }
    const center = polygonCenter(polygon)
    return [polygon.map(([x, y]): Point => [
      center[0] + (x - center[0]) * .991,
      center[1] + (y - center[1]) * .991,
    ])]
  })

  const accents: Point[] = [[.15,.25], [.37,.22], [.65,.18], [.87,.25], [.22,.75], [.49,.80], [.75,.77], [.91,.69]]
  return cells.concat(accents.map(([x, y], index) => {
    const sides = 5 + index % 3
    const size = .019 + random() * .045
    const offset = random() * Math.PI
    return Array.from({ length: sides }, (_, side): Point => {
      const angle = offset + side * 2 * Math.PI / sides
      const r = size * (.74 + random() * .26)
      return [x + Math.cos(angle) * r, y + Math.sin(angle) * r * 1.28]
    })
  }))
}

function makeShards(gl: OGLRenderingContext, lines: string[], seed: number, stageWidth: { value: number }) {
  const group = new Transform()
  const [before, after] = lines.map((line, index) => typeset(line, index === 1))
  const textures = [before, after].map(({ canvas }) => new Texture(gl, {
    image: canvas, generateMipmaps: false, minFilter: gl.LINEAR,
  }))
  const visibility = { value: 1 }
  const turn = { value: 0 }
  const program = new Program(gl, {
    vertex, fragment, transparent: true, depthWrite: false, cullFace: null,
    uniforms: { thought: { value: textures[0] }, reframe: { value: textures[1] }, visibility, turn, stageWidth },
  })
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 4294967296
  }
  const tangent = Math.tan(fov * Math.PI / 360)
  const ray = ([u, v]: Point): Point => [(u - .5) * 2 * tangent * width / height, (.5 - v) * 2 * tangent]
  const shards = makePolygons(random, before.multiline || after.multiline).map(polygon => {
    const depth = radius + (random() - .5) * 6.8
    const normal = [(random() - .5) * .95, (random() - .5) * .8, 1]
    const lift = (random() - .5) * 2.8
    const poses = [before, after].map(({ multiline }, side) => {
      const angle = side === 0 ? -orbit : orbit
      const points = polygon.map(([x, y]): Point => [x, .5 + (y - .5) * (multiline ? 1.28 : 1)])
      const center = polygonCenter(points)
      const [cx, cy] = ray(center)
      const rotate = (x: number, y: number, z: number) => [
        x * Math.cos(angle) + z * Math.sin(angle), y, z * Math.cos(angle) - x * Math.sin(angle),
      ]
      const origin = rotate(cx * depth, cy * depth, radius - depth)
      const positions: number[] = []
      const projection: number[] = []
      const edges: number[] = []

      function append(point: Point, edge: number, light: number) {
        const [x, y] = ray(point)
        // Intersect a reference camera ray with the tilted shard plane.
        const z = depth * (1 - normal[0] * cx - normal[1] * cy) / (1 - normal[0] * x - normal[1] * y)
        positions.push(...rotate(x * z - cx * depth, y * z - cy * depth, depth - z))
        // Preserve the homogeneous coordinates so the ink stays on the moving glass.
        projection.push(point[0] * z, (1 - point[1]) * z, z)
        edges.push(edge, light)
      }

      points.forEach((a, index) => {
        const b = points[(index + 1) % points.length]
        const dx = b[0] - a[0]
        const dy = b[1] - a[1]
        const length = Math.hypot(dx, dy)
        const towardLight = .5 + .5 * (dx + dy * .6) / (length * Math.hypot(1, .6))
        append(center, Math.abs(dx * (a[1] - center[1]) - dy * (a[0] - center[0])) / length, towardLight)
        append(a, 0, towardLight)
        append(b, 0, towardLight)
      })
      return { origin, positions, projection, edges }
    })
    const [a, b] = poses
    const attribute = (size: number, data: number[]) => ({ size, data: new Float32Array(data) })
    const geometry = new Geometry(gl, {
      position: attribute(3, a.positions),
      positionB: attribute(3, b.positions),
      printA: attribute(3, a.projection),
      printB: attribute(3, b.projection),
      bevelA: attribute(2, a.edges),
      bevelB: attribute(2, b.edges),
      normal: attribute(3, a.edges.flatMap((_, index) => index % 2 === 0 ? normal : [])),
    })
    const mesh = new Mesh(gl, { geometry, program, frustumCulled: false })
    mesh.setParent(group)

    return { mesh, a, b, lift }
  })
  return {
    group,
    show(value: number, orbitProgress: number) {
      group.visible = value > .001
      if (!group.visible) return
      visibility.value = value
      const pose = smooth((orbitProgress - .40) / .37)
      turn.value = pose
      const scale = .55 + .45 * value
      const scatter = Math.sin(orbitProgress * Math.PI)
      for (const { mesh, a, b, lift } of shards) {
        const offset = scatter * lift
        const mix = (from: number[], to: number[], axis: number) => from[axis] + (to[axis] - from[axis]) * pose
        mesh.position.set(mix(a.origin, b.origin, 0), mix(a.origin, b.origin, 1) + offset, mix(a.origin, b.origin, 2))
        mesh.scale.set(scale)
      }
    },
    dispose() {
      for (const { mesh } of shards) mesh.geometry.remove()
      program.remove()
      textures.forEach(texture => gl.deleteTexture(texture.texture))
    },
  }
}

const clamp = (value: number) => Math.max(0, Math.min(1, value))
function smooth(value: number) {
  const t = clamp(value)
  return t * t * (3 - 2 * t)
}

function mount(section: HTMLElement, stage: HTMLElement) {
  const canvas = document.createElement('canvas')
  const attributes = { alpha: true, antialias: true, premultipliedAlpha: true }
  if (!canvas.getContext('webgl2', attributes) && !canvas.getContext('webgl', attributes)) return
  const renderer = new Renderer({ canvas, dpr: Math.min(devicePixelRatio, 2), ...attributes })
  const { gl } = renderer
  gl.clearColor(0, 0, 0, 0)
  const camera = new Camera(gl, { fov, aspect: width / height })
  const scene = new Transform()
  const stageWidth = { value: width }
  const pairs = Array.from(section.querySelectorAll('.pair'), (pair, index) => {
    const lines = Array.from(pair.querySelectorAll('p'), line => line.textContent!)
    const shards = makeShards(gl, lines, 283 + index * 53, stageWidth)
    shards.group.setParent(scene)
    return shards
  })
  const count = section.querySelector<HTMLElement>('[data-perspective-count]')!
  stage.append(canvas)
  section.classList.add('has-scene')

  let target = 0
  let position = 0
  let pointerX = 0
  let pointerY = 0
  let x = 0
  let y = 0
  let frame = 0
  let last = 0
  let visible = false
  let active = -1
  let needsRender = true

  function draw(time: number) {
    const amount = last ? 1 - Math.exp(-Math.min(time - last, 50) / 145) : 1
    last = time
    const easeTo = (current: number, desired: number) => {
      const difference = desired - current
      return Math.abs(difference) < .0001 ? desired : current + difference * amount
    }
    const nextPosition = easeTo(position, target)
    const nextX = easeTo(x, pointerX)
    const nextY = easeTo(y, pointerY)
    frame = requestAnimationFrame(draw)
    if (!needsRender && nextPosition === position && nextX === x && nextY === y) return
    position = nextPosition
    x = nextX
    y = nextY

    const track = clamp(position) * pairs.length
    const index = Math.min(Math.floor(track), pairs.length - 1)
    const progress = track - index
    const turn = smooth((progress - .25) / .5)
    const drift = Math.sin(turn * Math.PI)
    const angle = (turn * 2 - 1) * orbit + drift * x * .018
    const distance = radius + drift * .8
    camera.position.set(Math.sin(angle) * distance, drift * (.65 + y * .18), Math.cos(angle) * distance)
    camera.lookAt([0, 0, 0])

    const form = index ? smooth(progress / .065) : 1
    const dissolve = index < pairs.length - 1 ? smooth((1 - progress) / .065) : 1
    pairs.forEach((shards, pair) => shards.show(pair === index ? form * dissolve : 0, turn))
    if (active !== index) {
      active = index
      count.textContent = `${index + 1} / ${pairs.length}`
    }
    renderer.render({ scene, camera })
    needsRender = false
  }

  const stop = scroll(progress => { target = progress }, { target: section, offset: ['start start', 'end end'] })
  const resize = new ResizeObserver(([entry]) => {
    const { width: w, height: h } = entry.contentRect
    if (!w || !h) return
    stageWidth.value = w
    renderer.setSize(w, h)
    camera.perspective({ aspect: w / h })
    needsRender = true
  })
  resize.observe(stage)

  function sync() {
    if (visible && !document.hidden) {
      if (!frame) frame = requestAnimationFrame(draw)
    } else {
      cancelAnimationFrame(frame)
      frame = 0
      last = 0
    }
  }
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
    sync()
  })
  observer.observe(stage)
  document.addEventListener('visibilitychange', sync)

  function move(event: PointerEvent) {
    if (!hover.matches || event.pointerType === 'touch') return
    const rect = stage.getBoundingClientRect()
    pointerX = (event.clientX - rect.left) / rect.width * 2 - 1
    pointerY = 1 - (event.clientY - rect.top) / rect.height * 2
  }
  function reset() { pointerX = pointerY = 0 }
  stage.addEventListener('pointermove', move)
  stage.addEventListener('pointerleave', reset)
  hover.addEventListener('change', reset)
  function onContextLost() {
    stopScene?.()
    stopScene = undefined
    section.classList.add('rewrite')
  }
  canvas.addEventListener('webglcontextlost', onContextLost, { once: true })
  return () => {
    canvas.removeEventListener('webglcontextlost', onContextLost)
    stop()
    resize.disconnect()
    observer.disconnect()
    cancelAnimationFrame(frame)
    document.removeEventListener('visibilitychange', sync)
    stage.removeEventListener('pointermove', move)
    stage.removeEventListener('pointerleave', reset)
    hover.removeEventListener('change', reset)
    pairs.forEach(shard => shard.dispose())
    canvas.remove()
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    section.classList.remove('has-scene')
  }
}

const section = document.querySelector<HTMLElement>('[data-perspective]')!
const stage = section.querySelector<HTMLElement>('[data-perspective-stage]')!
let stopScene: (() => void) | undefined
let generation = 0
async function syncPreference() {
  const current = ++generation
  stopScene?.()
  stopScene = undefined
  section.classList.toggle('rewrite', !reduced.matches)
  if (reduced.matches) return
  await Promise.all([
    document.fonts.load(`${typeSize}px "Newsreader Variable"`),
    document.fonts.load(`italic ${typeSize}px "Newsreader Variable"`),
  ]).catch(() => [])
  if (current !== generation) return
  try {
    stopScene = mount(section, stage)
  } catch {
    section.classList.remove('has-scene')
    stage.replaceChildren()
  }
}
reduced.addEventListener('change', syncPreference)
void syncPreference()
