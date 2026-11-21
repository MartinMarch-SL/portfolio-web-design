import { canHover, onMotionPreferencesChange, prefersReducedMotion } from './motion-prefs'

const vertex = `
  attribute vec2 position;
  attribute vec2 uv;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`

const fragment = `
  precision mediump float;
  uniform sampler2D uImage;
  uniform vec2 uCover;
  uniform vec2 uPointer;
  uniform vec2 uVelocity;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(31.7, 69.3))) * 4375.5);
  }

  float noise(vec2 p) {
    vec2 cell = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(cell), hash(cell + vec2(1,0)), f.x),
               mix(hash(cell + vec2(0,1)), hash(cell + vec2(1,1)), f.x), f.y);
  }

  void main() {
    float influence = 1.0 - smoothstep(0.0, 0.45, distance(vUv, uPointer));
    float field = noise(vUv * 14.0 + uPointer * 4.0) - 0.25;
    vec2 shift = uVelocity * influence;
    vec2 uv = (vUv - 0.5 + shift * field * 0.1) * uCover + 0.5;
    vec2 split = shift * uCover * 0.008;
    vec4 center = texture2D(uImage, uv);
    gl_FragColor = vec4(texture2D(uImage, uv + split).r,
                       center.g, texture2D(uImage, uv - split).b, center.a);
  }
`

type OGL = typeof import('ogl')
type Cleanup = () => void
const contextOptions = { alpha: true, depth: false, premultipliedAlpha: false }
let teardown: Cleanup | undefined

function mount(element: HTMLElement, image: HTMLImageElement, ogl: OGL) {
  const canvas = document.createElement('canvas')
  // Probe before constructing OGL's renderer, which logs an error when context creation fails.
  const context = canvas.getContext('webgl', contextOptions)
  if (!(context instanceof WebGLRenderingContext)) return
  const loseContext = context.getExtension('WEBGL_lose_context')
  const renderer = new ogl.Renderer({ canvas, webgl: 1, ...contextOptions, dpr: Math.min(devicePixelRatio, 1.5) })
  const gl = renderer.gl
  const texture = new ogl.Texture(gl, { image, generateMipmaps: false })
  const uniforms = {
    uImage: { value: texture },
    uCover: { value: [1, 1] },
    uPointer: { value: [.5, .5] },
    uVelocity: { value: [0, 0] },
  }
  const geometry = new ogl.Triangle(gl)
  const program = new ogl.Program(gl, { vertex, fragment, uniforms, depthTest: false, depthWrite: false })
  const mesh = new ogl.Mesh(gl, { geometry, program })
  canvas.setAttribute('aria-hidden', 'true')
  const abort = new AbortController()
  const { signal } = abort
  let frame = 0
  let previous: { x: number; y: number; time: number } | undefined
  let disposed = false

  function dispose() {
    if (disposed) return
    disposed = true
    abort.abort()
    cancelAnimationFrame(frame)
    resize.disconnect()
    canvas.remove()
    if (!gl.isContextLost()) {
      gl.deleteTexture(texture.texture)
      geometry.remove()
      program.remove()
      loseContext?.loseContext()
    }
  }

  function draw() {
    renderer.render({ scene: mesh })
  }

  function measure() {
    const { clientWidth: width, clientHeight: height } = element
    if (!width || !height) return
    const ratio = width / height / (image.naturalWidth / image.naturalHeight)
    uniforms.uCover.value = [Math.min(1, ratio), Math.min(1, 1 / ratio)]
    renderer.setSize(width, height)
    draw()
  }

  function settle() {
    const [x, y] = uniforms.uVelocity.value
    uniforms.uVelocity.value = [x * .84, y * .84]
    if (Math.hypot(x, y) > .003) {
      draw()
      frame = requestAnimationFrame(settle)
    } else {
      uniforms.uVelocity.value = [0, 0]
      draw()
      frame = 0
    }
  }

  const resize = new ResizeObserver(measure)
  resize.observe(element)
  canvas.addEventListener('webglcontextlost', dispose, { signal })
  element.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch') return
    const rect = element.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width
    const y = 1 - (event.clientY - rect.top) / rect.height
    const elapsed = previous ? Math.max(8, event.timeStamp - previous.time) : 16
    const dx = previous ? (x - previous.x) * 110 / elapsed : 0
    const dy = previous ? (y - previous.y) * 110 / elapsed : 0
    const limit = Math.max(1, Math.hypot(dx, dy))
    uniforms.uPointer.value = [x, y]
    uniforms.uVelocity.value = [dx / limit, dy / limit]
    previous = { x, y, time: event.timeStamp }
    if (!frame) frame = requestAnimationFrame(settle)
  }, { signal })
  measure()
  element.append(canvas)
  return dispose
}

function update() {
  teardown?.()
  teardown = undefined
  if (!canHover() || prefersReducedMotion()) return
  const elements = document.querySelectorAll<HTMLElement>('[data-distort-image]')
  if (!elements.length) return
  const listeners = new AbortController()
  const { signal } = listeners
  let hovered: HTMLElement | undefined
  let visit = 0
  let dispose: Cleanup | undefined

  function clear() {
    hovered = undefined
    visit++
    dispose?.()
    dispose = undefined
  }

  for (const element of elements) {
    element.addEventListener('pointerenter', async event => {
      if (event.pointerType === 'touch') return
      clear()
      hovered = element
      const currentVisit = visit
      const image = element.parentElement?.querySelector<HTMLImageElement>('[data-distort-hover-source]')
        ?? element.querySelector('img')!
      try {
        const [ogl] = await Promise.all([import('ogl'), image.decode()])
        if (signal.aborted || currentVisit !== visit || !element.matches(':hover')) return
        dispose = mount(element, image, ogl)
      } catch {
        // The underlying image handles unsupported graphics, context loss and decode failures.
      }
    }, { signal })
    element.addEventListener('pointerleave', () => {
      if (hovered === element) clear()
    }, { signal })
  }

  window.addEventListener('blur', clear, { signal })
  teardown = () => {
    listeners.abort()
    clear()
  }
}

document.addEventListener('astro:page-load', update)
document.addEventListener('astro:before-swap', () => { teardown?.(); teardown = undefined })
onMotionPreferencesChange(update)
