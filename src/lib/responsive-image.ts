import { url } from './url'

export function responsiveImage(path: string, sizes: string, originalWidth = 1200) {
  const src = url(path)
  const variants = [640, 1080].map(width => `${src.replace(/\.webp$/, `-${width}w.webp`)} ${width}w`)
  return { src, srcset: [...variants, `${src} ${originalWidth}w`].join(', '), sizes }
}
