export const categories = [
  { name: 'Minitenis', first: 2020, last: 2021, fees: [45, 75, 105], time: '17:00', coach: 'Clara Vidal', method: 'Raquetas ligeras, pelotas blandas y juegos de coordinación.' },
  { name: 'Benjamín', first: 2018, last: 2019, fees: [50, 80, 110], time: '17:00', coach: 'Clara Vidal', method: 'Los primeros peloteos, el saque y el espacio de la pista.' },
  { name: 'Alevín', first: 2016, last: 2017, fees: [55, 85, 115], time: '18:00', coach: 'Marta Soler', method: 'Puntos cortos para aprender a colocarse y elegir el golpe.' },
  { name: 'Infantil', first: 2014, last: 2015, fees: [60, 90, 120], time: '18:00', coach: 'Marta Soler', method: 'Regularidad, dirección y primeras secuencias tácticas.' },
  { name: 'Cadete', first: 2012, last: 2013, fees: [65, 100, 130], time: '19:00', coach: 'Pau Ferrer', method: 'Trabajo de piernas, patrones de juego y partidos guiados.' },
  { name: 'Júnior', first: 2010, last: 2011, fees: [70, 110, 140], time: '19:00', coach: 'Pau Ferrer', method: 'Planes de partido, preparación física y liga de equipos.' },
]
export const schedules = ['Miércoles', 'Martes y jueves', 'Lunes, miércoles y viernes']
export const levels = ['Iniciación', 'Perfeccionamiento', 'Competición']
export const contact = 'secretaria@ctlasmoreras.example'
export const news = [
  { slug: 'open-de-verano', title: 'El Open vuelve a las tardes de junio', date: '2026-11-20', subject: 'Open de verano', image: 'deslizamiento', width: 1600, height: 960, lead: 'Diez días de partidos y grada abierta en las pistas de tierra.', body: 'El Open se jugará del 18 al 27 de junio de 2027. Las primeras rondas empiezan a las 18:00 y las finales se disputan en la pista central. Las inscripciones se abrirán en secretaría en mayo.' },
  { slug: 'campus-de-semana-santa', title: 'Cuatro mañanas de tenis en Semana Santa', date: '2026-11-15', subject: 'Escuela', image: 'sombra-raqueta', width: 1200, height: 900, lead: 'Grupos pequeños, juegos de pista y almuerzo bajo las moreras.', body: 'Del 29 de marzo al 1 de abril, de 9:00 a 13:00, habrá grupos de 6 a 14 años. La escuela presta las raquetas y prepara una pista adaptada para quienes juegan por primera vez.' },
  { slug: 'ascenso-del-equipo-junior', title: 'El júnior se gana el ascenso en casa', date: '2026-11-08', subject: 'Competición', image: 'nino-pelota', width: 1200, height: 900, lead: 'Un 4–1 en la última eliminatoria lleva al equipo a Primera.', body: 'El equipo cerró la liga frente al CT La Dársena. El punto decisivo llegó en tres sets tras dos horas de juego. La próxima temporada, el equipo disputará sus encuentros de Primera en la pista central.' },
  { slug: 'torneo-social-de-dobles', title: 'Dobles de otoño y sobremesa en la terraza', date: '2026-10-25', subject: 'Torneo social', image: 'red-risas', width: 1200, height: 900, lead: 'El sorteo juntó a parejas de todas las edades.', body: 'La competición se organizó en grupos de cuatro parejas con partidos a un set. Al acabar, compartimos una comida en la casa club y se entregaron los premios de la escalera de otoño.' },
  { slug: 'iluminacion-led', title: 'Luz nueva para los últimos turnos', date: '2026-10-12', subject: 'Instalaciones', image: 'pista-cenital', width: 1440, height: 800, lead: 'Las ocho pistas de tierra ya cuentan con iluminación LED.', body: 'La instalación se hizo por bloques para mantener pistas abiertas durante las obras. Las luminarias dirigen la luz hacia la pista y se apagan al terminar el último turno.' },
  { slug: 'escuela-de-adultos', title: 'La escuela abre grupos para adultos', date: '2026-09-21', subject: 'Escuela', image: 'clase-exterior', width: 1200, height: 900, lead: 'Horarios de mañana y tarde para aprender o volver a jugar.', body: 'Los grupos de iniciación juegan los martes a las 10:00 y los jueves a las 20:00. Para perfeccionamiento, hay un grupo los miércoles a las 20:00. Secretaría orienta sobre el horario y el nivel.' },
]
export const teams = [
  { name: 'Alevín', league: 'Liga Comarcal · Grupo B', rival: 'CT Pinar del Mar', result: '3–2', points: 8, position: 3 },
  { name: 'Infantil', league: 'Liga Comarcal · Grupo A', rival: 'CT La Encina', result: '2–3', points: 6, position: 4 },
  { name: 'Cadete', league: 'Segunda Regional · Grupo A', rival: 'CT Mirador', result: '4–1', points: 10, position: 2 },
  { name: 'Júnior', league: 'Segunda Regional · Grupo B', rival: 'CT La Dársena', result: '4–1', points: 12, position: 1 },
  { name: 'Absoluto', league: 'Primera Regional · Grupo C', rival: 'CT La Salina', result: '3–2', points: 8, position: 3 },
]
export const matches = [
  { label: 'Júnior · Pista central', rival: 'CT La Dársena', home: [6, 3, 7], away: [4, 6, 5] },
  { label: 'Cadete · Pista 2', rival: 'CT Mirador', home: [6, 6, '–'], away: [2, 4, '–'] },
  { label: 'Absoluto · Pista 3', rival: 'CT La Salina', home: [4, 6, 6], away: [6, 2, 3] },
]
