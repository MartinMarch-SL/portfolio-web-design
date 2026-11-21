import { url } from '../lib/url'

interface Project {
  n: string
  name: string
  sector: string
  href?: string
  preview?: string
  status: 'live' | 'soon'
}

export const projects: Project[] = [
  { n: '01', name: 'RUIDO', sector: 'Moda urbana', href: url('ruido/'), preview: 'showcase/img/ruido-preview.webp', status: 'live' },
  { n: '02', name: 'Bar Caribe', sector: 'Bar de barrio', href: url('bar-caribe/'), preview: 'showcase/img/bar-caribe-preview.webp', status: 'live' },
  { n: '03', name: 'Estudio de arquitectura', sector: 'Arquitectura', status: 'soon' },
  { n: '04', name: 'Fisioterapia', sector: 'Salud', status: 'soon' },
  { n: '05', name: 'Fotografía de bodas', sector: 'Fotografía', status: 'soon' },
  { n: '06', name: 'Inmobiliaria', sector: 'Vivienda', status: 'soon' },
]
