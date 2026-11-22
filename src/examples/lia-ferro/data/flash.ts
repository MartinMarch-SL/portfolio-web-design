export const styles = ['Fine line', 'Blackwork', 'Ornamental'] as const
export type Style = typeof styles[number]

interface Flash {
  id: string
  name: string
  size: number
  style: Style
  price: number
  art: string
}

export const flash: Flash[] = [
  { id: 'mandala', name: 'Umbral', size: 12, style: 'Ornamental', price: 180, art: `<path d="M19 82 Q60 77 101 82 M28 78 Q28 56 60 32 Q92 56 92 78 M39 78 Q39 58 60 45 Q81 58 81 78 M49 78 Q49 65 60 55 Q71 65 71 78 M60 70v8 M26 68 Q16 54 20 43 Q38 49 42 56 M94 68 Q104 54 100 43 Q82 49 78 56 M45 47 Q37 33 41 22 Q53 25 60 39 Q67 25 79 22 Q83 33 75 47 M60 28l-4-8 4-8 4 8z"/><path d="M31 88h58 M42 94h36 M55 100h10"/>` },
  { id: 'polilla', name: 'Nocturna', size: 10, style: 'Ornamental', price: 165, art: `<path d="M58 52Q42 29 12 28L24 53 42 63 56 59 Q28 62 24 82 Q45 87 58 68 M62 52Q78 29 108 28L96 53 78 63 64 59 Q92 62 96 82 Q75 87 62 68 M58 53Q60 45 62 53L64 70 60 83 56 70Z M58 49Q54 35 45 34 M62 49Q66 35 75 34 M23 36l18 20 13 2 M97 36L79 56 66 58 M31 76l18-8m40 8-18-8"/><circle cx="33" cy="45" r="3"/><circle cx="87" cy="45" r="3"/>` },
  { id: 'rama', name: 'Olivo', size: 11, style: 'Fine line', price: 145, art: `<path d="M28 101Q66 75 86 17 M41 90Q34 64 16 61 Q18 81 41 90Z M51 80Q61 59 88 64 Q78 81 51 80Z M60 69Q60 46 38 35 Q37 55 60 69Z M69 55Q82 36 101 39 Q93 55 69 55Z M77 40Q65 25 71 15 Q82 23 77 40Z M83 25Q82 13 97 9 Q96 21 83 25Z"/>` },
  { id: 'ola', name: 'Resaca', size: 8, style: 'Fine line', price: 120, art: `<path d="M13 80Q25 79 37 58 Q55 27 83 37 Q100 43 99 57 Q90 48 78 51 Q66 55 73 64 Q82 73 107 70 M17 87Q40 82 50 60 Q65 40 85 44 M31 93Q51 87 62 68 Q72 85 102 79 M63 90q18 5 36-2 M90 29l6-3m6 11 6 1m-4 8h6"/>` },
  { id: 'serpiente', name: 'Muda', size: 15, style: 'Fine line', price: 170, art: `<path d="M31 101Q75 100 76 84 Q77 73 53 69 Q20 64 31 48 Q40 37 65 44 Q87 50 90 37 Q91 25 74 23 L66 19 74 13 Q99 13 100 36 Q101 58 72 55 Q44 46 42 54 Q39 59 60 62 Q89 68 84 86 Q80 105 31 101Z M67 18l-8 3-6-2 M59 21l-4 4 M48 49l3 4m7-4 3 5m-6 11 3-4m11 9 3-4m4 11 7-2"/><circle cx="77" cy="18" r="1"/>` },
  { id: 'lunas', name: 'Ciclo', size: 9, style: 'Fine line', price: 130, art: `<circle cx="60" cy="60" r="14"/><path d="M38 48a12 12 0 1 0 0 24q-9-12 0-24ZM82 48a12 12 0 1 1 0 24q9-12 0-24ZM19 52a8 8 0 1 0 0 16q-10-8 0-16ZM101 52a8 8 0 1 1 0 16q10-8 0-16Z M60 31v6m0 46v6 M57 34h6m-6 52h6"/>` },
  { id: 'daga', name: 'Vigilia', size: 14, style: 'Blackwork', price: 185, art: `<path d="M60 111L50 77l5-30h10l5 30Z M60 102V50 M39 45q7-10 21-4 14-6 21 4l-6 7q-11-8-15-4-4-4-15 4Z M55 39V20l5-8 5 8v19 M55 23l10 5-10 5 10 5 M60 12V6 M36 61l-5 8 5 8 5-8Z M84 61l-5 8 5 8 5-8Z"/><path fill="currentColor" d="M55 50l-5 27 10 34-5-32z"/>` },
  { id: 'ojo', name: 'Testigo', size: 8, style: 'Blackwork', price: 145, art: `<path d="M13 60q47-46 94 0-47 46-94 0Z M23 47q37-28 74 0 M24 74q36 29 72 0 M60 24v10m0 52v10 M38 31l5 8m39-8-5 8 M38 89l5-8m39 8-5-8"/><circle cx="60" cy="60" r="16"/><circle cx="60" cy="60" r="9" fill="currentColor"/><circle cx="63" cy="56" r="2" fill="var(--flash-bg,#0c0d0f)" stroke="none"/>` },
  { id: 'constelacion', name: 'Latitud', size: 9, style: 'Fine line', price: 115, art: `<path stroke-dasharray="2 4" d="M21 75l26-24 20 10 17-35 14 10m-31 25 19 26"/><path d="M21 68v14m-7-7h14 M47 44v14m-7-7h14 M67 54v14m-7-7h14 M84 17v18m-9-9h18 M86 82v10m-5-5h10"/><circle cx="98" cy="36" r="2"/><circle cx="32" cy="32" r="1"/><circle cx="56" cy="93" r="1"/>` },
  { id: 'helecho', name: 'Sotobosque', size: 13, style: 'Fine line', price: 155, art: `<path d="M36 109Q65 67 77 11 M43 98Q17 91 13 78q23 3 30 20Q66 82 89 87q-13 12-46 11 M52 84Q27 74 24 62q21 3 28 22Q74 66 98 72q-13 12-46 12 M60 68Q38 59 34 46q20 3 26 22Q78 51 98 54q-10 12-38 14 M67 52Q49 43 47 32q15 4 20 20Q82 37 96 40q-8 9-29 12 M73 33Q62 27 60 18q11 3 13 15Q85 22 91 24q-4 7-18 9"/>` },
  { id: 'banda', name: 'Filigrana', size: 16, style: 'Ornamental', price: 190, art: `<path d="M8 40h104M8 80h104M8 45h104M8 75h104 M9 60q13-27 26 0t26 0 26 0 24 0 M9 60q13 27 26 0t26 0 26 0 24 0 M22 53l4 7-4 7-4-7Z M48 53l4 7-4 7-4-7Z M74 53l4 7-4 7-4-7Z M100 53l4 7-4 7-4-7Z"/>` },
  { id: 'montana', name: 'Cota', size: 7, style: 'Fine line', price: 110, art: `<path d="M9 81l25-28 10 11 20-32 48 49H9Z M64 32l-1 26 14 23 M45 63l-9 18 M58 48l5 10 11-15 M30 58l6 8 4-6 M17 88h86 M41 94h38"/><circle cx="88" cy="33" r="8"/>` },
]

export function flashSvg(design: Flash, color = 'currentColor') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none" color="${color}" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round">${design.art}</svg>`
}
