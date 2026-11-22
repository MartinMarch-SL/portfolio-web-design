import { url } from '../../../lib/url'

export const route = (path = '') => url('ramal/' + path)
export const image = (name: string) => url('examples/ramal/img/' + name)
