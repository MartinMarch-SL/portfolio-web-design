# 08 · CB Pinar Alto: club de baloncesto de barrio

Club ficticio, fundado en 1984 en el barrio (ficticio) de Pinar Alto. Juega en el Pabellón Municipal Pinar Alto, tiene unas 260 licencias y 16 equipos. Ruta `pinar-alto/`. Es escaparate del club para las familias y **plataforma de preinscripción** (simulada, no envía nada). Pide el mismo nivel que UD Los Almendros (el dueño lo calificó de "increíble"), pero con una identidad totalmente distinta.

## Identidad: pabellón de noche, parquet y marcador
- Referencia: un pabellón municipal con parquet de arce barnizado, focos cenitales, el marcador electrónico y las líneas de la pista. Es baloncesto moderno de club con cantera: elegante, con ritmo, nada de estética NBA hortera ni graffiti.
- Tokens: `--noche:#0B1420` (fondo profundo), `--azul:#13263D` (superficies), `--arce:#D8B07A` (parquet, solo en textura y detalles), `--tiza:#F3F0EA` (texto, líneas de pista), `--naranja:#E8612C` (balón y acento: botón principal, dato clave, ≤5 %), `--marcador:#FFB23F` (cifras del marcador LED, solo en el marcador), `--niebla:#8FA0B3` (texto secundario).
- Tipos: **Saira Extra Condensed** (titulares altos, peso 700–800), **Inter Tight** (texto) y **Martian Mono** o JetBrains Mono (estadísticas, horarios, cuotas). Las fuentes son de Fontsource.
- Escudo propio en SVG: escudo redondeado con una piña estilizada y las costuras de un balón, "CB PINAR ALTO" y "1984", en dos colores.
- Superficies (sin planos de color pelados), alternando tres:
  - "pabellón": noche azul con conos de luz cenital muy sutiles;
  - "parquet": foto real de parquet de arce con veta, barnizado y oscurecido, con las líneas de la pista;
  - "acta": papel tiza con tinta azul, como un acta FEB o un programa.
  Las secciones se unen con una línea de pista o un corte limpio.
- Prohibido: emojis, flechas de símbolo, píldoras, tarjetas de colores, manchas de degradado y secciones SaaS.

## 3D (sencillo, con fallback)
1. **Balón** (OGL) en el hero: naranja con textura granulada sutil, costuras negras finas y luz cenital de foco. Rota despacio y hace un bote lento cada pocos segundos, con una sombra que se contrae al subir. Fallback en SVG y, con reduced motion, sin bote ni giro.
2. **Pista en perspectiva** (CSS 3D) en el hero: parquet real con la zona, el arco de triple y el círculo central dibujándose al entrar. La canasta (tablero de vidrio y aro naranja) va en primer plano y desenfocada, al lado del título.
3. **Marcador LED** (CSS/SVG) en la franja del próximo partido: local contra visitante, cuarto y hora, con dígitos de segmentos en `--marcador`.

## Datos (temporada 2026/27, categorías por año de nacimiento)
- Categorías: Babybasket 2019–2020, Premini 2017–2018, Mini 2015–2016, Infantil 2013–2014, Cadete 2011–2012 y Júnior 2009–2010. Hay equipos masculinos y femeninos en Mini, Infantil, Cadete y Júnior, y uno sénior amateur. Fuera de rango: mensaje con contacto.
- Cada equipo tiene entrenador o entrenadora, días y horario, pista (central o auxiliar) y cuota anual de 200–360 €. Incluye licencia, seguro y equipación reversible. Descuento del 10 % para el segundo hermano, pago en 1 o 3 plazos y 35 € de matrícula para quien es nuevo en el club.
- 6 noticias ficticias: crónicas, el campus de verano, el 3x3 del barrio, la jornada de puertas abiertas y la nueva equipación.
- Competición: clasificación de 3 equipos (Mini A, Infantil femenino y Júnior A) en grupos ficticios. Calendario y resultados con marcadores de baloncesto (por ejemplo, 64–58) y una pequeña tabla de líderes por equipo (puntos, rebotes, asistencias) con nombres ficticios.

## Páginas
- `/pinar-alto/` inicio: hero de pabellón con la pista, el balón y la canasta; marcador del próximo partido; ticker de resultados; selector rápido de año de nacimiento que adelanta categoría, horario y cuota; metodología (iniciación, formación, competición); noticias en carrusel; equipaciones reversibles en SVG que giran en 3D para enseñar las dos caras; cifras del club; campus de verano; patrocinadores locales como wordmarks; y footer con un wordmark gigante.
- `/pinar-alto/equipos/`, `/pinar-alto/noticias/` + `[slug]`, `/pinar-alto/competicion/`, `/pinar-alto/club/` (historia, pabellón, contacto con mapa SVG propio) y `/pinar-alto/inscripcion/`.
- La preinscripción repite el flujo de 4 pasos de Los Almendros con su propia identidad:
  1. Fecha de nacimiento y sexo: categoría, horario y cuota.
  2. Datos del jugador o jugadora: incluye la talla de la equipación reversible.
  3. Tutor y autorizaciones: incluida la autorización médica.
  4. Resumen con código `CBPA-26-XXXXX` y justificante descargable.

  A la derecha va una "ficha" pegajosa que se rellena en vivo, con estética de acreditación o carné de jugador. Se autoguarda en localStorage con try/catch y lleva el aviso "Demostración: no se envía ningún dato".

## Movimiento
Lento y preciso: el balón bota con easing natural, las líneas de pista se dibujan al entrar, los dígitos del marcador cambian con suavidad, hay scroll suave con Lenis y View Transitions entre páginas. Con reduced motion solo hay fades.

## Calidad
Se aplican las reglas de AGENTS.md: url(), noindex, 375/1440 px sin scroll horizontal, matriz responsive y `src/examples/pinar-alto/` aislado (no importa de los-almendros). Tests unitarios: categoría por fecha (bordes), cuotas y descuentos, validación y código. E2E del flujo completo con autoguardado. En projects.ts va con kind "Clubes y asociaciones", capturas de escritorio y móvil y favicon 3D propio (el escudo).
