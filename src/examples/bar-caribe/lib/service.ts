const menus = [
  ['Judías blancas con chorizo', 'Pollo al ajillo'],
  null,
  ['Lentejas estofadas', 'Merluza a la romana'],
  ['Sopa de cocido', 'Albóndigas en salsa'],
  ['Arroz a la cubana', 'Filete con patatas'],
  ['Garbanzos con espinacas', 'Bacalao con tomate'],
  ['Patatas a la riojana', 'Carrilleras al vino tinto'],
]
export const weekdays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
export const madridDay = (date = new Date()) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Madrid' }).format(date)
export const weekday = (day: string) => new Date(day + 'T12:00:00Z').getUTCDay()
export const dailyMenu = (day: string) => menus[weekday(day)] ?? null
export const price = (cents: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(cents / 100)
