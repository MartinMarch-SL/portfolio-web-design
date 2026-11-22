import { Renderer, Texture } from 'ogl'

export function loadImage(source: string) {
  const image = new Image()
  image.src = source
  return image.decode().then(() => image)
}

export function createRenderer() {
  const canvas = document.createElement('canvas')
  const context = { alpha: true, antialias: true }
  if (!canvas.getContext('webgl2', context) && !canvas.getContext('webgl', context)) {
    throw new Error('WebGL no disponible')
  }
  return new Renderer({ canvas, ...context, dpr: Math.min(devicePixelRatio, 2) })
}

export function texture(renderer: Renderer, image: HTMLImageElement | HTMLCanvasElement) {
  return new Texture(renderer.gl, { image, generateMipmaps: false, minFilter: renderer.gl.LINEAR })
}

export function visibleRender(container: HTMLElement, renderer: Renderer, draw: (time: number) => void, lost: () => void) {
  let frame = 0
  let visible = false
  let disposed = false
  function stop() {
    cancelAnimationFrame(frame)
    frame = 0
  }
  function schedule() {
    if (visible && !disposed && !document.hidden && !frame) frame = requestAnimationFrame(render)
    else if (document.hidden || !visible) stop()
  }
  function render(time: number) {
    frame = 0
    if (!container.isConnected) {
      dispose()
      return
    }
    if (container.clientWidth && container.clientHeight && !renderer.gl.isContextLost()) draw(time)
    schedule()
  }
  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
    schedule()
  })
  const resize = new ResizeObserver(([entry]) => {
    const { width, height } = entry.contentRect
    if (width && height && (width !== renderer.width || height !== renderer.height)) renderer.setSize(width, height)
  })
  function dispose() {
    disposed = true
    stop()
    intersection.disconnect()
    resize.disconnect()
    document.removeEventListener('visibilitychange', schedule)
  }
  renderer.gl.canvas.addEventListener('webglcontextlost', () => {
    dispose()
    lost()
  }, { once: true })
  intersection.observe(container)
  resize.observe(container)
  document.addEventListener('visibilitychange', schedule)
  return dispose
}
