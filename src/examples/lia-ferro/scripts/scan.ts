import { Camera, Geometry, Mesh, Program, Renderer, Texture, Transform, Vec3 } from 'ogl'
import { scanGeometry, surface } from '../lib/body'
import { flash, flashSvg } from '../data/flash'
import { zones, type Zone } from '../data/zones'

export interface Placement {
  zone?: Zone
  src?: string
  aspect: number
  size: number
  rotation: number
  x: number
  y: number
}

export const flashSource = (design: typeof flash[number]) => 'data:image/svg+xml,' + encodeURIComponent(
  flashSvg(design, '#F4EFE8').replace('<svg ', '<svg width="512" height="512" ').replace('stroke-width="1.35"', 'stroke-width=".9"'),
)

const palette = `
const vec3 hueso = vec3(244., 239., 232.) / 255.;
const vec3 frio = vec3(127., 214., 210.) / 255.;
`
const surfaceVertex = `
attribute vec3 position, normal;
uniform mat4 modelViewMatrix, projectionMatrix;
uniform mat3 normalMatrix;
uniform float dotSize, depthBias;
varying vec3 surfaceNormal, viewPosition;
void main() {
  vec4 view = modelViewMatrix * vec4(position, 1.);
  surfaceNormal = normalMatrix * normal;
  viewPosition = view.xyz;
  gl_Position = projectionMatrix * (view + vec4(0., 0., depthBias, 0.));
  gl_PointSize = dotSize;
}`
const facing = `
varying vec3 surfaceNormal, viewPosition;
float surfaceFacing() {
  return clamp(dot(normalize(-viewPosition), normalize(surfaceNormal)), 0., 1.);
}
`
const scanFragment = `
precision mediump float;
${palette}
${facing}
uniform float opacity;
void main() {
  float grazing = 1. - surfaceFacing();
  float alpha = opacity * mix(.4, 1., grazing * grazing);
  gl_FragColor = vec4(hueso * alpha, alpha);
}`
const rimFragment = `
precision mediump float;
${palette}
${facing}
void main() {
  float rim = pow(1. - surfaceFacing(), 3.);
  float alpha = .22 * rim;
  gl_FragColor = vec4(hueso * alpha, alpha);
}`
const decalVertex = `
attribute vec3 position;
attribute vec2 uv;
uniform mat4 modelViewMatrix, projectionMatrix;
varying vec2 tex;
void main() {
  tex = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
}`
const decalFragment = (derivatives: boolean) => `
${derivatives ? '#extension GL_OES_standard_derivatives : enable' : ''}
precision mediump float;
${palette}
uniform sampler2D design;
uniform float visibility, glow, flashMask, dpr;
varying vec2 tex;
float coverage(vec2 uv) {
  vec4 ink = texture2D(design, uv);
  return ink.a * mix(1., smoothstep(.1, .75, ink.r), flashMask);
}
float spread(vec2 dx, vec2 dy) {
  return max(max(coverage(tex + dx), coverage(tex - dx)),
             max(coverage(tex + dy), coverage(tex - dy)));
}
void main() {
  vec2 dx = ${derivatives ? 'dFdx(tex) * dpr' : 'vec2(1. / 512., 0.)'};
  vec2 dy = ${derivatives ? 'dFdy(tex) * dpr' : 'vec2(0., 1. / 512.)'};
  float line = coverage(tex);
  float expansion = smoothstep(.008, .025, max(length(dx), length(dy))) * flashMask;
  line = max(line, spread(dx * .4, dy * .4) * expansion);
  float halo = glow * .18 * max(spread(dx, dy), .45 * spread(dx * 2., dy * 2.));
  float core = mix(line, pow(line, .66), expansion) * visibility;
  float fringe = halo * visibility * (1. - core);
  if (core + fringe < .008) discard;
  gl_FragColor = vec4(mix(hueso, vec3(1.), .4) * core + frio * fringe, core + fringe);
}`

export function mountScan(root: HTMLElement, signal: AbortSignal, onZone?: (id: string) => void) {
  const canvas = root.querySelector('canvas')!
  const stage = canvas.parentElement!
  const fallback = root.querySelector<HTMLElement>('[data-fallback]')!
  const markerLayer = root.querySelector<HTMLElement>('[data-markers]')
  const zoom = root.querySelector<HTMLElement>('[data-zoom]')
  const mode = root.querySelector<HTMLElement>('[data-scan-mode]')!
  const hud = root.querySelector<HTMLOutputElement>('output')!
  const hero = root.dataset.hero === 'true'
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  const fallbackImage = fallback.querySelector('img')!
  let state: Placement = { size: 10, aspect: 1, rotation: 0, x: 0, y: 0 }
  let gpu: ReturnType<typeof mount3d> | undefined

  function update(next: Placement) {
    state = next
    const { zone, src, size, aspect, rotation, x, y } = next
    hud.hidden = !zone
    if (zone) hud.textContent = `${zone.name} · ${formatSize(size, aspect)}`
    const hotspot = [...fallback.querySelectorAll<HTMLButtonElement>('[data-zone]')].find(button => button.dataset.zone === zone?.id)
    fallback.querySelectorAll('[data-zone]').forEach(button => button.setAttribute('aria-pressed', String(button === hotspot)))
    if (hotspot && src) {
      hotspot.parentElement!.append(fallbackImage)
      fallbackImage.hidden = false
      if (fallbackImage.getAttribute('src') !== src) fallbackImage.src = src
      fallbackImage.style.setProperty('--decal-left', `calc(var(--hot-x) + ${x * 1.39}%)`)
      fallbackImage.style.setProperty('--decal-top', `calc(var(--hot-y) * .92 - ${y * .55}%)`)
      fallbackImage.style.setProperty('--hot-x', hotspot.style.getPropertyValue('--x'))
      fallbackImage.style.setProperty('--hot-y', hotspot.style.getPropertyValue('--y'))
      fallbackImage.style.setProperty('--decal-width', `${size * 1.39 * Math.min(aspect, 1)}%`)
      fallbackImage.style.setProperty('--decal-rotation', `${rotation}deg`)
    } else fallbackImage.hidden = true
    gpu?.update(next)
  }

  fallback.addEventListener('click', event => {
    const target = (event.target as HTMLElement).closest<HTMLElement>('[data-zone]')
    if (target?.dataset.zone) onZone?.(target.dataset.zone)
  }, { signal })

  try {
    gpu = mount3d(canvas, stage, hud, hero, reduced, signal, markerLayer, onZone)
    markerLayer?.addEventListener('click', event => {
      const id = (event.target as HTMLElement).closest<HTMLElement>('[data-zone]')?.dataset.zone
      if (id) onZone?.(id)
    }, { signal })
    zoom?.addEventListener('click', event => {
      const delta = (event.target as HTMLElement).closest<HTMLElement>('[data-delta]')?.dataset.delta
      if (delta) gpu?.zoom(Number(delta))
    }, { signal })
    if (gpu) {
      canvas.hidden = false
      fallback.hidden = true
      if (markerLayer) markerLayer.hidden = false
      if (zoom) zoom.hidden = false
      mode.textContent = hero ? 'Escaneo tridimensional' : 'Arrastra para girar · Rueda para acercar'
    }
  } catch (error) {
    console.warn('Escáner corporal en modo 2D', error)
  }
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault()
    gpu?.stop()
    gpu = undefined
    canvas.hidden = true
    fallback.hidden = false
    if (markerLayer) markerLayer.hidden = true
    if (zoom) zoom.hidden = true
    mode.textContent = 'Vista frontal / dorsal'
    hud.style.removeProperty('--hud-x')
    hud.style.removeProperty('--hud-y')
    update(state)
  }, { signal })
  return update
}

export function formatSize(size: number, aspect: number) {
  const format = (number: number) => number.toLocaleString('es-ES', { maximumFractionDigits: 1 })
  return `${format(size * Math.min(aspect, 1))} × ${format(size / Math.max(aspect, 1))} cm`
}

function mount3d(canvas: HTMLCanvasElement, stage: HTMLElement, hud: HTMLElement, hero: boolean, reduced: MediaQueryList, signal: AbortSignal, markerLayer: HTMLElement | null, onZone?: (id: string) => void) {
  if (!canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: true })) return
  const renderer = new Renderer({ canvas, webgl: 1, dpr: Math.min(devicePixelRatio, 1.5), alpha: true, antialias: false, premultipliedAlpha: true })
  const gl = renderer.gl
  const scene = new Transform()
  const camera = new Camera(gl, { fov: 35, near: 1, far: 600 })
  gl.clearColor(0, 0, 0, 0)
  const geometry = scanGeometry()
  const programs: Program[] = []
  const geometries: Geometry[] = []
  const surfaceUniforms = { dotSize: { value: 1 }, depthBias: { value: 0 } }
  // The opaque pass replaces farther fragments and writes depth for the scan and stencil.
  // Its premultiplied output contains only the translucent rim.
  const rimProgram = new Program(gl, { vertex: surfaceVertex, fragment: rimFragment, cullFace: false, uniforms: surfaceUniforms })
  const skinBuffer = new Geometry(gl, { position: { size: 3, data: geometry.skin }, normal: { size: 3, data: geometry.normals }, index: { data: geometry.indices } })
  programs.push(rimProgram)
  geometries.push(skinBuffer)
  new Mesh(gl, { geometry: skinBuffer, program: rimProgram, frustumCulled: false }).setParent(scene)
  for (const [data, normals, mode, opacity] of [
    [geometry.points, geometry.scanNormals, gl.POINTS, .45],
    [geometry.lines, geometry.lineNormals, gl.LINES, .30],
  ] as const) {
    const program = new Program(gl, {
      vertex: surfaceVertex, fragment: scanFragment, transparent: true, depthWrite: false,
      uniforms: { opacity: { value: opacity }, depthBias: { value: .24 }, dotSize: { value: Math.max(1, renderer.dpr * .9) } },
    })
    const buffer = new Geometry(gl, { position: { size: 3, data }, normal: { size: 3, data: normals } })
    programs.push(program)
    geometries.push(buffer)
    new Mesh(gl, { geometry: buffer, program, mode, frustumCulled: false }).setParent(scene)
  }

  const markers = zones.flatMap(zone => {
    const normal = new Vec3(...zone.normal).normalize()
    const point = surface(zone.center, normal)
    const button = markerLayer?.querySelector<HTMLButtonElement>(`[data-zone="${zone.id}"]`)
    return point ? [{ zone, normal, button, point: new Vec3(...point) }] : []
  })
  let selected: typeof markers[number] | undefined
  const decals: { update(placement: Placement): void; orient(): void; dispose(): void }[] = []
  const stencil = decalFragment(Boolean(gl.getExtension('OES_standard_derivatives')))
  const active = makeDecal(!hero)
  const callouts = [...stage.querySelectorAll<HTMLElement>('[data-callout]')].flatMap(element => {
    const marker = markers.find(item => item.zone.id === element.dataset.callout)
    if (!marker) return []
    const design = flash.find(item => item.id === element.dataset.design)
    if (!design) return []
    const decal = makeDecal()
    decal.update({ zone: marker.zone, src: flashSource(design), size: Number(element.dataset.size), aspect: 1,
      rotation: Number(element.dataset.rotation), x: 0, y: 0 })
    return [{ element, marker, label: element.querySelector<HTMLElement>('span')!, line: element.querySelector<HTMLElement>('i')! }]
  })

  function makeDecal(hasGlow = false) {
    const texture = new Texture(gl, { generateMipmaps: true, minFilter: gl.LINEAR_MIPMAP_LINEAR })
    // OGL also tracks the R wrap mode, which is unavailable in WebGL 1.
    Object.assign(texture.state, { wrapR: texture.wrapR })
    const visibility = { value: 0 }
    const flashMask = { value: 0 }
    const program = new Program(gl, {
      vertex: decalVertex, fragment: stencil, transparent: true, depthWrite: false, cullFace: false,
      uniforms: { design: { value: texture }, visibility, flashMask, glow: { value: Number(hasGlow) }, dpr: { value: renderer.dpr } },
    })
    programs.push(program)
    let mesh: Mesh | undefined, source = '', marker: typeof markers[number] | undefined
    const decal = {
      update(placement: Placement) {
        if (mesh) { mesh.setParent(null); mesh.geometry.remove(); mesh = undefined }
        marker = markers.find(item => item.zone === placement.zone)
        if (!marker || !placement.src) return
        if (source !== placement.src) {
          source = placement.src
          flashMask.value = Number(source.startsWith('data:image/svg+xml,'))
          texture.image = undefined
          const image = new Image()
          image.onload = () => {
            if (image.src === source && !signal.aborted) {
              texture.image = image
              dirty = true
            }
          }
          image.src = source
        }
        const surfaceData = projectDecal(placement, marker.normal)
        if (!surfaceData) return
        const buffer = new Geometry(gl, { position: { size: 3, data: surfaceData.positions }, uv: { size: 2, data: surfaceData.uv }, index: { data: surfaceData.indices } })
        mesh = new Mesh(gl, { geometry: buffer, program, frustumCulled: false, renderOrder: 5 })
        mesh.setParent(scene)
      },
      orient() {
        if (!mesh || !marker) return
        const facing = marker.normal.dot(new Vec3().sub(camera.position, marker.point).normalize())
        visibility.value = texture.image ? (hero ? Math.max(0, Math.min(1, (facing - .14) * 2.7)) : 1) : 0
        mesh.visible = visibility.value > 0
      },
      dispose() { mesh?.geometry.remove(); gl.deleteTexture(texture.texture) },
    }
    decals.push(decal)
    return decal
  }

  let azimuth = .16, goalAzimuth = .16, pitch = .015, goalPitch = .015, distance = 320, goalDistance = 320, center = new Vec3(0, 85, 0), target = new Vec3(0, 85, 0)
  if (hero) distance = goalDistance = 283
  let drag: { id: number; x: number; y: number; movement: number } | undefined, velocity = 0
  let frame = 0, stopped = false, visible = true, dirty = true, last = 0

  function resize() {
    renderer.setSize(stage.clientWidth, stage.clientHeight)
    camera.perspective({ aspect: stage.clientWidth / stage.clientHeight })
    dirty = true
  }
  resize()
  const observer = new ResizeObserver(resize)
  observer.observe(stage)
  const visibilityObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; dirty = true })
  visibilityObserver.observe(stage)
  const choose = (event: PointerEvent) => {
    const bounds = canvas.getBoundingClientRect()
    const x = event.clientX - bounds.left, y = event.clientY - bounds.top
    let closest: Zone | undefined, score = 34
    for (const marker of markers) {
      if (marker.normal.dot(new Vec3().sub(camera.position, marker.point).normalize()) < .13) continue
      const p = marker.point.clone()
      camera.project(p)
      const gap = Math.hypot((p.x + 1) * bounds.width / 2 - x, (1 - p.y) * bounds.height / 2 - y)
      if (gap < score) { score = gap; closest = marker.zone }
    }
    if (closest) onZone?.(closest.id)
  }

  function zoom(delta: number) {
    const next = Math.max(34, Math.min(350, goalDistance + delta * 10))
    if (goalDistance === next) return false
    goalDistance = next
    dirty = true
    return true
  }

  if (!hero) {
    canvas.addEventListener('pointerdown', event => {
      if (event.button !== 0 || drag) return
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, movement: 0 }
      velocity = 0
      canvas.setPointerCapture(event.pointerId)
    }, { signal })
    canvas.addEventListener('pointermove', event => {
      if (!drag || drag.id !== event.pointerId) return
      const dx = event.clientX - drag.x, dy = event.clientY - drag.y
      drag.x = event.clientX; drag.y = event.clientY
      drag.movement += Math.hypot(dx, dy)
      goalAzimuth -= dx * .009
      goalPitch = Math.max(-.65, Math.min(.65, goalPitch + dy * .007))
      velocity = -dx * .003
      dirty = true
    }, { signal })
    canvas.addEventListener('pointerup', event => {
      if (drag?.id !== event.pointerId) return
      if (drag.movement < 7) choose(event)
      drag = undefined
    }, { signal })
    canvas.addEventListener('pointercancel', () => { drag = undefined; velocity = 0 }, { signal })
    canvas.addEventListener('wheel', event => {
      if (zoom(Math.sign(event.deltaY))) event.preventDefault()
    }, { passive: false, signal })
  }

  function draw(time: number) {
    if (stopped) return
    frame = requestAnimationFrame(draw)
    const elapsed = Math.min(time - last, 42)
    last = time
    if (!visible) return
    if (hero && !reduced.matches) { goalAzimuth += elapsed * .00018; dirty = true }
    if (!drag && !reduced.matches && Math.abs(velocity) > .0005) {
      goalAzimuth += velocity * elapsed / 16
      velocity *= .90 ** (elapsed / 16)
      dirty = true
    }
    const unsettled = Math.abs(goalAzimuth - azimuth) + Math.abs(goalPitch - pitch) + Math.abs(goalDistance - distance) + center.distance(target) > .002
    if (!dirty && !unsettled) return
    dirty = false
    const blend = reduced.matches ? 1 : 1 - .88 ** (elapsed / 16)
    azimuth += (goalAzimuth - azimuth) * blend
    pitch += (goalPitch - pitch) * blend
    distance += (goalDistance - distance) * blend
    center.lerp(target, blend)
    camera.position.set(center.x + Math.sin(azimuth) * Math.cos(pitch) * distance, center.y + Math.sin(pitch) * distance, center.z + Math.cos(azimuth) * Math.cos(pitch) * distance)
    camera.lookAt(center)
    decals.forEach(decal => decal.orient())
    renderer.render({ scene, camera })
    for (const { button, normal, point } of markers) {
      if (!button) continue
      const facing = normal.dot(new Vec3().sub(camera.position, point).normalize())
      const projected = point.clone()
      camera.project(projected)
      const x = (projected.x + 1) * stage.clientWidth / 2
      const y = (1 - projected.y) * stage.clientHeight / 2
      const margin = 10
      button.hidden = facing < .25 || x < margin || y < margin || x > stage.clientWidth - margin || y > stage.clientHeight - margin
      if (!button.hidden) button.style.transform = `translate(${x - 7}px,${y - 7}px)`
    }
    for (const { element, marker, label, line } of callouts) {
      const facing = marker.normal.dot(new Vec3().sub(camera.position, marker.point).normalize())
      const point = marker.point.clone()
      camera.project(point)
      const width = stage.clientWidth, height = stage.clientHeight
      const x = (point.x + 1) * width / 2, y = (1 - point.y) * height / 2
      element.hidden = facing < .35 || x < 0 || x > width || y < 0 || y > height
      if (element.hidden) continue
      const left = marker.zone.id === 'antebrazo-interior'
      const labelWidth = label.offsetWidth
      const labelX = left ? 4 : width - labelWidth - 8
      const labelY = y + (left ? 39 : -24)
      const dx = (left ? labelX + labelWidth : labelX) - x
      const dy = labelY - y
      label.style.transform = `translate(${labelX}px,${labelY}px) translateY(-50%)`
      line.style.transform = `translate(${x}px,${y}px) rotate(${Math.atan2(dy, dx)}rad) scaleX(${Math.hypot(dx, dy)})`
    }
    if (selected) {
      const p = selected.point.clone()
      camera.project(p)
      const x = Math.min(Math.max(8, (p.x + 1) * stage.clientWidth / 2 + 44), stage.clientWidth - hud.offsetWidth - 8)
      const y = Math.min(Math.max(8, (1 - p.y) * stage.clientHeight / 2 + stage.clientHeight * .26), stage.clientHeight - hud.offsetHeight - 8)
      hud.style.setProperty('--hud-x', `${Math.max(8, x)}px`)
      hud.style.setProperty('--hud-y', `${Math.max(8, y)}px`)
    }
  }
  frame = requestAnimationFrame(draw)

  function stop() {
    if (stopped) return
    stopped = true
    cancelAnimationFrame(frame)
    observer.disconnect()
    visibilityObserver.disconnect()
    geometries.forEach(buffer => buffer.remove())
    decals.forEach(decal => decal.dispose())
    programs.forEach(program => program.remove())
  }
  signal.addEventListener('abort', stop, { once: true })
  return {
    stop,
    zoom,
    update(placement: Placement) {
      const marker = markers.find(item => item.zone === placement.zone)
      if (selected !== marker) {
        selected = marker
        target = marker ? marker.point.clone() : new Vec3(0, 85, 0)
        goalDistance = marker ? Math.max(41, marker.zone.max * 2.65) : 320
        if (marker) {
          const angle = Math.atan2(marker.normal.x, marker.normal.z)
          goalAzimuth = azimuth + Math.atan2(Math.sin(angle - azimuth), Math.cos(angle - azimuth))
          goalPitch = Math.asin(marker.normal.y)
        }
      }
      for (const item of markers) {
        item.button?.setAttribute('aria-pressed', String(item === marker))
        item.button?.classList.toggle('has-ink', Boolean(placement.src) && item === marker)
      }
      active.update(placement)
      dirty = true
    },
  }
}

function projectDecal({ zone, size, aspect, rotation, x, y }: Placement, normal: Vec3) {
  if (!zone) return
  const forearm = zone.id.startsWith('antebrazo-')
  const axis = forearm ? new Vec3(zone.center[0] < 0 ? .28 : -.28, 1, -.085).normalize() : new Vec3(0, 1, 0)
  const horizontal = new Vec3().cross(axis, normal).normalize()
  const vertical = new Vec3().cross(normal, horizontal).normalize()
  const center = new Vec3(...zone.center)
  const radial = new Vec3().cross(horizontal, axis).normalize()
  const anchor = forearm && surface(center, radial)
  const wrapRadius = anchor ? center.distance(new Vec3(...anchor)) : 0
  const radians = -rotation * Math.PI / 180, cos = Math.cos(radians), sin = Math.sin(radians)
  const width = size * Math.min(1, aspect), height = size / Math.max(1, aspect)
  const resolution = 36, stride = resolution + 1
  const positions: number[] = [], uv: number[] = [], valid: boolean[] = [], indices: number[] = []
  for (let row = 0; row <= resolution; row++) {
    for (let column = 0; column <= resolution; column++) {
      const u = column / resolution, v = row / resolution
      const px = (u - .5) * width, py = (v - .5) * height
      const dx = x + px * cos - py * sin, dy = y + px * sin + py * cos
      const angle = wrapRadius ? dx / wrapRadius : 0
      const ray = wrapRadius ? radial.clone().scale(Math.cos(angle)).add(horizontal.clone().scale(Math.sin(angle))) : normal
      const sample = center.clone().add((wrapRadius ? axis : vertical).clone().scale(dy))
      if (!wrapRadius) sample.add(horizontal.clone().scale(dx))
      const hit = surface(sample, ray, wrapRadius ? 6 : 19)
      valid.push(Boolean(hit))
      positions.push(...(hit ? new Vec3(...hit).add(ray.clone().scale(.26)) : sample))
      uv.push(u, v)
      if (!row || !column) continue
      const end = row * stride + column, a = end - stride - 1, b = end - stride, c = end - 1
      if (valid[a] && valid[b] && valid[c]) indices.push(a, b, c)
      if (valid[b] && valid[end] && valid[c]) indices.push(b, end, c)
    }
  }
  if (indices.length) return { positions: new Float32Array(positions), uv: new Float32Array(uv), indices: new Uint16Array(indices) }
}
