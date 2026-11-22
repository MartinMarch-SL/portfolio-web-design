import { responsiveImage } from '../../../lib/responsive-image'
import { url } from '../../../lib/url'
export const route = (path = '') => url('los-almendros/' + path)
export const image = (name: string) => url('examples/los-almendros/img/' + name)

export const photo = (name: string, sizes = '(max-width: 630px) 100vw, 50vw') => ({
  ...responsiveImage(`examples/los-almendros/img/${name}.webp`, sizes, name === 'hero' ? 1600 : 1200),
  width: name === 'hero' ? 1600 : 1200,
  height: name === 'hero' ? 1040 : 800,
})
