import { Camera, Renderer, Vec3 } from 'ogl'
import type { Scene } from '../data/cases'
import { makeModel, type Mark } from './models'
import type { XYZ } from './geometry'

const namespace = 'http://www.w3.org/2000/svg'
const corners: XYZ[] = [
  [-1,-1,-1], [1,-1,-1], [1,1,-1], [-1,1,-1],
  [-1,-1,1], [1,-1,1], [1,1,1], [-1,1,1],
]
const edges = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]]

function overlay(container: HTMLElement, marks: Mark[], camera: Camera) {
  const wire = document.createElementNS(namespace, 'svg')
  wire.classList.add('scene-wire')
  const entries = marks.map(mark => {
    const tag = document.createElement('span')
    tag.className = 'scene-tag' + (mark.defect ? ' defect' : mark.neutral ? ' neutral' : '')
    tag.textContent = mark.label
    const path = mark.bounds || mark.leader ? document.createElementNS(namespace, 'path') : undefined
    if (path) {
      if (mark.defect) path.classList.add('defect')
      if (mark.neutral) path.classList.add('neutral')
      wire.append(path)
    }
    return { mark, tag, path }
  })
  container.replaceChildren(wire, ...entries.map(entry => entry.tag))
  const vector = new Vec3()
  function project(point: XYZ, width: number, height: number) {
    camera.project(vector.set(...point))
    return [(vector.x + 1) * width / 2, (1 - vector.y) * height / 2]
  }
  return (width: number, height: number) => {
    for (const { mark, tag, path } of entries) {
      const visible = mark.visible?.() ?? true
      tag.hidden = !visible
      path?.toggleAttribute('hidden', !visible)
      if (!visible) continue
      const anchor = mark.point()
      let [x,y] = project(anchor,width,height)
      if (path && mark.bounds) {
        const size = mark.bounds
        const points = corners.map(corner => project(anchor.map((v,i) => v + corner[i]*size[i]/2) as XYZ,width,height))
        path.setAttribute('d', edges.map(([a,b]) => 'M' + points[a].join(' ') + 'L' + points[b].join(' ')).join(' '))
        y = Math.min(...points.map(point => point[1])) - 16
      }
      x = Math.max(5, Math.min(width - tag.offsetWidth - 5, x))
      y = Math.max(5, Math.min(height - 17, y))
      if (path && mark.leader) {
        const [tx,ty] = project(mark.leader(),width,height)
        path.setAttribute('d', 'M' + tx + ' ' + ty + 'L' + x + ' ' + (y + 7))
      }
      tag.style.transform = 'translate3d(' + Math.round(x) + 'px,' + Math.round(y) + 'px,0)'
    }
  }
}

export function mountScenes(stages: NodeListOf<HTMLElement>, signal: AbortSignal) {
  const source = document.createElement('canvas')
  const dpr = Math.min(devicePixelRatio, 1.5)
  let renderer: Renderer | undefined
  let unavailable = false

  function getRenderer() {
    if (unavailable) return
    if (!renderer) {
      try {
        renderer = new Renderer({ canvas: source, dpr, alpha: false, antialias: true, powerPreference: 'low-power' })
        renderer.gl.clearColor(6/255,7/255,8/255,1)
      } catch {
        unavailable = true
      }
    }
    return renderer
  }

  const mounted = Array.from(stages, stage => mountScene(stage, signal, getRenderer, dpr))
  source.addEventListener('webglcontextlost', event => {
    event.preventDefault()
    unavailable = true
    renderer = undefined
    mounted.forEach(stage => stage.lost())
  }, { signal })
  source.addEventListener('webglcontextrestored', () => {
    unavailable = false
    mounted.forEach(stage => stage.restore())
  }, { signal })
  signal.addEventListener('abort', () => {
    renderer?.gl.getExtension('WEBGL_lose_context')?.loseContext()
  }, { once:true })
}

function mountScene(stage: HTMLElement, signal: AbortSignal, getRenderer: () => Renderer | undefined, dpr: number) {
  const canvas = stage.querySelector('canvas')!
  const still = stage.querySelector<HTMLImageElement>('[data-still]')!
  const overlayNode = stage.querySelector<HTMLElement>('.scene-overlay')!
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  const pointer = matchMedia('(hover: hover) and (pointer: fine)')
  const display = canvas.getContext('2d', { alpha: false })
  let camera: Camera
  let model: ReturnType<typeof makeModel> | undefined
  let drawMarks: ReturnType<typeof overlay> | undefined
  let id = stage.dataset.scene as Scene
  let visible = false
  let failed = false
  let frame = 0
  let elapsed = 0
  let last = 0
  let transition = 1
  let width = 0, height = 0
  let px = 0, py = 0, ox = 0, oy = 0
  let reveal: Animation | undefined
  const lookAt = new Vec3()

  function fallback() {
    canvas.hidden = true
    still.hidden = false
    overlayNode.replaceChildren()
    stage.removeAttribute('data-rendered')
  }

  function request() {
    if (visible && !frame && !failed && !document.hidden) frame = requestAnimationFrame(render)
  }

  function render(now: number) {
    frame = 0
    if (!visible || document.hidden || failed) return
    if (!reduced.matches && id === 'hero' && last && now-last < 31) {
      request()
      return
    }
    try {
      const renderer = getRenderer()
      if (!renderer || !display) {
        failed = true
        return
      }
      if (!model) {
        camera = new Camera(renderer.gl, { fov: 38, near: .1, far: 70 })
        model = makeModel(renderer.gl, id, dpr)
        drawMarks = overlay(overlayNode, model.marks, camera)
        width = height = 0
      }
      const delta = last ? Math.min(.06, (now-last)/1000) : 0
      last = now
      const nextWidth = stage.clientWidth
      const nextHeight = stage.clientHeight
      if (!nextWidth || !nextHeight) return
      if (nextWidth !== width || nextHeight !== height) {
        width = nextWidth
        height = nextHeight
        // Expand vertical framing for narrow stages while keeping the same subject width.
        const aspect = width/height
        const fov = 2*Math.atan(Math.tan(19*Math.PI/180) * Math.max(1,1.41/aspect))*180/Math.PI
        camera.perspective({ aspect, fov })
      }
      if (reduced.matches) {
        ox = 0
        oy = 0
        transition = 1
      } else {
        elapsed += delta
        transition = Math.min(1, transition + delta / .82)
        ox += ((pointer.matches ? px : 0) - ox) * .08
        oy += ((pointer.matches ? py : 0) - oy) * .08
      }
      const settle = (1-transition)**3
      const [x,y,z] = model.eye
      camera.position.set(x + ox*.63 - settle*2.7,y + oy*.43 + settle*.82,z + settle*1.65)
      camera.lookAt(lookAt.set(...model.target))
      model.update(reduced.matches ? 0 : elapsed)
      if (renderer.gl.canvas.width !== Math.floor(width*dpr) || renderer.gl.canvas.height !== Math.floor(height*dpr)) renderer.setSize(width,height)
      renderer.render({ scene: model.root, camera })
      if (renderer.gl.isContextLost()) return
      const source = renderer.gl.canvas
      if (canvas.width !== source.width) canvas.width = source.width
      if (canvas.height !== source.height) canvas.height = source.height
      // Copy before compositing discards the WebGL drawing buffer.
      display.drawImage(source, 0, 0)
      drawMarks?.(width,height)
      if (canvas.hidden) {
        canvas.hidden = false
        still.hidden = true
        stage.setAttribute('data-rendered','')
        if (transition < 1 && !reduced.matches) {
          reveal?.cancel()
          reveal = canvas.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, easing: 'ease-out' })
        }
      }
      const moving = id === 'hero' || id === 'edge'
      const aim = pointer.matches && (Math.abs(px-ox) > .002 || Math.abs(py-oy) > .002)
      if (!reduced.matches && (moving || aim || transition < 1)) request()
      else last = 0
    } catch {
      failed = true
      fallback()
    }
  }

  function pause() {
    cancelAnimationFrame(frame)
    frame = 0
    last = 0
  }
  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
    if (visible) request()
    else pause()
  })
  intersection.observe(stage)
  const resize = new ResizeObserver(request)
  resize.observe(stage)
  stage.addEventListener('halda:scene', () => {
    const next = stage.dataset.scene as Scene
    if (next === id) return
    id = next
    reveal?.cancel()
    model?.release()
    model = undefined
    failed = false
    last = 0
    transition = 0
    elapsed = 0
    fallback()
    request()
  }, { signal })
  stage.addEventListener('pointermove', event => {
    if (!pointer.matches || reduced.matches || event.pointerType !== 'mouse') return
    const rect = stage.getBoundingClientRect()
    px = (event.clientX-rect.left)/rect.width*2-1
    py = 1-(event.clientY-rect.top)/rect.height*2
    request()
  }, { signal, passive:true })
  stage.addEventListener('pointerleave', () => { px = py = 0; request() }, { signal })
  reduced.addEventListener('change', () => { reveal?.cancel(); request() }, { signal })
  pointer.addEventListener('change', request, { signal })
  document.addEventListener('visibilitychange', () => document.hidden ? pause() : request(), { signal })
  signal.addEventListener('abort', () => {
    pause()
    reveal?.cancel()
    intersection.disconnect()
    resize.disconnect()
    model?.release()
  }, { once:true })

  return {
    lost() {
      failed = true
      model = undefined
      pause()
      reveal?.cancel()
      fallback()
    },
    restore() {
      failed = false
      request()
    },
  }
}
