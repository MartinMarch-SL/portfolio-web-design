import { Box, Camera, Mesh, Plane, Program, Transform } from 'ogl'
import { createRenderer, loadImage, texture, visibleRender } from './webgl'

const vertex = `
  attribute vec3 position, normal;
  attribute vec2 uv;
  uniform mat4 modelViewMatrix, projectionMatrix;
  uniform mat3 normalMatrix;
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
  }
`
const fragment = `
  precision mediump float;
  uniform sampler2D surface;
  uniform vec3 tint;
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vec3 light = normalize(vec3(-.5, .7, 1.));
    float shade = .64 + .4 * max(dot(normalize(vNormal), light), 0.);
    gl_FragColor = vec4(texture2D(surface, vUv).rgb * tint * shade, 1.);
  }
`

function canvasTexture(width: number, height: number) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Lienzo no disponible')
  return { canvas, context }
}

const backSize = 1024
const fold = 31
const beam = 73
const brace = 58

function linenSurface(ctx: CanvasRenderingContext2D, linen: HTMLImageElement, width: number, height: number) {
  ctx.fillStyle = ctx.createPattern(linen, 'repeat') ?? '#f5efe3'
  ctx.fillRect(0, 0, width, height)
  ctx.globalCompositeOperation = 'multiply'
  ctx.fillStyle = '#c7b28e'
  ctx.fillRect(0, 0, width, height)
  ctx.globalCompositeOperation = 'source-over'
  for (let x = 0; x < width; x += 5) {
    ctx.fillStyle = x % 10 ? '#5d46301c' : '#fff2cf36'
    ctx.fillRect(x, 0, 2, height)
  }
  for (let y = 0; y < height; y += 5) {
    ctx.fillStyle = y % 10 ? '#fff2cf2f' : '#5d463027'
    ctx.fillRect(0, y, width, 2)
  }
}

function backTexture(linen: HTMLImageElement, { title, year, technique }: DOMStringMap) {
  const { canvas, context: ctx } = canvasTexture(backSize, backSize)
  linenSurface(ctx, linen, backSize, backSize)

  ctx.fillStyle = '#74604635'
  ctx.fillRect(0, 0, backSize, backSize)
  ctx.clearRect(fold, fold, backSize - 2 * fold, backSize - 2 * fold)
  ctx.save()
  ctx.beginPath()
  ctx.rect(fold, fold, backSize - 2 * fold, backSize - 2 * fold)
  ctx.clip()
  linenSurface(ctx, linen, backSize, backSize)
  ctx.shadowColor = '#352619a0'
  ctx.shadowBlur = 24
  ctx.shadowOffsetY = 6
  const length = backSize - 2 * fold
  ctx.fillStyle = '#755234'
  ctx.fillRect(fold, fold, beam, length)
  ctx.fillRect(backSize - fold - beam, fold, beam, length)
  ctx.fillRect(fold, fold, length, beam)
  ctx.fillRect(fold, backSize - fold - beam, length, beam)
  ctx.fillRect(fold, (backSize - brace) / 2, length, brace)
  ctx.restore()

  ctx.strokeStyle = '#6c573c93'
  ctx.lineWidth = 2
  ctx.strokeRect(fold, fold, backSize - 2 * fold, backSize - 2 * fold)
  for (let turn = 0; turn < 4; turn++) {
    ctx.save()
    ctx.translate(backSize / 2, backSize / 2)
    ctx.rotate(turn * Math.PI / 2)
    for (let x = -450; x <= 450; x += 60) {
      const y = -backSize / 2 + 17 + Math.sin(x) * 3
      ctx.fillStyle = '#483f33'
      ctx.fillRect(x, y, 18, 5)
      ctx.fillStyle = '#d5d0bf'
      ctx.fillRect(x + 2, y + 1, 14, 2)
    }
    ctx.restore()
  }

  ctx.save()
  ctx.translate(599, 655)
  ctx.rotate(-.07)
  ctx.fillStyle = '#453831'
  ctx.font = '42px Caveat, cursive'
  ctx.fillText(title ?? '', 0, 0, 300)
  ctx.font = '30px Caveat, cursive'
  ctx.fillText(`${year} · ${technique?.toLowerCase()}`, 7, 45, 300)
  ctx.font = '54px Caveat, cursive'
  ctx.fillText('Simón Lera', 77, 117, 220)
  ctx.restore()
  return canvas
}

function wrapTexture(linen: HTMLImageElement) {
  const { canvas, context: ctx } = canvasTexture(1024, 48)
  linenSurface(ctx, linen, 1024, 48)
  const foldShade = ctx.createLinearGradient(0, 0, 0, 48)
  foldShade.addColorStop(0, '#9c4f30b0')
  foldShade.addColorStop(.24, '#9c4f3025')
  foldShade.addColorStop(.73, '#49321a00')
  foldShade.addColorStop(1, '#49321a91')
  ctx.fillStyle = foldShade
  ctx.fillRect(0, 0, 1024, 48)
  for (const [corner, direction] of [[0, 1], [1024, -1]]) {
    ctx.fillStyle = '#614b325e'
    ctx.beginPath()
    ctx.moveTo(corner, 0)
    ctx.lineTo(corner + direction * 52, 48)
    ctx.lineTo(corner + direction * 38, 48)
    ctx.closePath()
    ctx.fill()
  }
  return canvas
}

function woodTexture() {
  const { canvas, context: ctx } = canvasTexture(96, 1024)
  ctx.fillStyle = '#906440'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  for (let i = 0; i < 75; i++) {
    const x = (i * 47) % canvas.width
    ctx.strokeStyle = i % 3 ? '#47291640' : '#eac39755'
    ctx.lineWidth = 1 + i % 3
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.bezierCurveTo(x + 11, 300, x - 14, 680, x + 6, 1024)
    ctx.stroke()
  }
  const bevel = ctx.createLinearGradient(0, 0, canvas.width, 0)
  bevel.addColorStop(0, '#332012bc')
  bevel.addColorStop(.09, '#33201230')
  bevel.addColorStop(.11, '#33201200')
  bevel.addColorStop(.89, '#fff1cd00')
  bevel.addColorStop(.91, '#fff1cd60')
  bevel.addColorStop(1, '#fff1cd1a')
  ctx.fillStyle = bevel
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  return canvas
}

export async function mountHero(hero: HTMLElement, reduced: MediaQueryList) {
  const container = hero.querySelector<HTMLElement>('[data-hero-canvas]')!
  const stage = hero.firstElementChild as HTMLElement
  const [front, linen] = await Promise.all([
    loadImage(hero.dataset.source!),
    loadImage(hero.dataset.linen!),
    document.fonts.load('400 42px Caveat').catch(() => []),
  ])
  if (reduced.matches) return
  const renderer = createRenderer()
  const { gl } = renderer
  const camera = new Camera(gl, { fov: 33 })
  const scene = new Transform()
  const canvas = new Transform()
  canvas.setParent(scene)
  const width = 2 * front.width / front.height
  const height = 2
  const depth = .085
  const material = (image: HTMLImageElement | HTMLCanvasElement, tint = [1, 1, 1]) =>
    new Program(gl, { vertex, fragment, uniforms: { surface: { value: texture(renderer, image) }, tint: { value: tint } } })
  function mount(geometry: Box | Plane, program: Program, x = 0, y = 0, z = 0) {
    const part = new Mesh(gl, { geometry, program })
    part.position.set(x, y, z)
    part.setParent(canvas)
    return part
  }
  const plane = new Plane(gl, { width, height })
  mount(plane, material(front), 0, 0, depth / 2)
  mount(plane, material(backTexture(linen, hero.dataset)), 0, 0, -depth / 2).rotation.y = Math.PI

  const wrap = material(wrapTexture(linen))
  const horizontalEdge = new Plane(gl, { width, height: depth })
  const verticalEdge = new Plane(gl, { width: height, height: depth })
  for (const sign of [-1, 1]) {
    mount(horizontalEdge, wrap, 0, sign * height / 2).rotation.x = -sign * Math.PI / 2
    const edge = mount(verticalEdge, wrap, sign * width / 2)
    edge.rotation.order = 'ZYX'
    edge.rotation.set(-Math.PI / 2, 0, -sign * Math.PI / 2)
  }

  const wood = material(woodTexture())
  const xUnit = width / backSize
  const yUnit = height / backSize
  const inset = fold + beam / 2
  const barDepth = .06
  const barZ = -(depth + barDepth) / 2
  const upright = new Box(gl, { width: beam * xUnit, height: (backSize - 2 * fold) * yUnit, depth: barDepth })
  const span = (backSize - 2 * (fold + beam)) * xUnit
  const rail = new Box(gl, { width: beam * yUnit, height: span, depth: barDepth })
  for (const sign of [-1, 1]) {
    mount(upright, wood, sign * (backSize / 2 - inset) * xUnit, 0, barZ)
    mount(rail, wood, 0, sign * (backSize / 2 - inset) * yUnit, barZ).rotation.z = Math.PI / 2
  }
  mount(new Box(gl, { width: brace * yUnit, height: span, depth: barDepth * .8 }), wood, 0, 0, barZ).rotation.z = Math.PI / 2

  container.append(gl.canvas)
  hero.classList.add('is-live')
  let angle = -.19
  function draw(time: number) {
    const distance = Math.max(hero.offsetHeight - stage.offsetHeight, 1)
    const progress = Math.min(1, Math.max(0, -hero.getBoundingClientRect().top / distance))
    const target = -.19 + progress * (Math.PI * 2 - .07)
    angle += (target - angle) * .065
    canvas.rotation.y = angle + Math.sin(time / 1600) * .025
    canvas.rotation.x = -.05 + Math.sin(time / 2000) * .018
    canvas.rotation.z = -.025
    const aspect = renderer.width / renderer.height || 1
    camera.perspective({ aspect })
    camera.position.z = 4.5 * Math.max(1, .83 / aspect)
    renderer.render({ scene, camera })
    if (!gl.isContextLost()) hero.classList.add('is-ready')
    hero.style.setProperty('--shadow-width', String(.34 + .66 * Math.abs(Math.cos(angle))))
  }
  const dispose = visibleRender(container, renderer, draw, fallback)
  function fallback() {
    hero.classList.remove('is-live', 'is-ready')
    container.replaceChildren()
    reduced.removeEventListener('change', onMotion)
  }
  function onMotion() {
    if (!reduced.matches) return
    dispose()
    fallback()
    gl.getExtension('WEBGL_lose_context')?.loseContext()
  }
  reduced.addEventListener('change', onMotion)
}
