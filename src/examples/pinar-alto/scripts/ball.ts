import { Camera, Mesh, Program, Renderer, Sphere } from 'ogl'

const vertex = `
attribute vec3 position, normal;
uniform mat4 modelViewMatrix, projectionMatrix;
uniform mat3 normalMatrix;
varying vec3 leatherPosition, viewNormal, viewPosition;
void main() {
  leatherPosition = position;
  viewNormal = normalMatrix * normal;
  vec4 point = modelViewMatrix * vec4(position, 1.);
  viewPosition = point.xyz;
  gl_Position = projectionMatrix * point;
}`

const fragment = `
precision highp float;
varying vec3 leatherPosition, viewNormal, viewPosition;
void main() {
  vec3 p = normalize(leatherPosition);
  vec3 n = normalize(viewNormal);
  vec3 light = normalize(vec3(-.32, .88, .64));
  float diffuse = max(dot(n, light), 0.);
  vec3 halfLight = normalize(light + normalize(-viewPosition));
  float highlight = pow(max(dot(n, halfLight), 0.), 32.) * .24;

  // Two great circles and two small circles around the sides divide the leather into eight panels.
  float curved = abs(abs(p.x) - .52) / .85;
  float channel = min(min(abs(p.y), abs(p.x)), curved);
  float leather = smoothstep(.006, .014, channel);
  float grooveEdge = smoothstep(.009, .015, channel) * (1. - smoothstep(.016, .023, channel));

  // Stagger the pebble rows on the sphere so the grain rotates with the ball.
  vec2 grainUV = vec2(atan(p.z, p.x) * 116., asin(p.y) * 116.);
  grainUV.x += .5 * mod(floor(grainUV.y), 2.);
  vec2 cell = fract(grainUV) - .5;
  float pebble = 1. - smoothstep(.15, .42, length(cell));
  vec3 orange = mix(vec3(.788, .314, .122), vec3(.910, .380, .173), diffuse);
  orange *= .97 + .06 * pebble;
  vec3 groove = vec3(.036, .023, .020) * (.6 + .4 * diffuse);
  vec3 pigment = mix(groove, orange * (.43 + .57 * diffuse), leather);
  pigment += leather * vec3(1., .76, .53) * (highlight * (.8 + .2 * pebble) + .025 * grooveEdge * diffuse);
  gl_FragColor = vec4(pigment, 1.);
}`

export function mountBall(stage: HTMLElement, signal: AbortSignal) {
  const canvas = stage.querySelector('canvas')!
  const fallback = stage.querySelector('img')!
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  if (!canvas.getContext('webgl', { alpha: true, antialias: true })) return
  const renderer = new Renderer({ canvas, webgl: 1, alpha: true, antialias: true, dpr: Math.min(devicePixelRatio, 1.5) })
  const gl = renderer.gl
  const camera = new Camera(gl, { fov: 40, near: .1, far: 20 })
  camera.position.z = 4.25
  const geometry = new Sphere(gl, { radius: 1, widthSegments: 56, heightSegments: 40 })
  const program = new Program(gl, { vertex, fragment })
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
    stage.style.setProperty('--shadow-scale', String(1 - rise * .27))
    stage.style.setProperty('--shadow-opacity', String(.9 - rise * .4))
    renderer.render({ scene: ball, camera })
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
    canvas.hidden = true
    fallback.hidden = false
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
