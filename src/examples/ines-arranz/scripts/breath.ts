import { Mesh, Program, Renderer, Triangle } from 'ogl'

const motion = matchMedia('(prefers-reduced-motion: reduce)')
const hover = matchMedia('(hover: hover) and (pointer: fine)')
const vertex = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position, 0., 1.); }
`
const fragment = `
precision mediump float;
varying vec2 vUv;
uniform float time;
uniform vec2 pointer;
void main() {
  vec2 p = (vUv - .5) * 2. - pointer * .055;
  float a = atan(p.y, p.x);
  float r = length(p);
  float edge = .72 + .095*sin(3.*a + .7 + time*.28) + .055*cos(2.*a - time*.22) + .025*sin(5.*a);
  float alpha = 1. - smoothstep(edge-.025, edge+.012, r);
  vec3 niebla = vec3(.812,.784,.91);
  vec3 salvia = vec3(.561,.659,.58);
  vec3 arcilla = vec3(.761,.439,.31);
  vec3 avena = vec3(.945,.925,.894);
  vec3 ink = mix(avena, niebla, 1.-smoothstep(.0,1.48,length(p-vec2(-.42,.45))));
  ink = mix(ink, salvia, .91*(1.-smoothstep(.0,1.03,length(p-vec2(.46,.24)))));
  ink = mix(ink, arcilla, .82*(1.-smoothstep(.0,1.08,length(p-vec2(.18,-.63)))));
  float grain = fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233))) * 437.58);
  gl_FragColor = vec4(ink+(grain-.5)*.045, alpha);
}
`

function makeShader(root: HTMLElement) {
  if (motion.matches) return
  const canvas = root.querySelector('canvas')!
  try {
    const contextOptions = { alpha: true, depth: false, premultipliedAlpha: false }
    if (!canvas.getContext('webgl', contextOptions)) return
    const renderer = new Renderer({ canvas, webgl: 1, ...contextOptions, dpr: Math.min(devicePixelRatio, 1.5) })
    const uniforms = { time: { value: 0 }, pointer: { value: [0, 0] } }
    const program = new Program(renderer.gl, { vertex, fragment, uniforms })
    const mesh = new Mesh(renderer.gl, { geometry: new Triangle(renderer.gl), program })
    let size = 0
    let lost = false
    canvas.addEventListener('webglcontextlost', () => {
      lost = true
      delete root.dataset.webgl
    })
    root.addEventListener('pointermove', event => {
      if (!hover.matches || motion.matches || event.pointerType === 'touch') return
      const box = root.getBoundingClientRect()
      uniforms.pointer.value = [(event.clientX - box.left) / box.width * 2 - 1, 1 - (event.clientY - box.top) / box.height * 2]
    })
    const resetPointer = () => { uniforms.pointer.value = [0, 0] }
    root.addEventListener('pointerleave', resetPointer)
    hover.addEventListener('change', resetPointer)
    return (elapsed: number) => {
      if (lost) return
      if (size !== root.clientWidth) {
        size = root.clientWidth
        renderer.setSize(size, size)
      }
      uniforms.time.value = elapsed / 1000
      renderer.render({ scene: mesh })
      if (!root.hasAttribute('data-webgl')) root.dataset.webgl = ''
    }
  } catch {
    return
  }
}

const smooth = (value: number) => value * value * (3 - 2 * value)
function scaleAt(seconds: number) {
  if (seconds < 4) return .84 + .16 * smooth(seconds / 4)
  if (seconds < 8) return 1
  return 1 - .16 * smooth((seconds - 8) / 6)
}

for (const root of document.querySelectorAll<HTMLElement>('[data-blob]')) {
  const shape = root.querySelector<HTMLElement>('.blob-shape')!
  const widget = root.closest('[data-breath-widget]')
  const toggle = widget?.querySelector<HTMLButtonElement>('[data-breath-toggle]')
  const phase = widget?.querySelector('[data-phase]')
  const clock = widget?.querySelector('[data-clock]')
  let shader = makeShader(root)
  let active = !widget
  let visible = false
  let elapsed = 0
  let previous = 0
  let frame = 0

  function render() {
    const seconds = (elapsed / 1000) % 14
    if (!motion.matches) {
      shape.style.transform = 'scale(' + scaleAt(seconds) + ')'
      shader?.(elapsed)
    }
    if (active && phase && clock) {
      const text = seconds < 4 ? 'Inspira' : seconds < 8 ? 'Mantén' : 'Suelta'
      if (phase.textContent !== text) phase.textContent = text
      const remaining = Math.max(0, Math.ceil((60_000 - elapsed) / 1000))
      const time = remaining === 60 ? '1:00' : '0:' + String(remaining).padStart(2, '0')
      if (clock.textContent !== time) clock.textContent = time
    }
  }

  function stop(completed = false) {
    active = false
    elapsed = 0
    if (toggle && phase && clock) {
      toggle.textContent = completed ? 'Volver a respirar' : 'Empezar la pausa'
      phase.textContent = completed ? 'La pausa ha terminado' : 'Pausa detenida'
      clock.textContent = completed ? '0:00' : '1:00'
    }
    render()
    sync()
  }

  function tick(now: number) {
    frame = 0
    if (active) elapsed += previous ? now - previous : 0
    previous = now
    if (widget && elapsed >= 60_000) {
      stop(true)
      return
    }
    render()
    sync()
  }

  function sync() {
    const running = visible && !document.hidden && active && (!motion.matches || widget)
    if (running && !frame) frame = requestAnimationFrame(tick)
    if (!running) {
      cancelAnimationFrame(frame)
      frame = 0
      previous = 0
    }
  }

  toggle?.addEventListener('click', () => {
    if (active) {
      stop()
      return
    }
    elapsed = 0
    active = true
    toggle.textContent = 'Detener la pausa'
    render()
    sync()
  })
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
    if (visible) render()
    sync()
  })
  observer.observe(root)
  document.addEventListener('visibilitychange', sync)
  motion.addEventListener('change', () => {
    if (!motion.matches) shader ??= makeShader(root)
    if (visible) render()
    sync()
  })
}
