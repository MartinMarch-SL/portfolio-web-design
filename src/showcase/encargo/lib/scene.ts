import { Box, Camera, Mesh, Plane, Program, Renderer, Texture, Transform } from 'ogl'

const vertex = `
attribute vec3 position;
attribute vec2 uv;
uniform mat4 modelViewMatrix, projectionMatrix;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`

export function createScene(host: HTMLElement, desktop: HTMLCanvasElement, phone: HTMLCanvasElement, onFailure: () => void) {
  const renderer = new Renderer({ dpr: Math.min(devicePixelRatio, 1.75), alpha: true, antialias: true })
  const { gl } = renderer
  if (!gl) throw new Error('WebGL no disponible')
  gl.clearColor(0, 0, 0, 0)
  host.append(gl.canvas)
  const world = new Transform()
  const camera = new Camera(gl, { fov: 34 })
  camera.position.set(0, 0, 9)
  const bodyProgram = new Program(gl, {
    vertex: `attribute vec3 position, normal;
      uniform mat4 modelViewMatrix, projectionMatrix;
      uniform mat3 normalMatrix;
      varying vec3 vNormal;
      void main() { vNormal = normalMatrix * normal; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragment: `precision mediump float;
      varying vec3 vNormal;
      void main() {
        float light = 0.31 + 0.69 * max(0.0, dot(normalize(vNormal), normalize(vec3(-.55,.7,.62))));
        gl_FragColor = vec4(vec3(.34,.34,.34) * light,1.);
      }`,
  })
  const blend = { value: 1 }
  const devices = [desktop, phone].map((canvas, index) => {
    const mobile = index === 1
    const width = mobile ? 1.22 : 4.72
    const height = mobile ? 2.25 : width * 540 / 840
    const group = new Transform()
    group.setParent(world)

    const shadow = new Mesh(gl, {
      geometry: new Plane(gl, { width: width * 1.53, height: height * 1.28 }),
      program: new Program(gl, {
        vertex, transparent: true, depthWrite: false, depthTest: true,
        fragment: `precision mediump float;
          varying vec2 vUv;
          void main() {
            vec2 p = abs(vUv * 2. - 1.);
            float ambient = pow(max(0., 1. - dot(p,p)), 2.6) * .29;
            float contact = pow(max(0., 1. - length(p * vec2(1.18,2.2))), 2.) * .44;
            gl_FragColor = vec4(.02,.02,.02,ambient + contact);
          }`,
      }),
      renderOrder: -1,
    })
    shadow.setParent(world)

    const caseMesh = new Mesh(gl, {
      geometry: new Box(gl, { width: width + .14, height: height + (mobile ? .18 : .28), depth: mobile ? .23 : .25 }),
      program: bodyProgram,
    })
    caseMesh.setParent(group)
    const lip = new Mesh(gl, {
      geometry: new Box(gl, { width: width + .065, height: height + (mobile ? .1 : .2), depth: .06 }),
      program: bodyProgram,
    })
    lip.position.z = .135
    lip.setParent(group)

    const previous = document.createElement('canvas')
    previous.width = canvas.width
    previous.height = canvas.height
    const previousCtx = previous.getContext('2d')!
    const current = new Texture(gl, { image: canvas, generateMipmaps: false })
    const old = new Texture(gl, { image: previous, generateMipmaps: false })
    const screen = new Mesh(gl, {
      geometry: new Plane(gl, { width, height }),
      program: new Program(gl, {
        vertex,
        uniforms: { current: { value: current }, previous: { value: old }, blend },
        fragment: `precision mediump float;
          uniform sampler2D current, previous;
          uniform float blend;
          varying vec2 vUv;
          void main() { gl_FragColor = mix(texture2D(previous,vUv), texture2D(current,vUv), blend); }`,
      }),
    })
    screen.position.set(0, mobile ? 0 : -.055, .169)
    screen.setParent(group)
    return { group, shadow, canvas, current, old, previousCtx }
  })

  let start = -1000
  let frame = 0
  let visible = true
  let stopped = false
  let aspect = 1
  const hover = matchMedia('(hover: hover) and (pointer: fine)')
  let depth = 1
  let targetX = 0, targetY = 0, pointerX = 0, pointerY = 0
  host.addEventListener('pointermove', event => {
    if (!hover.matches || event.pointerType === 'touch') return
    const bounds = host.getBoundingClientRect()
    targetX = (event.clientX - bounds.left) / bounds.width - .5
    targetY = (event.clientY - bounds.top) / bounds.height - .5
  })
  host.addEventListener('pointerleave', () => { targetX = targetY = 0 })
  function draw(time: number) {
    frame = 0
    if (stopped || !visible || !host.clientWidth) return
    pointerX += ((hover.matches ? targetX : 0) - pointerX) * .045
    pointerY += ((hover.matches ? targetY : 0) - pointerY) * .045
    const progress = Math.min(1, Math.max(0, (time - start) / 740))
    blend.value = progress * progress * (3 - 2 * progress)
    const slow = time * .00085
    const [large, small] = devices
    large.group.position.set(-.55, .27 + depth * Math.sin(slow) * .045, -.18)
    large.group.rotation.set(-.24 + pointerY * .13 * depth, .37 + pointerX * .17 * depth, .035)
    small.group.position.set(1.89, -.65 + depth * Math.sin(slow + 1.1) * .05, .94)
    small.group.rotation.set(-.15 + pointerY * .16 * depth, -.39 + pointerX * .19 * depth, -.115)
    large.shadow.position.set(-.15, -1.47, -.85)
    large.shadow.rotation.set(-.83, .08, -.06)
    small.shadow.position.set(2.08, -1.74, -.16)
    small.shadow.rotation.set(-.92, -.1, -.08)
    world.scale.set(1.11 * Math.min(1, aspect / 1.35, 1.62 / aspect))
    renderer.render({ scene: world, camera })
    if (depth || progress < 1) frame = requestAnimationFrame(draw)
  }
  const wake = () => { if (!frame && !stopped && visible) frame = requestAnimationFrame(draw) }
  const resize = new ResizeObserver(() => {
    const { clientWidth, clientHeight } = host
    if (!clientWidth || !clientHeight) return
    renderer.setSize(clientWidth, clientHeight)
    aspect = clientWidth / clientHeight
    camera.perspective({ aspect })
    wake()
  })
  resize.observe(host)
  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
    wake()
  })
  intersection.observe(host)

  function stop() {
    stopped = true
    cancelAnimationFrame(frame)
    resize.disconnect()
    intersection.disconnect()
    gl.canvas.remove()
  }
  gl.canvas.addEventListener('webglcontextlost', () => {
    if (stopped) return
    stop()
    onFailure()
  }, { once: true })
  return {
    stop() {
      stop()
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    },
    beforePaint() {
      for (const { previousCtx, canvas, old } of devices) {
        previousCtx.globalAlpha = blend.value
        previousCtx.drawImage(canvas, 0, 0)
        previousCtx.globalAlpha = 1
        old.needsUpdate = true
      }
    },
    afterPaint(level: number) {
      for (const { current } of devices) current.needsUpdate = true
      depth = level * .6
      start = performance.now()
      blend.value = 0
      wake()
    },
  }
}
