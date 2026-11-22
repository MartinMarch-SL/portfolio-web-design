import { Mesh, Program, Triangle } from 'ogl'
import { createRenderer, loadImage, texture, visibleRender } from './webgl'

const vertex = `
  attribute vec2 position, uv;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0., 1.);
  }
`
const fragment = `
  precision mediump float;
  uniform sampler2D surface;
  uniform vec2 texel, direction;
  varying vec2 vUv;

  float heightAt(vec2 uv) {
    return dot(texture2D(surface, uv).rgb, vec3(.2126, .7152, .0722));
  }

  void main() {
    vec2 x = vec2(texel.x, 0.);
    vec2 y = vec2(0., texel.y);
    float dx = heightAt(vUv + x) - heightAt(vUv - x);
    float dy = heightAt(vUv + y) - heightAt(vUv - y);
    // Compress strong pigment edges so finer brush ridges can still catch the light.
    vec2 slope = vec2(dx, dy);
    slope *= 10. / (1. + 5. * length(slope));
    vec3 normal = normalize(vec3(-slope, 1.));
    vec3 light = normalize(vec3(direction, .26));
    float relief = dot(normal, light) - light.z;
    vec3 color = texture2D(surface, vUv).rgb;
    gl_FragColor = vec4(color * (1. + .48 * relief), 1.);
  }
`

export async function mountRaking(
  painting: HTMLElement, container: HTMLElement, source: string, reduced: MediaQueryList, lost: () => void,
) {
  const image = await loadImage(source)
  const renderer = createRenderer()
  const { gl } = renderer
  const direction = [-.8, .5]
  const scene = new Mesh(gl, {
    geometry: new Triangle(gl),
    program: new Program(gl, {
      vertex, fragment, depthTest: false, depthWrite: false,
      uniforms: {
        surface: { value: texture(renderer, image) },
        texel: { value: [1.6 / image.width, 1.6 / image.height] },
        direction: { value: direction },
      },
    }),
  })
  const target = [-.8, .5]
  const pointer = matchMedia('(hover: hover) and (pointer: fine)')
  let tracking = false
  const events = new AbortController()
  const options = { signal: events.signal }
  painting.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch' || !pointer.matches || reduced.matches) return
    const rect = painting.getBoundingClientRect()
    target[0] = (event.clientX - rect.left) / rect.width * 2 - 1
    target[1] = 1 - (event.clientY - rect.top) / rect.height * 2
    tracking = true
  }, options)
  painting.addEventListener('pointerleave', () => { tracking = false }, options)
  container.append(gl.canvas)
  let lastFrame = ''
  visibleRender(container, renderer, time => {
    if (reduced.matches) {
      direction[0] = -.8
      direction[1] = .5
    } else if (tracking && pointer.matches) {
      direction[0] += (target[0] - direction[0]) * .12
      direction[1] += (target[1] - direction[1]) * .12
    } else {
      direction[0] = Math.sin(time / 2300)
      direction[1] = .5
    }
    const frame = `${renderer.width}/${renderer.height}/${direction[0].toFixed(3)}/${direction[1].toFixed(3)}`
    if (frame === lastFrame) return
    lastFrame = frame
    renderer.render({ scene })
    if (!gl.isContextLost()) container.classList.add('is-ready')
  }, () => {
    events.abort()
    container.classList.remove('is-ready')
    container.replaceChildren()
    lost()
  })
}
