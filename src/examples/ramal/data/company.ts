const rebt = ['REBT · RD 842/2002', 'https://www.boe.es/eli/es/rd/2002/08/02/842/con']
const rite = ['RITE · RD 1027/2007', 'https://www.boe.es/eli/es/rd/2007/07/20/1027/con']
const cte = (part: string) => ['CTE ' + part + ' · RD 314/2006', 'https://www.boe.es/eli/es/rd/2006/03/17/314/con']

export const disciplines = [
  { id: 'electricidad', code: 'E-', name: 'Electricidad', scope: 'Baja y media tensión, centros de transformación, cuadros generales, canalizaciones y distribución hasta los puntos de consumo.', standards: [rebt, ['RAT · RD 337/2014', 'https://www.boe.es/eli/es/rd/2014/05/09/337/con']], tools: 'Equipos de tendido, analizadores de redes y medidores de aislamiento.' },
  { id: 'clima', code: 'M-', name: 'Climatización y ventilación', scope: 'Producción térmica, redes hidráulicas y de aire, ventilación de recuperación y equilibrado de caudales.', standards: [rite, cte('DB HE')], tools: 'Bancos de prueba hidráulica, balómetros y equipos de medición de presión diferencial.' },
  { id: 'pci', code: 'PCI-', name: 'Protección contra incendios', scope: 'Detección, alarma, abastecimiento de agua, rociadores y bocas de incendio equipadas.', standards: [['RIPCI · RD 513/2017', 'https://www.boe.es/eli/es/rd/2017/05/22/513/con'], cte('DB SI'), ['RSCIEI · RD 164/2025', 'https://www.boe.es/eli/es/rd/2025/03/04/164/con']], tools: 'Roscadoras, ranuradoras y equipos de ensayo de presión y caudal.' },
  { id: 'fontaneria', code: 'F-', name: 'Fontanería y saneamiento', scope: 'Redes de agua fría y ACS, retornos, saneamiento separativo y bombeos.', standards: [cte('DB HS 4 y HS 5'), rite], tools: 'Prensas de unión, equipos de termofusión y cámaras de inspección.' },
  { id: 'fotovoltaica', code: 'FV-', name: 'Fotovoltaica de autoconsumo', scope: 'Estructuras de cubierta, módulos, inversores, protecciones y monitorización del autoconsumo.', standards: [rebt, cte('DB HE 5'), ['Autoconsumo · RD 244/2019', 'https://www.boe.es/eli/es/rd/2019/04/05/244/con']], tools: 'Trazadores de curvas I-V, cámaras termográficas y equipos de izado.' },
  { id: 'control', code: 'BMS-', name: 'Control y BMS', scope: 'Integración de climatización, contadores y alarmas mediante BACnet y Modbus, con secuencias y tendencias verificadas en obra.', standards: [rite, rebt], tools: 'Maletas de programación y simuladores de señales para ensayos punto a punto.' },
] as const

export type Discipline = (typeof disciplines)[number]['id']
export const sectors = {
  logistica: 'Logística',
  sanitario: 'Sanitario',
  oficinas: 'Oficinas',
  hotelero: 'Hotelero',
  comercial: 'Comercial',
}
export type Sector = keyof typeof sectors

export const certifications = [
  'ISO 9001 · gestión de la calidad',
  'ISO 14001 · gestión ambiental',
  'ISO 45001 · seguridad y salud en el trabajo',
  'Empresa instaladora habilitada en baja tensión, RITE y PCI',
  'Inscripción en el Registro de Empresas Acreditadas (REA) de Aragón',
  'Póliza de responsabilidad civil de explotación y posobra · 6 millones de euros',
]
export const contact = 'ofertas@ramal.example'
export const demo = 'Demostración: no se envía ningún dato'
export const figures = [
  { value: 485000, label: 'm² ejecutados' },
  { value: 12400, label: 'kWp instalados' },
  { value: 32, label: 'obras al año' },
  { value: 310000, label: 'horas sin accidentes con baja' },
]
export const process = [
  ['Lectura de proyecto', 'Contrastamos mediciones y planos con la ingeniería y cerramos por escrito los límites de suministro.'],
  ['Replanteo y BIM', 'Coordinamos pasos, soportes y cotas de montaje antes de liberar compras y prefabricación.'],
  ['Ejecución', 'Planificamos cuadrillas por zonas, con puntos de inspección acordados con la dirección facultativa.'],
  ['Legalización y puesta en marcha', 'Entregamos ensayos, certificados, planos finales y manuales. Formamos al personal de explotación.'],
  ['Mantenimiento', 'Programamos revisiones y damos seguimiento a las incidencias durante la garantía.'],
]
