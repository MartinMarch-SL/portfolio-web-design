export const palettes = [
  ['Cal y tinta', '#F1EEE5', '#22211D', '#A69A84'],
  ['Arcilla', '#F2E3D8', '#422B25', '#A7543B'],
  ['Olivo', '#E9E9D8', '#282E22', '#68754B'],
  ['Pizarra', '#E5EAF0', '#1C2837', '#536C85'],
  ['Arena', '#F1E0C6', '#362B1C', '#A9773E'],
  ['Malva mineral', '#EFE5EB', '#372936', '#865B78'],
  ['Sal y mar', '#DFEBE7', '#163935', '#42766E'],
  ['Grafito', '#E9E7E3', '#212121', '#707070'],
] as const

export const pairs = [
  ['Editorial', 'Newsreader Variable', 'Inter Tight Variable', 500, 400],
  ['Orgánica', 'Fraunces Variable', 'Manrope Variable', 500, 400],
  ['Clásica', 'Bodoni Moda', 'Inter Tight Variable', 400, 400],
  ['Contemporánea', 'Archivo Variable', 'Manrope Variable', 700, 400],
  ['De autor', 'Instrument Serif', 'Inter Tight Variable', 400, 400],
  ['Expresiva', 'Bricolage Grotesque Variable', 'Manrope Variable', 600, 400],
] as const

export const textures = ['Papel', 'Lino', 'Hormigón', 'Grano', 'Vidrio', 'Metal', 'Yeso', 'Madera']
export const personality = [
  ['Clásica', 'Contemporánea'], ['Sobria', 'Expresiva'], ['Cálida', 'Fría'],
  ['Artesanal', 'Técnica'], ['Íntima', 'Monumental'],
]
export const motion = ['Quieto', 'Sutil', 'Rico', 'Escénico']
export const goals = {
  Reservas: 'Reservar', Ventas: 'Comprar', Contacto: 'Contactar',
  Portfolio: 'Ver obra', Información: 'Saber más', Comunidad: 'Participar',
}
export const pages: Record<string, string> = {
  Inicio: 'Presentar la propuesta de valor y orientar hacia la acción principal',
  Sobre: 'Presentar la historia, el equipo y la forma de trabajar',
  Servicios: 'Explicar la oferta y cómo contratarla',
  'Carta/Menú': 'Consultar la oferta gastronómica y sus detalles',
  Tienda: 'Explorar productos y facilitar la compra',
  Portfolio: 'Mostrar proyectos y explicar las decisiones tomadas',
  Blog: 'Publicar artículos y novedades',
  Reservas: 'Consultar disponibilidad y reservar',
  Contacto: 'Mostrar canales de comunicación y ubicación',
  FAQ: 'Resolver dudas frecuentes antes de dar el siguiente paso',
}
export const artifacts = [
  ['plano', 'Plano vivo', 'Recorrer un plano por zonas con una luz que avanza a lo largo del día.'],
  ['anamorfosis', 'Anamorfosis', 'Alinear fragmentos tipográficos al cambiar el punto de vista mediante una transformación en perspectiva.'],
  ['lienzo', 'Reverso del lienzo', 'Girar un plano con cantos y bastidor, con luz rasante que revela el relieve del soporte.'],
  ['escaner', 'Escáner corporal', 'Desplazar una línea de escaneo sobre una silueta para revelar zonas interactivas.'],
  ['muestrario', 'Muestrario plegable', 'Articular muestras de material con bisagras simuladas y caras con texturas distintas.'],
  ['bitacora', 'Cuaderno de bitácora', 'Revelar por tramos trazos manuscritos sobre papel pautado.'],
  ['negativos', 'Mesa de luz', 'Deslizar negativos sobre un panel retroiluminado y descubrir detalles de cada fotograma.'],
  ['reloj', 'Reloj de sombra', 'Orientar la sombra de un gnomon según el horario solar del local.'],
  ['relieve', 'Mapa de relieve táctil', 'Construir la topografía de la ciudad con curvas de nivel en capas de distinta altura.'],
  ['carta', 'Carta plegada', 'Abrir un menú de papel por paneles con pliegues en perspectiva.'],
] as const
export const tones: Record<string, [string, string]> = {
  Cercano: ['Cuéntanos qué necesitas y lo vemos contigo.', 'Cuéntenos qué necesita y lo vemos con usted.'],
  Sobrio: ['Consulta los servicios disponibles.', 'Consulte los servicios disponibles.'],
  Poético: ['Encuentra el tiempo que pide cada detalle.', 'Encuentre el tiempo que pide cada detalle.'],
  Técnico: ['Revisa las especificaciones antes de elegir.', 'Revise las especificaciones antes de elegir.'],
  'Con humor': ['Trae tus dudas. El café corre de nuestra cuenta.', 'Traiga sus dudas. El café corre de nuestra cuenta.'],
  Institucional: ['Accede a la información y a los canales de atención.', 'Acceda a la información y a los canales de atención.'],
}

export interface Answers {
  business?: string; sector?: string; otherSector?: string; city?: string; offer?: string; audiences?: string[]
  goal?: string; competition?: string; difference?: string; brand?: string
  logo?: { name: string; width: number; height: number; colors: string[]; image?: string }
  brandColor1?: string; brandColor2?: string; brandColor3?: string; brandFonts?: string; brandNotes?: string
  character0?: string; character1?: string; character2?: string; character3?: string; character4?: string
  references?: string; palette?: string; mode?: string; texture?: string; materialNotes?: string
  pair?: string; scale?: string; pages?: string[]; artifacts?: string[]; motion?: string; tone?: string
  address?: string; structureNotes?: string; photos?: string; languages?: string[]; features?: string[]
  timing?: string; budget?: string; contact?: string; email?: string; phone?: string; preference?: string
  logisticsNotes?: string
}

export const isHex = (value?: string): value is string => /^#[0-9a-f]{6}$/i.test(value ?? '')
function brandColorSlots(answers: Answers) {
  if (answers.brand !== 'Existente') return []
  return [answers.brandColor1, answers.brandColor2, answers.brandColor3].map((color, index) => {
    const candidate = isHex(color) ? color : answers.logo?.colors[index]
    return isHex(candidate) ? candidate : undefined
  })
}

export const brandColors = (answers: Answers) => brandColorSlots(answers).filter(isHex)

export function selectedPalette(answers: Answers) {
  const fallback = palettes[0]
  if (!answers.palette || answers.palette === 'Tu paleta') {
    const colors = brandColorSlots(answers)
    if (colors.some(Boolean)) {
      return ['Tu paleta', colors[0] ?? fallback[1], colors[1] ?? fallback[2], colors[2] ?? fallback[3]] as const
    }
  }
  return palettes.find(([name]) => name === answers.palette) ?? fallback
}

export const selectedPair = (answers: Answers) => pairs.find(([name]) => name === answers.pair) ?? pairs[0]
