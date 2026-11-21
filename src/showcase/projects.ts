import { url } from '../lib/url'

interface Project {
  n: string
  name: string
  sector: string
  year: number
  tags: string[]
  href?: string
  preview?: string
  status: 'live' | 'soon'
}

export const projects: Project[] = [
  { n: '01', name: 'RUIDO', sector: 'Moda urbana', year: 2026, tags: ['Lookbook', 'Tienda'], href: url('ruido/'), preview: url('showcase/img/ruido-preview.webp'), status: 'live' },
  { n: '02', name: 'Restaurante', sector: 'Gastronomía', year: 2026, tags: ['Carta', 'Reservas'], status: 'soon' },
  { n: '03', name: 'Estudio de arquitectura', sector: 'Arquitectura', year: 2026, tags: ['Obra', 'Estudio'], status: 'soon' },
  { n: '04', name: 'Fisioterapia', sector: 'Salud', year: 2026, tags: ['Tratamientos', 'Citas'], status: 'soon' },
  { n: '05', name: 'Fotografía de bodas', sector: 'Fotografía', year: 2026, tags: ['Galerías', 'Contacto'], status: 'soon' },
  { n: '06', name: 'Inmobiliaria', sector: 'Vivienda', year: 2026, tags: ['Inmuebles', 'Visitas'], status: 'soon' },
]
