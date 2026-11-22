import { Camera, Geometry, Mesh, Program, Renderer, Transform } from 'ogl'
import { footballGeometry } from '../lib/football'

const vertex = `
attribute vec3 position, normal;
attribute float tone, edge;
uniform mat4 modelViewMatrix, projectionMatrix;
uniform mat3 normalMatrix;
varying vec3 surface;
varying float panel, edgeDistance;
void main() {
  surface = normalMatrix * normal;
  panel = tone;
  edgeDistance = edge;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
}`
const fragment = `
precision mediump float;
varying vec3 surface;
varying float panel, edgeDistance;

void main() {
  vec3 n = normalize(surface);
  float light = max(dot(n, normalize(vec3(-.68,.72,.25))), 0.);
  vec3 cream = mix(vec3(.91,.87,.80), vec3(.74,.70,.62), panel);
  float seam = 1. - smoothstep(.005, .027, edgeDistance);
  vec3 pigment = mix(cream, vec3(.33,.30,.24), seam);
  float rim = pow(1. - max(n.z, 0.), 3.) * .12;
  gl_FragColor = vec4(pigment * (.47 + light * .58) + rim, 1.);
}`

export function mountBall(stage: HTMLElement, signal: AbortSignal) {
  const canvas = stage.querySelector('canvas')!
  const fallback = stage.querySelector('img')!
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  const hover = matchMedia('(hover: hover) and (pointer: fine)')
  const glContext = canvas.getContext('webgl', { alpha: true, antialias: true })
  if (!glContext) return
  const renderer = new Renderer({ canvas, webgl: 1, alpha: true, antialias: true, dpr: Math.min(devicePixelRatio, 1.5) })
  const gl = renderer.gl
  const camera = new Camera(gl, { fov: 36, near: .1, far: 20 })
  camera.position.z = 3.6
  const scene = new Transform()
  const ball = new Transform()
  ball.setParent(scene)
  const { positions, normals, tones, edges } = footballGeometry()
  const panels = new Geometry(gl, {
    position: { size: 3, data: positions },
    normal: { size: 3, data: normals },
    tone: { size: 1, data: tones },
    edge: { size: 1, data: edges },
  })
  const panelProgram = new Program(gl, { vertex, fragment })
  new Mesh(gl, { geometry: panels, program: panelProgram }).setParent(ball)

  let frame = 0, previous = 0, angle = .42, targetX = 0, targetY = 0, x = 0, y = 0
  let visible = true, stopped = false
  function draw(time: number) {
    frame = 0
    if (stopped) return
    if (!reduced.matches && visible) {
      angle += Math.min(time - (previous || time), 50) * .00019
      x += (targetX - x) * .06
      y += (targetY - y) * .06
      frame = requestAnimationFrame(draw)
    }
    previous = time
    ball.rotation.set(-.25 + (reduced.matches ? 0 : y), angle + (reduced.matches ? 0 : x), -.18)
    renderer.render({ scene, camera })
  }
  function refresh() {
    cancelAnimationFrame(frame)
    previous = 0
    draw(performance.now())
  }
  const resize = new ResizeObserver(([entry]) => {
    const size = Math.round(entry.contentRect.width)
    if (!size || stopped) return
    renderer.setSize(size, size)
    camera.perspective({ aspect: 1 })
    refresh()
  })
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
    refresh()
  })
  stage.addEventListener('pointermove', event => {
    if (reduced.matches || !hover.matches || event.pointerType === 'touch') return
    const bounds = stage.getBoundingClientRect()
    targetX = ((event.clientX - bounds.left) / bounds.width - .5) * .42
    targetY = ((event.clientY - bounds.top) / bounds.height - .5) * .32
  }, { signal })
  const resetPointer = () => { targetX = targetY = x = y = 0 }
  stage.addEventListener('pointerleave', () => { targetX = targetY = 0 }, { signal })
  hover.addEventListener('change', resetPointer, { signal })
  reduced.addEventListener('change', refresh, { signal })
  const stop = () => {
    if (stopped) return
    stopped = true
    cancelAnimationFrame(frame)
    resize.disconnect()
    observer.disconnect()
    panels.remove()
    panelProgram.remove()
  }
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault()
    stop()
    canvas.hidden = true
    fallback.hidden = false
  }, { signal })
  signal.addEventListener('abort', () => {
    stop()
    gl.getExtension('WEBGL_lose_context')?.loseContext()
  }, { once: true })
  canvas.hidden = false
  fallback.hidden = true
  resize.observe(stage)
  observer.observe(stage)
}
