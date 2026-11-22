export const contact = 'secretaria@cbpinaralto.example'

type Team = { name: string; coach: string; days: string; time: string; field: string; fee: number }
type Category = { id: string; name: string; first: number; last: number; teams: Team[] }
const team = (name: string, coach: string, days: string, time: string, fee: number, central = false): Team =>
  ({ name, coach, days, time, field: central ? 'Pista central' : 'Pista auxiliar', fee })
const mj = 'Martes y jueves'
const lx = 'Lunes y miércoles'
const xv = 'Miércoles y viernes'

export const categories: Category[] = [
  { id: 'babybasket', name: 'Babybasket', first: 2019, last: 2020, teams: [
    team('Babybasket', 'Inés Vera', mj, '16:30–17:15', 200),
  ] },
  { id: 'premini', name: 'Premini', first: 2017, last: 2018, teams: [
    team('Premini A', 'Eva Robles', lx, '16:30–17:30', 225),
    team('Premini B', 'Leo Bernal', xv, '16:30–17:30', 225),
  ] },
  { id: 'mini', name: 'Mini', first: 2015, last: 2016, teams: [
    team('Mini A', 'Samuel Rivas', mj, '17:15–18:15', 280, true),
    team('Mini femenino', 'Clara Solís', mj, '18:15–19:15', 280),
    team('Mini B', 'Dani Montoro', lx, '17:30–18:30', 280),
  ] },
  { id: 'infantil', name: 'Infantil', first: 2013, last: 2014, teams: [
    team('Infantil A', 'Paula Vela', lx, '18:30–19:45', 295, true),
    team('Infantil femenino', 'Nuria Santos', xv, '17:30–18:45', 295, true),
    team('Infantil B', 'Álex Leal', mj, '19:15–20:30', 295),
  ] },
  { id: 'cadete', name: 'Cadete', first: 2011, last: 2012, teams: [
    team('Cadete A', 'Mario Blasco', mj, '18:15–19:45', 320, true),
    team('Cadete femenino', 'Alicia Gil', xv, '18:45–20:15', 320, true),
    team('Cadete B', 'Jaime Mora', lx, '19:45–21:00', 320),
  ] },
  { id: 'junior', name: 'Júnior', first: 2009, last: 2010, teams: [
    team('Júnior A', 'Rubén Valle', mj, '19:45–21:15', 345, true),
    team('Júnior femenino', 'Sara Cano', xv, '20:15–21:45', 345, true),
    team('Júnior B', 'Vera Núñez', mj, '20:30–22:00', 345),
  ] },
]
export const senior = team('Sénior amateur', 'Iván Mena', lx, '21:00–22:30', 360, true)

export const news = [
  { slug: 'una-manana-de-cantera', date: '2026-11-22', label: '22 NOV 2026', section: 'Crónica', photo: 'equipo',
    title: 'Una mañana de cantera', intro: 'El Mini A remontó en el último cuarto para cerrar el sábado con un 64–58.',
    body: ['El partido cambió después del descanso. El equipo recuperó espacio con pases cortos y encontró tiros cerca del aro tras varios rebotes ofensivos.', 'En el último cuarto, el Mini A sostuvo la ventaja con ayudas en defensa. La grada del Pabellón Municipal acompañó al equipo hasta la última posesión.'] },
  { slug: 'el-infantil-cierra-en-defensa', date: '2026-11-21', label: '21 NOV 2026', section: 'Crónica', photo: 'femenino',
    title: 'El Infantil cierra en defensa', intro: 'El Infantil femenino se llevó un partido de pocas posesiones ante Arroyo.',
    body: ['El 52–46 se decidió en el último tramo. Arroyo recortó distancias al inicio del cuarto periodo y Pinar Alto recuperó el control del rebote.', 'El cuerpo técnico destacó la comunicación en los cambios defensivos y el trabajo de las jugadoras que salieron desde el banquillo.'] },
  { slug: 'campus-de-verano', date: '2026-11-19', label: '19 NOV 2026', section: 'Campus', photo: 'aro',
    title: 'El verano se juega aquí', intro: 'Dos semanas de baloncesto en julio para niñas y niños de 7 a 14 años.',
    body: ['Del 5 al 16 de julio de 2027, el pabellón abrirá de lunes a viernes de 9:00 a 14:00. Habrá estaciones de tiro, juegos de pase y partidos reducidos, con grupos por edad.', 'Cada participante debe traer agua, almuerzo y zapatillas de pista. Secretaría atiende las consultas sobre turnos y plazas.'] },
  { slug: 'tres-por-tres-del-barrio', date: '2026-11-15', label: '15 NOV 2026', section: 'Barrio', photo: 'bote',
    title: 'El barrio juega al 3x3', intro: 'La pista auxiliar acoge el torneo vecinal del 12 de diciembre.',
    body: ['Los partidos se jugarán a media pista, con grupos de cantera y un turno abierto para personas adultas. Los equipos pueden contar con hasta cuatro integrantes.', 'La mesa de organización abrirá a las 9:30. Para apuntar a un equipo, escribe a secretaría con los nombres y las edades.'] },
  { slug: 'puertas-abiertas', date: '2026-11-10', label: '10 NOV 2026', section: 'Cantera', photo: 'tablero',
    title: 'Una tarde de puertas abiertas', intro: 'El 4 de diciembre puedes probar una sesión en el pabellón.',
    body: ['La pista auxiliar abrirá de 17:00 a 19:00. Habrá grupos de iniciación y un entrenamiento de muestra para quienes ya juegan.', 'Las familias podrán hablar con el equipo técnico sobre horarios, equipación y cuotas. Solo hace falta traer ropa cómoda y agua.'] },
  { slug: 'equipacion-reversible', date: '2026-11-04', label: '04 NOV 2026', section: 'Club', photo: 'manos',
    title: 'Dos caras, un escudo', intro: 'Presentamos la camiseta reversible de la temporada 2026/27.',
    body: ['El azul noche se usa como local y el blanco tiza como visitante. El dorsal y el escudo ocupan el mismo sitio en ambas caras para facilitar la lectura desde la grada.', 'La equipación está incluida en la cuota. Las familias pueden consultar las tallas y probar una muestra en secretaría.'] },
]
