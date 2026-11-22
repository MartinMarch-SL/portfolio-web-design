import { responsiveImage } from '../../../lib/responsive-image'
import { url } from '../../../lib/url'

export const route = (path = '') => url('pinar-alto/' + path)
export const image = (name: string) => url('examples/pinar-alto/img/' + name)
export function photo(name: string, sizes = '(max-width: 630px) 100vw, 50vw') {
  const [width, height] = name === 'pabellon-noche' ? [1600, 1000]
    : name === 'entrada' ? [1440, 960] : [1200, 800]
  return { ...responsiveImage(`examples/pinar-alto/img/${name}.webp`, sizes, width), width, height }
}
