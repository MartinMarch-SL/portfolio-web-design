export type Size = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL'
export type Category = 'sudaderas' | 'camisetas' | 'pantalones' | 'chaquetas' | 'accesorios'

export interface Product {
  slug: string
  name: string
  category: Category
  price: number
  colors: { name: string; hex: string }[]
  sizes: Size[]
  soldOut: Size[]
  fabric: string
  gsm?: number
  fit: string
  care: string[]
  images: string[]
  drop: string
  description: string
  isNew: boolean
}

const asphalt = { name: 'Asfalto', hex: '#252525' }
const chalk = { name: 'Tiza', hex: '#EDEBE6' }
const concrete = { name: 'Hormigón', hex: '#A4A19A' }
const olive = { name: 'Oliva', hex: '#575B43' }
const rust = { name: 'Óxido', hex: '#A34B32' }
const sizes: Size[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const coldWash = ['Lavar del revés a 30 °C', 'Secar al aire']
const fleece = 'Algodón orgánico 100 %, felpa perchada 380 g/m²'
const jersey = 'Algodón orgánico 100 %, punto liso compacto de 240 g/m²'

const references: Omit<Product, 'images'>[] = [
  {
    slug: 'bloc-380', name: 'Sudadera Bloc 380', category: 'sudaderas', price: 95,
    colors: [asphalt, concrete], sizes, soldOut: ['XS', 'XXL'], fabric: fleece, gsm: 380,
    fit: 'Oversize, hombro caído', care: coldWash, drop: '04', isNew: true,
    description: 'Capucha de doble capa, puños acanalados y bolsillo canguro con costuras reforzadas.',
  },
  {
    slug: 'ronda', name: 'Sudadera Ronda', category: 'sudaderas', price: 89,
    colors: [chalk, rust], sizes, soldOut: ['M'], fabric: fleece, gsm: 380,
    fit: 'Amplio, bajo recto', care: coldWash, drop: '04', isNew: true,
    description: 'Cuello redondo con inserción en V y costura plana en el canesú.',
  },
  {
    slug: 'zona-franca', name: 'Cargo Zona Franca', category: 'pantalones', price: 119,
    colors: [olive, asphalt], sizes, soldOut: ['S', 'XL'],
    fabric: 'Algodón 97 %, elastano 3 %, sarga de 310 g/m²', gsm: 310,
    fit: 'Tiro medio, pernera ancha', care: coldWash, drop: '04', isNew: true,
    description: 'Dos bolsillos de fuelle, rodillas articuladas y cordón interior en el bajo.',
  },
  {
    slug: 'taller', name: 'Chaqueta Taller', category: 'chaquetas', price: 189,
    colors: [asphalt, concrete], sizes, soldOut: ['L'], fabric: 'Algodón 100 %, lona de 420 g/m²', gsm: 420,
    fit: 'Recto, espacio para una segunda capa', care: ['Lavar a 30 °C con el cierre abrochado', 'Secar en percha'],
    drop: '04', isNew: true, description: 'Cuello de pana, cremallera metálica y tres bolsillos de parche. Confeccionada en L’Hospitalet.',
  },
  {
    slug: 'entrevias', name: 'Camiseta Entrevías', category: 'camisetas', price: 45,
    colors: [chalk, asphalt], sizes, soldOut: [], fabric: jersey, gsm: 240,
    fit: 'Boxy, manga hasta el codo', care: [...coldWash, 'Planchar del revés'], drop: '04', isNew: true,
    description: 'Gráfica de dos tintas en la espalda y cuello acanalado de 28 mm.',
  },
  {
    slug: 'moll', name: 'Camiseta Moll', category: 'camisetas', price: 42,
    colors: [concrete, chalk], sizes, soldOut: ['XXL'], fabric: jersey, gsm: 240,
    fit: 'Recto, hombro levemente caído', care: coldWash, drop: '03', isNew: false,
    description: 'Punto compacto con lavado a la piedra y pespunte doble en el bajo.',
  },
  {
    slug: 'sants', name: 'Pantalón Sants', category: 'pantalones', price: 105,
    colors: [asphalt, chalk], sizes, soldOut: ['XS'], fabric: 'Algodón 100 %, denim crudo de 12 oz',
    fit: 'Tiro alto, pernera recta', care: ['Lavar por separado a 30 °C', 'Secar a la sombra'], drop: '03', isNew: false,
    description: 'Cinco bolsillos, costura lateral desplazada y remaches de cobre.',
  },
  {
    slug: 'llindar', name: 'Chaqueta Llindar', category: 'chaquetas', price: 159,
    colors: [olive], sizes, soldOut: ['M', 'L'], fabric: 'Poliamida reciclada 100 %, tejido antidesgarro de 145 g/m²', gsm: 145,
    fit: 'Amplio, bajo regulable', care: ['Lavar a 30 °C sin suavizante', 'Secar al aire'], drop: '03', isNew: false,
    description: 'Cortavientos sin forro con capucha plegable y dos bolsillos con cremallera.',
  },
  {
    slug: 'meridiana', name: 'Sudadera Meridiana', category: 'sudaderas', price: 109,
    colors: [asphalt, olive], sizes, soldOut: ['XL'], fabric: 'Algodón orgánico 100 %, felpa de bucle 420 g/m²', gsm: 420,
    fit: 'Oversize, manga raglán', care: coldWash, drop: '03', isNew: false,
    description: 'Media cremallera, cuello alto y paneles laterales en canalé.',
  },
  {
    slug: 'paral-lel', name: 'Camiseta Paral·lel', category: 'camisetas', price: 55,
    colors: [chalk, rust, asphalt], sizes, soldOut: [], fabric: jersey, gsm: 240,
    fit: 'Recto, manga larga', care: coldWash, drop: '03', isNew: false,
    description: 'Manga larga con puño de canalé y coordenadas del Paral·lel impresas en el pecho.',
  },
  {
    slug: 'darsena', name: 'Gorra Dársena', category: 'accesorios', price: 39,
    colors: [asphalt, olive], sizes: [], soldOut: [], fabric: 'Algodón 100 %, sarga de 280 g/m²', gsm: 280,
    fit: 'Talla única ajustable, contorno de 54 a 62 cm', care: ['Limpiar a mano con un paño húmedo'], drop: '04', isNew: true,
    description: 'Seis paneles, visera curva y correa trasera con hebilla de latón.',
  },
  {
    slug: 'mercat', name: 'Bolsa Mercat', category: 'accesorios', price: 35,
    colors: [chalk, asphalt], sizes: [], soldOut: [], fabric: 'Algodón reciclado 100 %, lona de 360 g/m²', gsm: 360,
    fit: 'Talla única, 42 × 38 × 12 cm', care: ['Lavar a mano con agua fría', 'Secar en plano'], drop: '04', isNew: true,
    description: 'Asas de 65 cm, base de fuelle y bolsillo interior para las llaves.',
  },
]

export const products: Product[] = references.map((product) => ({
  ...product,
  images: [1, 2].map((shot) => `examples/ruido/img/p-${product.slug}-${shot}.webp`),
}))

export function getProduct(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug)
}
