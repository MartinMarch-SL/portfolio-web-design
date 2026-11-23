import { url } from '../../../lib/url'

export const route = (path = '') => url('las-moreras/' + path)
export const image = (name: string) => url('examples/las-moreras/img/' + name)
