import { artifacts, goals, motion, pages, personality, selectedPair, selectedPalette, tones, brandColors, type Answers } from '../data'

const value = (text?: string) => text?.trim() || 'Sin indicar'
const list = (items?: string[]) => value(items?.join(', '))

export function buildPrompt(answers: Answers): string {
  const [palette, paper, ink, accent] = selectedPalette(answers)
  const [pair, heading, body, headingWeight, bodyWeight] = selectedPair(answers)
  const chosenPages = (answers.pages ?? []).filter(page => Object.hasOwn(pages, page))
  const chosenArtifacts = artifacts.filter(([id]) => answers.artifacts?.includes(id))
  const goal = Object.entries(goals).find(([name]) => name === answers.goal)
  const tone = Object.entries(tones).find(([name]) => name === answers.tone)
  const character = personality.map(([left, right], index) => {
    const key = `character${index}` as `character${0 | 1 | 2 | 3 | 4}`
    const position = Number(answers[key] ?? 2)
    return position === 2 ? `equilibrio entre ${left.toLowerCase()} y ${right.toLowerCase()}`
      : `${position === 0 || position === 4 ? 'marcadamente' : 'ligeramente'} ${(position < 2 ? left : right).toLowerCase()}`
  })
  const brand = answers.brand === 'Existente'
    ? ['Respetar la identidad existente.', `Logo: ${answers.logo ? `${answers.logo.name} (${answers.logo.width} × ${answers.logo.height} px)` : 'Sin indicar'}`,
      `Colores de marca: ${list(brandColors(answers))}`, `Fuentes de marca: ${value(answers.brandFonts)}`, `Pautas: ${value(answers.brandNotes)}`]
    : ['Diseñar la identidad para el proyecto.', `Personalidad: ${character.join('; ')}.`, `Referencias: ${value(answers.references)}`, `Pautas: ${value(answers.brandNotes)}`]
  const dark = answers.mode === 'Oscuro'
  return [
    '# Brief para crear la web',
    'Construye la web completa siguiendo esta ficha. Entrega una versión utilizable desde la primera revisión.',
    `## Cliente\n- Negocio: ${value(answers.business)}\n- Sector: ${value(answers.sector === 'Otro' ? answers.otherSector : answers.sector)}\n- Ciudad: ${value(answers.city)}\n- Oferta: ${value(answers.offer)}\n- Diferenciación: ${value(answers.difference)}\n- Competencia y referencias: ${value(answers.competition)}`,
    `## Objetivos\n- Prioridad: ${value(answers.goal)}\n- Acción principal: ${value(goal?.[1])}`,
    `## Público\n${list(answers.audiences)}`,
    `## Marca\n${brand.map(line => '- ' + line).join('\n')}`,
    `## Tokens de color\nPaleta: ${palette}\n\n\`\`\`css\n:root {\n  --fondo: ${dark ? ink : paper};\n  --texto: ${dark ? paper : ink};\n  --acento: ${accent};\n}\n\`\`\``,
    `## Tipografías\n- Pareja: ${pair}\n- Titulares: ${heading}, peso ${headingWeight}\n- Texto e interfaz: ${body}, peso ${bodyWeight}\n- Escala: ${value(answers.scale)}\n- Servir fuentes OFL con Fontsource y font-display: swap.`,
    `## Texturas y luz\n- Materia: ${value(answers.texture)}\n- Luz: ${value(answers.mode)}\n- Indicaciones: ${value(answers.materialNotes)}`,
    `## Páginas\n${chosenPages.map(page => `- ${page}: ${pages[page]}.`).join('\n') || 'Sin indicar'}\n\nIndicaciones de estructura: ${value(answers.structureNotes)}`,
    `## Artefactos\n${chosenArtifacts.map(([, title, description]) => `- ${title}: ${description}`).join('\n') || 'Sin artefactos seleccionados.'}`,
    `## Movimiento y 3D\nNivel: ${value(motion[Number(answers.motion ?? 1)])}. Anima solo transformaciones y opacidad, con alternativa estática o fundido simple para movimiento reducido. Evita reacciones al puntero en pantallas táctiles.`,
    `## Tono y voz\n- Tono: ${value(answers.tone)}\n- Tratamiento: ${value(answers.address)}\n- Ejemplo: ${tone ? tone[1][answers.address === 'Usted' ? 1 : 0] : 'Sin indicar'}`,
    `## Contenido\n- Fotos: ${value(answers.photos)}\n- Idiomas: ${list(answers.languages)}\n- Funcionalidades: ${list(answers.features)}`,
    `## Logística\n- Plazo: ${value(answers.timing)}\n- Presupuesto cualitativo: ${value(answers.budget)}\n- Contacto: ${value(answers.contact)}\n- Email: ${value(answers.email)}\n- Teléfono: ${value(answers.phone)}\n- Preferencia: ${value(answers.preference)}\n- Indicaciones: ${value(answers.logisticsNotes)}`,
    '## Restricciones de diseño\n- Evita la estética de IA, emojis, iconos en círculos, píldoras, tarjetas chillones, manchas de gradiente y plantillas SaaS.\n- Combina tipografía, materia y luz con intención. Usa contraste accesible, foco visible y navegación por teclado.\n- Comprueba 375 y 1440 px sin desbordamiento horizontal. Optimiza fuentes, imágenes y animaciones. Respeta prefers-reduced-motion.',
    '## Criterios de hecho\n- Las páginas, llamadas a la acción e interacciones acordadas funcionan.\n- La identidad, el tono y el contenido reflejan el brief.\n- La web es operable en móvil y escritorio, con teclado y con movimiento reducido.',
  ].join('\n\n') + '\n'
}

export function buildJson(answers: Answers): string {
  return JSON.stringify(answers, null, 2)
}

export function slug(name = ''): string {
  return name.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').slice(0, 80).replace(/^-+|-+$/g, '') || 'encargo'
}

export function filenames(name?: string, date = new Date()) {
  const base = `${date.toISOString().slice(0, 10)}-${slug(name)}`
  return { base, markdown: `${base}.md`, json: `${base}.json` }
}
