# Ejemplo 03 — INÉS ARRANZ · Psicología

## Cliente (ficticio)
Inés Arranz, psicóloga general sanitaria (col. CV-14872). Consulta en Ruzafa, Valencia, y también online. Trabaja ansiedad, estrés, autoestima, duelo y terapia de pareja con un enfoque integrador (TCC y ACT). La web debe **captar pacientes** (confianza y claridad), **agendar citas** (un flujo de reserva muy fácil) y servirle de **blog personal** que pueda mantener ella sola (posts en Markdown).

## Idea
**"Un sitio donde bajar el ritmo."** Moderno y con mucho estilo, pero sereno: las animaciones respiran, nunca gritan. El gesto que la identifica es una **forma orgánica que respira** (WebGL con OGL, gradiente suave con ruido) al ritmo 4-4-6. Aparece en el hero y en el widget "Respira conmigo". Tipografía editorial grande con mucho aire. Nada de stock de manos cogidas, cerebros ni piezas de puzle.

## Identidad
- Tokens: `--avena:#F1ECE4` (fondo), `--tinta:#1F1D2B` (texto), `--salvia:#8FA894`, `--arcilla:#C2704F` (acento y CTA), `--niebla:#CFC8E8` (lavanda suave), `--noche:#17151F` (secciones oscuras).
- Tipos (Fontsource): **Fraunces** variable (titulares, con SOFT alto y algunas cursivas expresivas), **Manrope** (texto e interfaz).
- Texturas: grano suave y bordes muy redondeados solo en los elementos interactivos. La rejilla es editorial y asimétrica.

## Páginas (`/ines-arranz/…`)
1. **Inicio**: un hero con la forma que respira, el titular "Hablar ayuda. Empecemos despacio." y un CTA "Reserva una primera llamada gratuita (15 min)". Después: con qué te puedo ayudar (tarjetas que se expanden), cómo es el proceso en 3 pasos (línea que se dibuja con el scroll), el widget **"Respira conmigo"** (1 minuto, con un círculo guiado y textos "inspira / mantén / suelta"), opiniones anónimas, tarifas (60 €/sesión de 50 min; online y presencial igual), los últimos 3 posts del blog y FAQ.
2. **Agenda**: un flujo de reserva por pasos con transiciones suaves: motivo → modalidad (presencial/online/llamada gratuita 15 min) → día y hora (calendario semanal con huecos disponibles) → datos (nombre, email, teléfono, nota opcional, aceptar privacidad) → confirmación con resumen y botón "Añadir al calendario" (.ics generado en cliente). Horario: L–J 9:00–14:00 y 16:00–20:00, V 9:00–14:00. No se reserva con menos de 24 h. Los huecos ocupados salen de datos mock deterministas. Todo simulado.
3. **Blog**: una colección de contenido de Astro (`src/content/` o la carpeta del ejemplo) en Markdown con frontmatter (título, fecha, categoría, extracto, portada, tiempo de lectura calculado). Listado con filtro por categoría (Ansiedad, Relaciones, Autoestima, Hábitos) y un post destacado grande. 5 posts reales, bien escritos en español, de 500–800 palabras cada uno.
4. **Post**: barra de progreso de lectura, índice lateral fijo en desktop, citas destacadas, una caja final "¿Te has sentido identificada/o? Reserva una llamada", posts relacionados y un RSS de los posts.
5. **Sobre mí**: foto, trayectoria (formación, colegiación), enfoque y valores, y espacio de consulta (fotos).

Footer: datos de contacto, la nota "Si estás en crisis, llama al 024", el enlace de privacidad (texto simple) y la vuelta al catálogo.

## Movimiento
Lenis y Motion; OGL para la forma que respira, con un fallback de CSS (radial-gradient con scale/opacity) si no hay WebGL o con reduced-motion. Titulares que entran por líneas, imágenes con un desvelado suave (clip con transform/opacity a través de un wrapper con escala), la línea del proceso y transiciones entre pasos del formulario. Solo transform y opacity.

## Fotos (Unsplash)
Retrato de mujer profesional (cálido, natural), espacio de consulta (sillón, plantas, luz natural), detalles (taza, libreta, ventana), naturaleza calmada para portadas del blog. Sin logos.

---
## Rediseño v2 (sustituye identidad, home y agenda)
Feedback del dueño: poco elegante, colores planos, emojis, "parece IA". Nuevo concepto: **monografía editorial / carta personal**. Sobrio, con profundidad por fotografía (serie de retratos de la misma mujer en su consulta), grano de papel, tipografía de libro.
- Tokens: `--marfil:#F3EFE7`, `--tinta:#1C1B19`, `--ciruela:#4A2C3A` (único acento), `--piedra:#9C9388` (secundario), `--sombra:#2A2622` (secciones oscuras).
- Tipos: **Newsreader** (display y lectura, ópticos), **Inter Tight** (etiquetas pequeñas en versalitas espaciadas).
- Fuera: el blob OGL, las tarjetas de color, las píldoras, los emojis/pictogramas, los fondos planos de lavanda o salvia.
- Artefactos: (1) **Reestructuración cognitiva** en el hero: un pensamiento automático se tacha con una línea fina y se reescribe en una versión más amable; hay 3 pares en ciclo. (2) **La primera sesión, minuto a minuto**: una regla de 0' a 50' en una sección sticky, con una aguja que avanza con el scroll y explica cada momento. (3) **Agenda de papel**: una doble página con el calendario del mes y las horas como renglones. (4) Blog como **Cuaderno** (ensayos Nº 01…), con notas al margen (sidenotes) en desktop.
