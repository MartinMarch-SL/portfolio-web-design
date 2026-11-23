# 11 · CT Las Moreras: club de tenis de barrio con escuela

Club ficticio fundado en 1961 en el barrio (ficticio) de Las Moreras. Tiene 8 pistas de tierra batida, 3 rápidas y 2 de minitenis, casa club con terraza y unos 900 socios. La escuela tiene 320 alumnos. Ruta `las-moreras/`. Es escaparate del club para familias y socios, y plataforma de **preinscripción en la escuela** y de **reserva de pista**, ambas simuladas (no se envía nada). Mismo nivel que Los Almendros y Pinar Alto, con una identidad totalmente distinta.

## Identidad: club social con solera, tierra batida al sol
- Referencia: un club de tenis clásico mediterráneo, con el polvo de ladrillo, las líneas blancas recién barridas, la sombra de las moreras sobre la grada y el marcador de madera. Es elegante y cálido, con aire de revista de club y nada de la estética de grandes torneos.
- Tokens: `--marfil:#F4EFE6` (fondo dominante), `--arcilla:#C4552D` (tierra batida: superficies y foto, y el acento del botón principal, ≤6 % en interfaz), `--polvo:#E2A47F`, `--tinta:#17233A` (texto y secciones oscuras, azul tinta), `--seto:#355A44` (verde de los setos y lonas, solo en detalles), `--cal:#FFFFFF` (líneas de pista) y `--grafito:#5E6470` (texto secundario).
- Tipos:
  - **Fraunces** (titulares, óptica display, pesos 400–600, cursiva en acentos);
  - **Manrope** (texto);
  - **IBM Plex Mono** (marcadores, horarios, cuotas y reservas).

  Todas las fuentes ya están instaladas, y el ejemplo queda aislado.
- Escudo propio en SVG: óvalo con dos raquetas de madera cruzadas bajo una hoja de morera, con "CT LAS MORERAS" y "1961" en dos tintas.
- Superficies, alternando tres:
  - "marfil": papel con grano fino;
  - "tierra batida": foto real de arcilla con textura de barrido y líneas blancas;
  - "tinta": azul profundo, para noches de torneo y el footer.

  Las secciones se unen con una línea de pista o un corte recto.
- Prohibido: emojis, flechas de símbolo, píldoras, tarjetas de colores, manchas de degradado y plantilla SaaS.

## 3D (sencillo y bonito, con fallback)
1. **Pelota** (OGL) en el hero: amarilla con fieltro (normales con ruido fino y un borde ligeramente difuso), la costura curva blanca y luz de sol cálida. Bota despacio sobre la arcilla con una sombra que se contrae, y en cada bote deja una marca ovalada en la tierra que se desvanece. Fallback en SVG. Con reduced motion, quieta.
2. **Pista en perspectiva** (CSS 3D o OGL) en el hero y en el club: tierra batida real con las líneas dibujándose y la red con su cinta blanca. Al hacer scroll la cámara baja a ras de red.
3. **Marcador de madera** (CSS) con el resultado del último partido del equipo (formato de tenis por sets, por ejemplo 6–4 3–6 7–5), con placas que giran al cambiar.

## Datos (temporada 2026/27)
- **Escuela infantil por año de nacimiento:** Minitenis 2020–2021, Benjamín 2018–2019, Alevín 2016–2017, Infantil 2014–2015, Cadete 2012–2013 y Júnior 2010–2011. Fuera de rango: escuela de adultos o contacto.
- **Niveles:** iniciación, perfeccionamiento y competición. El de competición requiere prueba de nivel, que aparece como un paso informativo.
- **Cuota:**
  - por días por semana: 1, 2 o 3 días, de 45 a 140 €/mes según categoría y días;
  - matrícula de 30 € y 15 % de descuento si el padre o la madre es socio;
  - 10 % para el segundo hermano;
  - pago mensual o trimestral (con un 5 % de descuento).
- **Reserva de pista:**
  - 13 pistas: tierra batida, rápida y minitenis;
  - franjas de 1 h de 8:00 a 22:00;
  - precio de socio y de no socio, con suplemento de luz desde las 19:00;
  - ocupación ficticia determinista por fecha;
  - máximo 2 reservas activas por persona.
- Noticias: 6 ficticias (Open de verano del club, campus de Semana Santa, ascenso del equipo júnior, torneo social de dobles, obras de iluminación LED y nueva escuela de adultos).
- Competición: equipos por edades en ligas ficticias, con clasificación (puntos por eliminatorias ganadas) y resultados de enfrentamientos (por ejemplo, 4–1 en partidos). También un ranking interno del club (escalera) con nombres ficticios y una tabla de próximos torneos.

## Páginas
- `/las-moreras/` inicio:
  - hero de tierra batida con la pelota botando y el titular, por ejemplo "Tierra batida desde 1961." con un acento en cursiva;
  - marcador de madera del último partido;
  - selector rápido de año de nacimiento que da categoría, horario y cuota;
  - reserva rápida (fecha y franja → pistas libres);
  - la escuela (método por etapas), noticias, el club en cifras, la casa club y la terraza, el campus de verano, patrocinadores locales como wordmarks y un footer con wordmark grande.
- `/las-moreras/escuela/` categorías, niveles, horarios y entrenadores.
- `/las-moreras/reservas/` reserva de pista:
  - un calendario de 7 días con la parrilla de pistas × horas (tierra batida, rápida y minitenis), donde las ocupadas no se pueden elegir;
  - selección de pista y hora, socio o no socio y número de jugadores;
  - resumen con el precio, el localizador `CTM-R-XXXXX` y un .ics descargable, con autoguardado y la opción de cancelar.
- `/las-moreras/noticias/` + `[slug]`, `/las-moreras/competicion/` (equipos, ranking y torneos) y `/las-moreras/club/` (historia, instalaciones con la pista 3D, hazte socio informativo, contacto y mapa SVG).
- `/las-moreras/inscripcion/` preinscripción en la escuela en 4 pasos:
  1. Fecha de nacimiento y nivel: categoría, grupos y horarios disponibles y cuota en vivo según los días elegidos.
  2. Datos del alumno o alumna: incluye si es zurdo o diestro, la experiencia previa y la talla del polo.
  3. Tutor, número de socio opcional para el descuento, y autorizaciones (médica, imagen y datos).
  4. Resumen con el código `CTM-26-XXXXX` y justificante descargable.

  A la derecha va una ficha pegajosa con estética de carné de club. Se autoguarda con try/catch y lleva el aviso "Demostración: no se envía ningún dato".

## Movimiento
Lento y soleado: la pelota bota con easing natural y la marca de la arcilla se desvanece, las líneas de pista se dibujan, las placas del marcador giran, hay scroll suave con Lenis y View Transitions. Con reduced motion solo hay fades.

## Calidad
Se aplican las reglas de AGENTS.md: url(), noindex, 375/1440 px sin scroll horizontal, matriz responsive y `src/examples/las-moreras/` aislado. Tests unitarios: categoría por fecha (bordes), cuotas con todos los descuentos y plazos que cuadran exactos, disponibilidad y precio de las reservas (luz, socio y límite), validación y códigos. E2E de la preinscripción completa y de una reserva completa (con el .ics), incluido el autoguardado. En projects.ts va con el kind "Clubes y asociaciones", capturas de escritorio y móvil y favicon 3D propio (el escudo).
