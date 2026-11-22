import { Camera, Geometry, Mesh, Program, Renderer, Transform, Vec3 } from 'ogl'
import { faceColor, faceNormal, layers, layerSpread, mesh, rgb } from '../data/model'
import { modelLeaders } from './model-leaders'

const vertex = `
  attribute vec3 position;
  attribute vec3 color;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  varying vec3 vColor;
  void main() {
    vColor = color;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const fragment = `
  precision mediump float;
  varying vec3 vColor;
  void main() { gl_FragColor = vec4(vColor, 1.0); }
`

export function mountWebGL(root: HTMLElement, signal: AbortSignal) {
  const canvas = root.querySelector('canvas')!
  const fallback = root.querySelector<SVGElement>('[data-fallback]')!
  const motion = matchMedia('(prefers-reduced-motion: reduce)')
  // Reduced motion also keeps the view identical to the printable drawing.
  if (motion.matches) return
  const context = { alpha: true, antialias: true, premultipliedAlpha: false }
  const gl2 = canvas.getContext('webgl2', context)
  if (!gl2 && !canvas.getContext('webgl', context)) return
  const renderer = new Renderer({ canvas, webgl: gl2 ? 2 : 1, ...context, dpr: Math.min(devicePixelRatio, 1.5) })
  const gl = renderer.gl
  if (!gl) return
  gl.clearColor(0, 0, 0, 0)
  const camera = new Camera(gl, { left: -10, right: 10, top: 7, bottom: -7, near: .1, far: 80 })
  const scene = new Transform()
  const solid = new Program(gl, { vertex, fragment, cullFace: null })
  const outlines = new Program(gl, { vertex, fragment, cullFace: null })
  const geometries: Geometry[] = []
  const groups = layers.map(layer => {
    const group = new Transform()
    group.setParent(scene)
    const positions: number[] = []
    const colors: number[] = []
    const edges: number[] = []
    const edgeColors: number[] = []
    const edge = rgb(layer.id === 'estructura' ? '#e1e5e5' : layer.color).map(value => value / 255)
    for (const part of layer.parts) {
      const { points, faces } = mesh(part)
      for (const face of faces) {
        const color = faceColor(layer, part, faceNormal(face.map(index => points[index]))).map(value => value / 255)
        for (let i = 1; i < face.length - 1; i++) {
          for (const index of [face[0], face[i], face[i + 1]]) {
            positions.push(...points[index])
            colors.push(...color)
          }
        }
        for (let j = 0; j < face.length; j++) {
          const a = face[j]
          const b = face[(j + 1) % face.length]
          if (a > b) continue
          for (const index of [a, b]) {
            edges.push(...points[index].map((value, axis) => value + (value - part.at[axis]) * .001))
            edgeColors.push(...edge)
          }
        }
      }
    }
    for (const [points, coloring, program, mode] of [
      [positions, colors, solid, gl.TRIANGLES],
      [edges, edgeColors, outlines, gl.LINES],
    ] as const) {
      const geometry = new Geometry(gl, {
        position: { size: 3, data: new Float32Array(points) },
        color: { size: 3, data: new Float32Array(coloring) },
      })
      geometries.push(geometry)
      new Mesh(gl, { geometry, program, mode, renderOrder: mode === gl.LINES ? 1 : 0 }).setParent(group)
    }
    return group
  })

  const viewport = canvas.parentElement!
  const drawLeaders = modelLeaders(root)
  const point = new Vec3()
  let width = 0
  let height = 0
  let frame = 0
  let visible = false
  let lost = false
  let last = 0
  let angle = Math.PI / 4
  let spread = Number(root.dataset.spread || 0)
  let lastSpread = 1

  function update(time: number) {
    frame = 0
    const elapsed = last ? Math.min(50, time - last) : 0
    last = time
    angle += elapsed * .000055
    const target = Number(root.dataset.spread || 0)
    spread += (target - spread) * (1 - Math.exp(-elapsed / 105))
    const focus = 2 + spread * 1.5
    camera.position.set(Math.cos(angle) * 20, 14 + focus, Math.sin(angle) * 20)
    camera.lookAt([0, focus, 0])
    groups.forEach((group, i) => {
      group.visible = !root.dataset.selected || root.dataset.selected === layers[i].id
      group.position.y = layers[i].lift * layerSpread(spread, i)
    })
    renderer.render({ scene, camera })
    if (spread > .005 || target > 0 || lastSpread > .005) {
      drawLeaders(width, height, index => layerSpread(spread, index), ([x, y, z]) => {
        camera.project(point.set(x, y, z))
        return [(point.x + 1) * width / 2, (1 - point.y) * height / 2]
      })
    }
    lastSpread = spread
    frame = requestAnimationFrame(update)
  }

  function sync() {
    const active = visible && !motion.matches && !document.hidden && !lost
    canvas.hidden = motion.matches || lost
    fallback.toggleAttribute('hidden', !canvas.hidden)
    if (active && !frame) frame = requestAnimationFrame(update)
    if (!active) {
      cancelAnimationFrame(frame)
      frame = last = 0
    }
  }

  const resize = new ResizeObserver(() => {
    width = viewport.clientWidth
    height = viewport.clientHeight
    if (!width || !height) return
    renderer.setSize(width, height)
    const halfWidth = Math.max(8.55, 6.5 * width / height)
    const halfHeight = halfWidth * height / width
    camera.orthographic({ left: -halfWidth - .55, right: halfWidth - .55, top: halfHeight, bottom: -halfHeight })
  })
  resize.observe(viewport)
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
    sync()
  })
  observer.observe(viewport)
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault()
    lost = true
    sync()
  }, { signal })
  motion.addEventListener('change', sync, { signal })
  document.addEventListener('visibilitychange', sync, { signal })
  signal.addEventListener('abort', () => {
    cancelAnimationFrame(frame)
    observer.disconnect()
    resize.disconnect()
    for (const geometry of geometries) geometry.remove()
    solid.remove()
    outlines.remove()
    gl.getExtension('WEBGL_lose_context')?.loseContext()
  }, { once: true })
}
