export const areas = [
  { id: 'casco-antiguo', name: 'Casco Antiguo', rate: 6500, x: 492, y: 139 },
  { id: 'santa-catalina', name: 'Santa Catalina', rate: 6200, x: 385, y: 159 },
  { id: 'portixol', name: 'Portixol', rate: 8900, x: 657, y: 159 },
  { id: 'son-armadans', name: 'Son Armadans', rate: 5100, x: 299, y: 205 },
  { id: 'genova', name: 'Gènova', rate: 5600, x: 188, y: 222 },
  { id: 'son-vida', name: 'Son Vida', rate: 9100, x: 175, y: 107 },
  { id: 'bendinat', name: 'Bendinat', rate: 8100, x: 84, y: 285 },
] as const

export type Area = typeof areas[number]['id']
export const features = { terraza: 'Terraza', piscina: 'Piscina', mar: 'Vistas al mar', ascensor: 'Ascensor', patio: 'Patio', jardin: 'Jardín', garaje: 'Garaje' } as const
export type Feature = keyof typeof features
export interface Property {
  slug: string
  name: string
  type: 'piso' | 'ático' | 'casa' | 'villa' | 'finca'
  operation: 'venta' | 'alquiler'
  area: Area
  price: number
  size: number
  rooms: number
  baths: number
  floor: string
  year: number
  energy: string
  features: Feature[]
  description: string
}

export const properties: Property[] = [
  {
    slug: 'patio-de-sant-jaume', name: 'Patio de Sant Jaume', type: 'piso', operation: 'venta', area: 'casco-antiguo',
    price: 685000, size: 108, rooms: 2, baths: 2, floor: '1.ª', year: 1890, energy: 'D', features: ['patio', 'ascensor'],
    description: 'Al cruzar el zaguán de esta casa de Sant Jaume, el ruido de la calle se queda en el portal. Un patio de piedra abre la finca al cielo y da paso a la escalera original. El piso ocupa la primera planta y conserva vigas vistas, muros gruesos y dos balcones de hierro orientados al este. El salón y la cocina comparten la fachada, con una mesa amplia junto a la ventana para desayunar al sol. Los dos dormitorios miran al interior, donde las tardes son más frescas y tranquilas. El principal tiene baño propio y el segundo admite una cama doble o una mesa de trabajo. El ascensor llega a la planta desde el zaguán. La plaza del Mercat y los comercios de la calle Unió quedan a pocos minutos a pie.',
  },
  {
    slug: 'atico-del-molinar', name: 'Ático del Molinar', type: 'ático', operation: 'venta', area: 'portixol',
    price: 1290000, size: 142, rooms: 3, baths: 2, floor: '3.ª', year: 2008, energy: 'C', features: ['terraza', 'mar', 'ascensor', 'garaje'],
    description: 'Desde la terraza se ve la curva del paseo y, más lejos, la entrada del puerto. La vivienda se organiza alrededor de un salón pasante que recibe luz de dos orientaciones y se abre por completo al exterior. La cocina tiene una puerta corredera que permite cerrarla cuando hay invitados. Frente al mar hay sitio para una mesa larga y un banco corrido, mientras que una segunda terraza resguarda del viento en los meses más frescos. Los tres dormitorios quedan en la parte posterior de la planta, con armarios hechos a medida y ventilación natural. La suite principal tiene baño con ducha amplia y acceso a la terraza secundaria. El ascensor conecta con la plaza de garaje. A pie de calle empieza el recorrido costero hacia el antiguo puerto del Molinar.',
  },
  {
    slug: 'casa-de-los-almendros', name: 'Casa de los Almendros', type: 'casa', operation: 'venta', area: 'genova',
    price: 975000, size: 176, rooms: 4, baths: 3, floor: 'Baja y 1.ª', year: 1936, energy: 'D', features: ['jardin', 'terraza', 'piscina'],
    description: 'En la parte alta de Gènova, esta casa aprovecha la pendiente para repartir el jardín en dos terrazas. Un par de almendros da sombra a la mesa exterior y la piscina queda en el nivel inferior, rodeada por un muro de piedra seca. La planta baja reúne el salón, la cocina y un dormitorio con baño cercano que sirve también de despacho. Arriba hay tres dormitorios y dos baños, uno de ellos integrado en la habitación principal. Las persianas verdes regulan la luz de poniente y las ventanas opuestas permiten que circule el aire. La reforma mantuvo la escalera y los suelos hidráulicos de la entrada. Desde el porche se distingue la ladera de Na Burguesa y se llega andando a los restaurantes de la calle principal del barrio.',
  },
  {
    slug: 'casa-del-mercat', name: 'Casa del Mercat', type: 'piso', operation: 'alquiler', area: 'santa-catalina',
    price: 1650, size: 78, rooms: 2, baths: 1, floor: '2.ª', year: 1958, energy: 'E', features: ['terraza'],
    description: 'Este piso de segunda planta está en una calle corta entre el mercado y los molinos de Santa Catalina. La fachada conserva las contraventanas de madera y una pequeña terraza recoge el sol de la mañana. Al entrar, la cocina se abre hacia un comedor con espacio para seis personas. La sala ocupa la esquina y tiene dos ventanas altas que permiten ver el movimiento del barrio desde el sofá. Los dormitorios quedan al otro extremo, separados por el baño y un armario de ropa blanca. El segundo dormitorio puede funcionar como habitación de invitados o como despacho. Se alquila amueblado, con electrodomésticos y espacio para guardar una bicicleta en el zaguán. La finca tiene pocos vecinos y se accede por una escalera ventilada que conserva su barandilla original.',
  },
  {
    slug: 'galeria-de-son-armadans', name: 'Galería de Son Armadans', type: 'piso', operation: 'alquiler', area: 'son-armadans',
    price: 2250, size: 118, rooms: 3, baths: 2, floor: '4.ª', year: 1974, energy: 'C', features: ['terraza', 'ascensor', 'garaje'],
    description: 'La galería de esta vivienda recorre toda la fachada y filtra la luz entre los pinos de Son Armadans. Tiene puertas correderas hacia el salón y el dormitorio principal, de modo que en primavera funciona como una habitación más. La cocina es independiente, con despensa y lavadero ventilado. Hay tres dormitorios, dos baños completos y un distribuidor lo bastante ancho para colocar una librería. La carpintería exterior se renovó en la última reforma, junto con la climatización de la vivienda. El portal tiene acceso a nivel de calle y el ascensor conecta con la plaza de garaje incluida en el alquiler. El bosque de Bellver queda cerca para salir a caminar y por el otro lado se baja hacia el paseo marítimo por calles arboladas.',
  },
  {
    slug: 'villa-de-la-cornisa', name: 'Villa de la Cornisa', type: 'villa', operation: 'venta', area: 'son-vida',
    price: 3900000, size: 426, rooms: 5, baths: 5, floor: 'Baja y 1.ª', year: 2018, energy: 'B', features: ['terraza', 'piscina', 'mar', 'jardin', 'garaje'],
    description: 'La villa se asienta en una cornisa de Son Vida desde la que se ve Palma entre las copas de los pinos. Los espacios de día ocupan la cota de llegada y comparten una terraza continua con la piscina. Un voladizo de hormigón protege el comedor exterior y deja que el sol bajo de invierno entre en el salón. La cocina cuenta con una isla, una despensa y una segunda entrada desde el garaje. Abajo, los dormitorios se abren hacia un jardín escalonado de lentiscos y acebuches. La suite principal se sitúa en un extremo, con vestidor y una terraza privada. Hay un estudio independiente para invitados y un cuarto técnico con acceso desde el exterior. La piedra de las terrazas continúa dentro de la casa y enlaza las dos plantas.',
  },
  {
    slug: 'finca-del-olivar', name: 'Finca del Olivar', type: 'finca', operation: 'venta', area: 'genova',
    price: 1495000, size: 224, rooms: 4, baths: 3, floor: 'Baja y 1.ª', year: 1912, energy: 'E', features: ['patio', 'jardin', 'piscina', 'terraza'],
    description: 'Un camino de grava atraviesa el pequeño olivar antes de llegar a la casa. El edificio principal conserva la cubierta de teja y los dinteles de piedra de la finca original. En la planta baja, el salón se comunica con una cocina de obra y con un patio que funciona como comedor durante buena parte del año. La antigua sala del horno se utiliza hoy como biblioteca. Arriba se reparten los dormitorios, con vistas a las terrazas de cultivo y al perfil de la sierra. Junto a la piscina hay un cuarto para guardar herramientas y mobiliario exterior. La parcela tiene caminos entre los bancales y varios rincones de sombra bajo los olivos. Desde el portón se llega al centro de Gènova en pocos minutos en coche.',
  },
  {
    slug: 'mirador-de-bendinat', name: 'Mirador de Bendinat', type: 'villa', operation: 'venta', area: 'bendinat',
    price: 2180000, size: 268, rooms: 4, baths: 4, floor: 'Baja y 1.ª', year: 2003, energy: 'C', features: ['terraza', 'piscina', 'mar', 'garaje'],
    description: 'La casa se proyectó alrededor de una terraza orientada al sur, con vistas parciales al mar entre los pinos de Bendinat. La cocina, el comedor y el salón se conectan en secuencia, con puertas acristaladas hacia el porche. En la misma planta hay un dormitorio con baño que resulta práctico para las visitas. La escalera sube a tres dormitorios, todos con baño, y a un balcón que recoge el sol de primera hora. En el jardín, un seto protege la zona de piscina y una franja de plantas aromáticas acompaña el camino hacia el garaje. El porche tiene espacio para cocinar y comer al aire libre en verano. Desde la calle se puede bajar andando a la costa y llegar en pocos minutos a los servicios de Portals Nous.',
  },
]

export const areaName = (id: Area) => areas.find(area => area.id === id)!.name
export const number = new Intl.NumberFormat('es-ES', { useGrouping: 'always' })
export const euros = (price: number) => `${number.format(Math.round(price))} €`
export const propertyPrice = (property: Property) => euros(property.price) + (property.operation === 'alquiler' ? '/mes' : '')
export const propertyPath = (property: Property) => `mares/propiedades/${property.slug}/`
export const propertyImage = (property: Property, frame = 'a') =>
  `examples/mares/img/prop-${String(properties.findIndex(item => item.slug === property.slug) + 1).padStart(2, '0')}-${frame}.webp`
