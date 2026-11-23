import { url } from '../lib/url'

export const kinds = ['Tienda online', 'Reservas y citas', 'Portfolio', 'Catálogo', 'Hostelería', 'Clubes y asociaciones', 'Industria y servicios'] as const

const entries = [
  ['ruido', 'RUIDO', 'Moda urbana', 'Tienda online'],
  ['bar-caribe', 'Bar Caribe', 'Bar de barrio', 'Hostelería'],
  ['ines-arranz', 'Inés Arranz', 'Psicología', 'Reservas y citas'],
  ['mares', 'Marès', 'Inmobiliaria', 'Catálogo'],
  ['simon-lera', 'Simón Lera', 'Pintura', 'Portfolio'],
  ['lia-ferro', 'Lía Ferro', 'Tatuaje', 'Reservas y citas'],
  ['los-almendros', 'UD Los Almendros', 'Club de fútbol base', 'Clubes y asociaciones'],
  ['pinar-alto', 'CB Pinar Alto', 'Club de baloncesto', 'Clubes y asociaciones'],
  ['ramal', 'RAMAL Instalaciones', 'Instaladora MEP', 'Industria y servicios'],
  ['halda', 'HALDA', 'Visión artificial e I+D', 'Industria y servicios'],
] satisfies [string, string, string, typeof kinds[number]][]

export const projects = entries.map(([slug, name, sector, kind]) => ({
  name, sector, kind, href: url(`${slug}/`),
  desktop: url(`showcase/img/screens/${slug}-desktop.webp`),
  mobile: url(`showcase/img/screens/${slug}-mobile.webp`),
}))
