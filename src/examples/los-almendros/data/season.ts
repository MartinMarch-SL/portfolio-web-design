export const season = '2026/27'
export const contact = 'secretaria@udlosalmendros.example'

const entries = [
  ['Chupetines', 2021, 2022, 220, 'Fútbol 5', 'Martes y jueves', '17:00–18:00'],
  ['Prebenjamín', 2019, 2020, 240, 'Fútbol 7', 'Lunes y miércoles', '17:00–18:15'],
  ['Benjamín', 2017, 2018, 260, 'Fútbol 7', 'Martes y jueves', '18:00–19:15'],
  ['Alevín', 2015, 2016, 280, 'Fútbol 7 / 11', 'Lunes y miércoles', '18:15–19:30'],
  ['Infantil', 2013, 2014, 300, 'Fútbol 11', 'Martes y jueves', '19:15–20:30'],
  ['Cadete', 2011, 2012, 320, 'Fútbol 11', 'Lunes y miércoles', '19:30–21:00'],
  ['Juvenil', 2008, 2010, 340, 'Fútbol 11', 'Martes y jueves', '20:30–22:00'],
] as const

const coaches = [
  ['Inés Olmeda', 'Raúl Fresno', 'Pilar Navas'],
  ['Rocío Vela', 'Álvaro Candil', 'Olga Parra'],
  ['Silvia Encina', 'Diego Montoro', 'Marta Olmo'],
  ['Vicente Prados', 'Ana Morera', 'Celia Rubio'],
  ['Elena Robles', 'Mario Roldán', 'Nuria Jaral'],
  ['Clara Mena', 'Hugo Luján', 'Luis Calero'],
  ['Jaime Naval', 'Eva Vallejo', 'David Viñas'],
]
export const categories = entries.map(([name, first, last, fee, format, days, time], index) => {
  const female = index >= 2 && index <= 4
  const teams = ['A', 'B', ...(female ? ['femenino'] : index === 6 ? ['C'] : [])].map((suffix, team) => ({
    name: name + ' ' + suffix,
    coach: coaches[index][team],
    days: index === 4 && suffix === 'femenino' ? 'Lunes y miércoles' : suffix === 'C' ? 'Lunes y viernes' : days,
    time: index === 4 && suffix === 'femenino' ? '17:00–18:15' : suffix === 'C' ? '21:00–22:00' : time,
    field: index >= 4 || (index === 3 && team === 0)
      ? (team === 1 ? 'Fútbol 11 · mitad norte' : team === 2 ? 'Fútbol 11 · turno completo' : 'Fútbol 11 · mitad sur')
      : (team === 1 ? 'Fútbol 7 · pista este' : 'Fútbol 7 · pista oeste'),
  }))
  return { name, first, last, fee, format, female, teams }
})

export const news = [
  {
    slug: 'una-manana-de-derbis', photo: 'femenino', date: '2026-11-21', label: '21 nov 2026', section: 'Crónica',
    title: 'Una mañana de derbis',
    intro: 'El Alevín A remontó en casa después del descanso ante el Olivar Alto.',
    body: ['El Olivar Alto se adelantó al cuarto de hora y nos obligó a tener paciencia con el balón. La primera ocasión clara del equipo llegó antes del descanso, con un tiro al palo tras un saque de esquina.', 'La segunda parte cambió con dos goles en seis minutos. El equipo sostuvo el 2–1 hasta el final y se quedó a ver el partido del Benjamín femenino desde la grada.'],
  },
  {
    slug: 'torneo-de-navidad', photo: 'portero', date: '2026-11-18', label: '18 nov 2026', section: 'Agenda',
    title: 'Volvemos al torneo de Navidad',
    intro: 'El sábado 19 de diciembre recibimos a seis clubes vecinos en el municipal.',
    body: ['Los partidos de fútbol 7 empiezan a las nueve y media y se jugarán en las dos pistas. Cada equipo disputará tres encuentros cortos, con una pausa a media mañana.', 'La entrada es libre. La cantina servirá caldo y bocadillos desde primera hora y recogerá alimentos para la despensa del barrio.'],
  },
  {
    slug: 'puertas-abiertas', photo: 'chupetines', date: '2026-11-12', label: '12 nov 2026', section: 'Escuela',
    title: 'Una tarde de puertas abiertas',
    intro: 'El 27 de noviembre, entrenamiento abierto para conocer la escuela y a sus entrenadores.',
    body: ['A las cinco abriremos el campo pequeño a quienes quieran probar. Basta con traer calzado deportivo y una botella de agua. Los grupos se organizan al llegar, por edades.', 'El equipo de coordinación estará junto a la entrada para hablar con las familias sobre horarios, cuotas y plazas disponibles.'],
  },
  {
    slug: 'verde-y-crema', photo: 'entrenamiento', date: '2026-11-04', label: '4 nov 2026', section: 'Club',
    title: 'Verde botella, cuello crema',
    intro: 'La nueva equipación recupera los colores de la camiseta que se estrenó en 1972.',
    body: ['Volvemos al cuello crema y al dorsal claro sobre fondo verde. Para elegir el tejido, tres equipos entrenaron dos semanas con las muestras y comentaron el ajuste con la coordinación.', 'La entrega se hará por equipos al terminar los entrenamientos de esta semana. Si hay que cambiar una talla, secretaría recogerá la prenda con su etiqueta.'],
  },
  {
    slug: 'las-primeras-del-infantil', photo: 'disparo', date: '2026-10-24', label: '24 oct 2026', section: 'Crónica',
    title: 'Las primeras del Infantil femenino',
    intro: 'El equipo se estrenó en el municipal con una grada llena de compañeras de la escuela.',
    body: ['En la primera media hora costó salir de nuestro campo. Las centrales ajustaron la distancia entre ellas y, a partir de ahí, el equipo encontró más opciones por las bandas.', 'Al acabar, las jugadoras se reunieron con las alevines para contarles qué cambia al pasar a fútbol 11.'],
  },
  {
    slug: 'una-grada-para-todos', photo: 'grada', date: '2026-10-10', label: '10 oct 2026', section: 'Club',
    title: 'Una grada para todos',
    intro: 'Las familias y los entrenadores acuerdan cómo acompañar los partidos desde la banda.',
    body: ['En la reunión de octubre hablamos de las instrucciones desde la grada y de cómo afectan a quienes están aprendiendo a jugar. La consigna es sencilla: animar a todo el equipo y dejar las indicaciones al cuerpo técnico.', 'Los delegados de cada equipo recogerán las dudas en los próximos partidos y las llevarán a la reunión mensual de coordinación.'],
  },
]

const opponents = ['Olivar Alto', 'San Brezo', 'La Yesera', 'Atlético Fresno', 'Unión del Soto', 'Peña Jaral', 'Barrio del Cauce', 'Deportivo Candil', 'Prado Norte', 'Valdeloma']
const records = [
  [7, 1, 0, 24, 5], [6, 1, 1, 21, 8], [5, 2, 1, 18, 9], [5, 1, 2, 16, 11],
  [3, 2, 3, 12, 12], [3, 1, 4, 13, 12], [3, 1, 4, 11, 13], [2, 2, 4, 11, 16],
  [2, 1, 5, 9, 18], [1, 1, 6, 8, 21], [0, 1, 7, 5, 23],
]
export const standings = ['Alevín A', 'Infantil A', 'Juvenil A'].map((team, group) => {
  const names = opponents.map((_, index) => opponents[(index + group * 3) % opponents.length])
  names.splice(group + 1, 0, 'UD Los Almendros')
  return { team, rows: records.map(([won, drawn, lost, goals, conceded], index) => ({
    name: names[index], won, drawn, lost, goals, conceded, played: won + drawn + lost, points: won * 3 + drawn,
  })) }
})

export const fixtures = [
  { date: '28 nov · 10:30', team: 'Alevín A', home: 'UD Los Almendros', away: 'San Brezo', venue: 'Municipal Los Almendros', result: '' },
  { date: '28 nov · 16:00', team: 'Infantil A', home: 'La Yesera', away: 'UD Los Almendros', venue: 'Municipal La Yesera', result: '' },
  { date: '29 nov · 12:00', team: 'Juvenil A', home: 'UD Los Almendros', away: 'Unión del Soto', venue: 'Municipal Los Almendros', result: '' },
  { date: '21 nov', team: 'Alevín A', home: 'UD Los Almendros', away: 'Olivar Alto', venue: 'Municipal Los Almendros', result: '2–1' },
  { date: '21 nov', team: 'Infantil A', home: 'UD Los Almendros', away: 'Peña Jaral', venue: 'Municipal Los Almendros', result: '1–1' },
  { date: '22 nov', team: 'Juvenil A', home: 'Valdeloma', away: 'UD Los Almendros', venue: 'Campo de Valdeloma', result: '0–2' },
]
