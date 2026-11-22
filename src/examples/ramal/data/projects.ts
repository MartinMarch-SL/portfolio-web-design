import type { PhotoName } from './photos'
import type { Discipline, Sector } from './company'

interface Project {
  slug: string
  photos: readonly [PhotoName, PhotoName]
  name: string
  sector: Sector
  place: string
  year: number
  engineering: string
  builder: string
  area: number
  power: string
  duration: number
  scope: Partial<Record<Discipline, string>>
  challenge: string
  solution: string
}

export const projects: Project[] = [
  {
    photos: ['techo-instalado', 'fv-nave'],
    slug: 'plataforma-soto-norte', name: 'Plataforma Soto Norte', sector: 'logistica', place: 'Zaragoza', year: 2025,
    engineering: 'Dintel de Cierzo Ingeniería', builder: 'Vano Páramo Construcción', area: 28400, power: '1.250 kVA / 740 kWp FV', duration: 24,
    scope: { electricidad: 'Centro de transformación, cuadros y alimentación de 32 muelles.', pci: 'Red de rociadores ESFR y grupo de bombeo.', fotovoltaica: '740 kWp en cubierta con monitorización por inversor.' },
    challenge: 'La entrega se dividía en dos fases y la primera debía quedar operativa mientras continuaba el montaje.',
    solution: 'Sectorizamos la distribución y ensayamos cada red por separado. Los colectores se prefabricaron según el replanteo de cubierta.',
  },
  {
    photos: ['sala-cuadros', 'cuadro'],
    slug: 'hospital-val-de-luna', name: 'Hospital Val de Luna', sector: 'sanitario', place: 'Huesca', year: 2025,
    engineering: 'Cimbra de Orla Ingeniería', builder: 'Umbral de Farga Obras', area: 8600, power: '800 kVA', duration: 38,
    scope: { electricidad: 'Cuadros de planta, líneas críticas desde SAI y alumbrado de emergencia.', clima: 'Climatizadoras con filtración terminal y cascadas de presión.', fontaneria: 'Red de ACS con retorno equilibrado y saneamiento separativo.', control: 'Supervisión de presiones y alarmas técnicas por unidad asistencial.' },
    challenge: 'La ampliación conectaba con instalaciones que debían prestar servicio durante toda la obra.',
    solution: 'Comprobamos los empalmes en ventanas pactadas con mantenimiento y verificamos los diferenciales de presión antes de la recepción.',
  },
  {
    photos: ['conductos-blanco', 'bandejas'],
    slug: 'oficinas-umbral-ebro', name: 'Oficinas Umbral Ebro', sector: 'oficinas', place: 'Zaragoza', year: 2024,
    engineering: 'Fuste de Alcor Ingeniería', builder: 'Trama de Salina Edificación', area: 11200, power: '630 kVA / 118 kWp FV', duration: 22,
    scope: { clima: 'Distribución de aire primario y unidades terminales por módulo.', electricidad: 'Canalizaciones y alimentación modular por planta.', fotovoltaica: '118 kWp de autoconsumo.', control: 'Control por ocupación y submedición por planta.' },
    challenge: 'El falso techo debía admitir tres configuraciones de inquilino con una altura libre constante.',
    solution: 'Coordinamos redes en un modelo federado, reservamos franjas registrables y dejamos derivaciones identificadas en cada módulo.',
  },
  {
    photos: ['conductos-oscuro', 'forjado-tubos'],
    slug: 'hotel-piedra-clara', name: 'Hotel Piedra Clara', sector: 'hotelero', place: 'Teruel', year: 2024,
    engineering: 'Linde de Caliza Consultores', builder: 'Crujía de Bruma Edificación', area: 7200, power: '400 kVA', duration: 30,
    scope: { clima: 'Bombas de calor, ventilación con recuperación y unidades de habitación.', fontaneria: 'Producción de ACS, retornos y bajantes insonorizadas.', pci: 'Detección direccionable y red de BIE.' },
    challenge: 'La rehabilitación conservaba muros de carga y dejaba poco margen para las nuevas bajantes.',
    solution: 'Levantamos los patinillos existentes, montamos una habitación piloto y validamos los niveles sonoros antes de repetir la solución.',
  },
  {
    photos: ['bandeja-pci', 'techo-instalado'],
    slug: 'galeria-las-eras', name: 'Galería Las Eras', sector: 'comercial', place: 'Calatayud', year: 2026,
    engineering: 'Arista de Greda Técnica', builder: 'Dovela del Saso Construcción', area: 13400, power: '1.000 kVA', duration: 19,
    scope: { electricidad: 'Distribución general y cuadros de acometida para locales.', pci: 'Adaptación de rociadores y detección por zonas.', control: 'Integración de alarmas y consumos de zonas comunes.' },
    challenge: 'Los locales abrían en fechas diferentes y las zonas comunes seguían en servicio.',
    solution: 'Independizamos aislamientos y pruebas por local. La entrega incluyó un mapa de llaves, cuadros y puntos de supervisión.',
  },
  {
    photos: ['conducto-nave', 'fv-nave'],
    slug: 'centro-logistico-la-veda', name: 'Centro logístico La Veda', sector: 'logistica', place: 'Zuera', year: 2026,
    engineering: 'Pórtico de Yesar Ingeniería', builder: 'Estribo de Barranco Obras', area: 19600, power: '800 kVA / 520 kWp FV', duration: 21,
    scope: { electricidad: 'Anillo de media tensión, transformación y distribución de fuerza.', clima: 'Ventilación de almacén y climatización de oficinas.', fontaneria: 'Abastecimiento y red separativa hasta arquetas.', fotovoltaica: '520 kWp en cubierta, con control de vertido.' },
    challenge: 'Los recorridos en cubierta coincidían con lucernarios y franjas de mantenimiento.',
    solution: 'Replanteamos pasillos y soportes con estructura, agrupamos pasos estancos y validamos la limitación de vertido durante la puesta en marcha.',
  },
]
