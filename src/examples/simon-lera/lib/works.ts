import { works } from '../data/works'

export type Work = typeof works[number]
export const workPath = (work: Work) => `simon-lera/obra/${work.slug}/`
export const imagePath = (key: string) => `examples/simon-lera/img/${key}.webp`
export const transitionName = (work: Work) => `lienzo-${work.slug}`
export const dimensions = (work: Work) => `${work.width} × ${work.height} cm`
export const imageSize = (work: Work) => ({
  width: Math.round(1200 * work.width / Math.max(work.width, work.height)),
  height: Math.round(1200 * work.height / Math.max(work.width, work.height)),
})

export function scaleScene(work: Work) {
  const width = Math.max(380, work.width + 110)
  const bottom = Math.max(104, 145 - work.height / 2)
  return { width, height: Math.max(220, bottom + work.height + 22), x: (width - work.width) / 2 - 20, bottom }
}
