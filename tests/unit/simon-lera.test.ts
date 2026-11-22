import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { series, states, works } from '../../src/examples/simon-lera/data/works'
import { imageSize, scaleScene, transitionName } from '../../src/examples/simon-lera/lib/works'

describe('Simón Lera', () => {
  it('registers three works per series with unique routes, images and transition names', () => {
    expect(works).toHaveLength(9)
    for (const name of Object.keys(series)) {
      expect(works.filter(work => work.series === name)).toHaveLength(3)
    }
    expect(new Set(works.map(work => work.slug)).size).toBe(9)
    expect(new Set(works.map(transitionName)).size).toBe(9)
    expect(works.filter(work => work.series === 'Salitre').map(work => work.image)).toEqual(['obra-04', 'obra-05', 'obra-06'])
    expect(works.filter(work => work.series === 'Cal').map(work => work.image)).toEqual(['obra-07', 'obra-08', 'obra-09'])
    expect(works.filter(work => work.series === 'Mediodía').map(work => work.image)).toEqual(['obra-01', 'obra-02', 'obra-03'])
    expect(new Set(works.map(work => work.state))).toEqual(new Set(states))
  })

  it('keeps image proportions and fits every original-size canvas above the sofa', async () => {
    for (const work of works) {
      const image = imageSize(work)
      const scene = scaleScene(work)
      const photo = await sharp(`public/examples/simon-lera/img/${work.image}.webp`).metadata()
      expect(image).toEqual({ width: photo.width, height: photo.height })
      expect(Math.max(image.width, image.height)).toBe(1200)
      expect(image.width / image.height).toBeCloseTo(work.width / work.height, 2)
      expect(scene.x).toBeGreaterThan(0)
      expect(scene.bottom).toBeGreaterThan(86)
      expect(scene.bottom + work.height).toBeLessThan(scene.height)
      expect(scene.x + work.width).toBeLessThan(scene.width - 86)
      expect(scene.height).toBeGreaterThanOrEqual(175)
    }
  })
})
