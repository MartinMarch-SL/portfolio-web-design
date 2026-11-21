import { beforeEach, describe, expect, it, vi } from 'vitest'
import astroConfig from '../../astro.config.mjs'
import { url } from '../../src/lib/url'

describe('url', () => {
  beforeEach(() => {
    vi.stubEnv('BASE_URL', `${astroConfig.base}/`)
  })

  it('conserva la barra final en las rutas de páginas', () => {
    expect(url('ruido/')).toBe('/portfolio-web-design/ruido/')
  })

  it('une las rutas de recursos sin duplicar barras', () => {
    expect(url('/examples/ruido/img/a.webp')).toBe('/portfolio-web-design/examples/ruido/img/a.webp')
  })

  it('devuelve la raíz del sitio cuando la ruta está vacía', () => {
    expect(url('')).toBe('/portfolio-web-design/')
  })
})
