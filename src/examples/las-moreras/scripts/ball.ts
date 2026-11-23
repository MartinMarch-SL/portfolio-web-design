import { Camera, Mesh, Program, Renderer, Sphere } from 'ogl'

const vertex = `
attribute vec3 position, normal;
uniform mat4 modelViewMatrix, projectionMatrix;
uniform mat3 normalMatrix;
varying vec3 feltPosition, viewNormal, viewPosition;
void main() {
  feltPosition = position;
  viewNormal = normalMatrix * normal;
  vec4 point = modelViewMatrix * vec4(position, 1.);
  viewPosition = point.xyz;
  gl_Position = projectionMatrix * point;
}`

const fragment = `
precision highp float;
varying vec3 feltPosition, viewNormal, viewPosition;
float grit(vec3 p) {
  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
}
void main() {
  vec3 p = normalize(feltPosition);
  float grain = grit(floor(p * 385.));
  vec3 fibers = vec3(grain, grit(floor(p.yzx * 438.)), grit(floor(p.zxy * 361.))) - .5;
  vec3 n = normalize(viewNormal + fibers * .20);
  vec3 light = normalize(vec3(-.54, .75, .62));
  vec3 view = normalize(-viewPosition);
  float diffuse = max(dot(n, light), 0.);
  float rim = pow(1. - clamp(dot(normalize(viewNormal), view), 0., 1.), 2.8);
  float seam = abs(abs(p.x - .23 * sin(p.y * 3.9)) - .53);
  float white = 1. - smoothstep(.026, .050, seam + (grain - .5) * .015);
  vec3 felt = mix(vec3(.43, .44, .10), vec3(.91, .89, .29), diffuse);
  vec3 thread = mix(vec3(.68, .65, .49), vec3(1., .98, .86), diffuse);
  vec3 pigment = mix(felt, thread, white) * (.91 + .18 * grain);
  pigment += vec3(.21, .18, .09) * rim * (.5 + grain);
  float edge = 1. - rim * (.05 + .23 * smoothstep(.5, 1., grain));
  gl_FragColor = vec4(pigment, edge);
}`

export function mountBall(stage: HTMLElement, signal: AbortSignal) {
  const canvas = stage.querySelector('canvas')!
  const fallback = stage.querySelector('img')!
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  const mark = stage.closest('[data-court]')?.querySelector<HTMLElement>('.clay-mark')
  if (!canvas.getContext('webgl', { alpha: true, antialias: true })) return
  const renderer = new Renderer({ canvas, webgl: 1, alpha: true, antialias: true, dpr: Math.min(devicePixelRatio, 1.5) })
  const gl = renderer.gl
  const camera = new Camera(gl, { fov: 40, near: .1, far: 20 })
  camera.position.z = 4.25
  const geometry = new Sphere(gl, { radius: 1, widthSegments: 56, heightSegments: 40 })
  const program = new Program(gl, { vertex, fragment, transparent: true })
  const ball = new Mesh(gl, { geometry, program })

  let frame = 0, previous = 0, elapsed = 0
  let visible = false, stopped = false
  function draw(time: number) {
    frame = 0
    if (stopped) return
    if (!reduced.matches && visible) {
      elapsed += Math.min(time - (previous || time), 40) / 1000
      frame = requestAnimationFrame(draw)
    }
    previous = time
    const phase = elapsed % 5.5
    const rebound = phase < 1.85 ? 1.1 * phase * (1.85 - phase) : 0
    const rise = reduced.matches ? 0 : rebound
    ball.position.y = -.12 + rise * .61
    ball.rotation.set(.24, .14 + (reduced.matches ? 0 : elapsed * .27), -.29)
    mark?.style.setProperty('--mark-opacity', String(reduced.matches || elapsed < 1.85 ? 0 : .65 * Math.exp(-(phase >= 1.85 ? phase - 1.85 : phase + 3.65) * 1.05)))
    stage.style.setProperty('--shadow-scale', String(1 - rise * .27))
    stage.style.setProperty('--shadow-opacity', String(.9 - rise * .4))
    const descending = !reduced.matches && phase > .925 && phase < 1.85
    stage.style.setProperty('--trail-opacity', String(descending ? Math.sin((phase - .925) / .925 * Math.PI) * .45 : 0))
    stage.style.setProperty('--trail-offset', `${-12 - rise * 38}%`)
    renderer.render({ scene: ball, camera })
    if (!stage.hasAttribute('data-rendered')) stage.dataset.rendered = ''
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
  function stop() {
    if (stopped) return
    stopped = true
    cancelAnimationFrame(frame)
    resize.disconnect()
    observer.disconnect()
    geometry.remove()
    program.remove()
  }
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault()
    stop()
    delete stage.dataset.rendered
    stage.style.removeProperty('--trail-opacity')
    canvas.hidden = true
    fallback.hidden = false
    mark?.style.removeProperty('--mark-opacity')
    stage.style.removeProperty('--shadow-scale')
    stage.style.removeProperty('--shadow-opacity')
  }, { signal })
  signal.addEventListener('abort', () => {
    stop()
    gl.getExtension('WEBGL_lose_context')?.loseContext()
  }, { once: true })
  reduced.addEventListener('change', refresh, { signal })
  canvas.hidden = false
  fallback.hidden = true
  resize.observe(stage)
  observer.observe(stage)
}
