export const series = {
  Salitre: 'La sal se deposita donde el agua se retira. En estos cuadros dejo que el azul pierda fuerza hasta que queda apenas una marca en la superficie.',
  Cal: 'Blancos que conservan el color de lo que cubren. Trabajo sobre capas secas y vuelvo a abrirlas con el canto de la espátula.',
  Mediodía: 'A la hora en que las sombras se acortan, los ocres de la calle parecen más fríos. Pinto a partir de ese cambio de temperatura.',
}

export const states = ['disponible', 'reservado', 'colección privada'] as const

interface Work {
  slug: string
  title: string
  series: keyof typeof series
  year: number
  technique: string
  width: number
  height: number
  state: typeof states[number]
  image: string
}

const technique = 'Óleo sobre lino'

export const works: Work[] = [
  { slug: 'linea-de-retirada', title: 'Línea de retirada', series: 'Salitre', year: 2026, technique, width: 180, height: 180, state: 'disponible', image: 'obra-04' },
  { slug: 'agua-quieta', title: 'Agua quieta', series: 'Salitre', year: 2026, technique, width: 34, height: 36, state: 'reservado', image: 'obra-05' },
  { slug: 'pozo-de-sal', title: 'Pozo de sal', series: 'Salitre', year: 2026, technique, width: 95, height: 95, state: 'colección privada', image: 'obra-06' },
  { slug: 'pared-del-norte', title: 'Pared del norte', series: 'Cal', year: 2025, technique, width: 159, height: 106, state: 'disponible', image: 'obra-07' },
  { slug: 'junta', title: 'Junta', series: 'Cal', year: 2025, technique, width: 90, height: 90, state: 'disponible', image: 'obra-08' },
  { slug: 'debajo-del-blanco', title: 'Debajo del blanco', series: 'Cal', year: 2025, technique, width: 95, height: 95, state: 'reservado', image: 'obra-09' },
  { slug: 'hora-inmovil', title: 'Hora inmóvil', series: 'Mediodía', year: 2024, technique, width: 110, height: 110, state: 'colección privada', image: 'obra-01' },
  { slug: 'sombra-corta', title: 'Sombra corta', series: 'Mediodía', year: 2024, technique, width: 90, height: 135, state: 'disponible', image: 'obra-02' },
  { slug: 'aire-seco', title: 'Aire seco', series: 'Mediodía', year: 2024, technique, width: 65, height: 65, state: 'disponible', image: 'obra-03' },
]
