import { url } from '../../../lib/url'

export const route = (path = '') => url('halda/' + path)
export const image = (path: string) => url('examples/halda/img/' + path)
