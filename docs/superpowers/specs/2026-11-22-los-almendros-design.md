# 07 · UD Los Almendros — club de fútbol base de barrio

Club ficticio, fundado en 1972 en el barrio (ficticio) de Los Almendros. Unas 300 fichas y 18 equipos. Ruta `los-almendros/`. La web sirve de escaparate del club para las familias y también de **plataforma de preinscripción**. Todo es frontend y la preinscripción está simulada: no envía nada.

## Identidad: club de barrio con oficio, elegante, sin plantilla deportiva
- Referencia: los programas de partido clásicos y la señalética de un campo municipal bien cuidado. Equipación verde botella con cuello crema. Las líneas de cal, los números de dorsal y las actas de partido mandan sobre los adornos.
- Tokens: `--campo:#0F3A2B` (verde botella, fondo principal) `--cesped:#1E5A43` `--cal:#F5F1E8` (texto y líneas) `--crema:#E9E0CC` `--almagre:#B4452E` (acento, máx. ~4 %: el número de la jornada, los avisos y el botón principal) `--grada:#0A2219` (zonas profundas) `--tiza:#BFC8C2` (texto secundario).
- Tipos: **Big Shoulders Display** (titulares altos y estrechos, como los rótulos de grada y los dorsales), **Hanken Grotesk** (texto) y **JetBrains Mono** (actas, tablas, horarios y cuotas).
- Escudo propio en SVG: un escudo clásico partido con una rama de almendro en flor muy estilizada, "UD" y "1972". Se dibuja limpio, a línea, con dos colores.
- Detalles gráficos: líneas de campo (área, medio círculo, punto de penalti) como trazo fino de 1px que estructura las secciones y numeración tipo dorsal. Sin emojis, sin flechas de símbolo, sin píldoras, sin tarjetas de colores, sin degradados con manchas.

## 3D (sencillo, con fallback)
1. **Balón** (OGL) en el hero del inicio: balón clásico de pentágonos y hexágonos, en crema con costuras finas y luz rasante. Gira muy despacio y responde un poco al puntero o la inclinación. Fallback: SVG estático. Con reduced motion no gira.
2. **Campo en perspectiva** (CSS 3D): el campo dibujado a línea se inclina en 3D al hacer scroll en Instalaciones y marca dónde está cada zona (campo de fútbol 11, dos de fútbol 7, vestuarios, cantina).
3. **Escudo con relieve** (CSS 3D, capas): en la cabecera de la preinscripción y en el justificante. Inclinación sutil al mover el puntero; nada en dispositivos sin hover.

## Datos (temporada 2026/27, categorías por año de nacimiento)
- Chupetines 2021–2022 (fútbol 5), Prebenjamín 2019–2020 (F7), Benjamín 2017–2018 (F7), Alevín 2015–2016 (F7/F11), Infantil 2013–2014 (F11), Cadete 2011–2012, Juvenil 2008–2010. Fuera de rango: mensaje claro con contacto. Equipos femeninos: Benjamín, Alevín e Infantil femenino.
- Cada categoría tiene equipos (A/B), entrenadores (ficticios), días y horario de entreno, campo y cuota anual (por ejemplo, de 220 € a 340 €). Incluyen ficha federativa, seguro y equipación. Descuento del 10 % para el segundo hermano, pago en 1 o 3 plazos y matrícula de 40 € para quien es nuevo en el club.
- Noticias: 6 noticias ficticias con fecha (crónicas, torneo de Navidad, jornada de puertas abiertas, nueva equipación).
- Competición: clasificación de 3 equipos (por ejemplo, Alevín A, Infantil A y Juvenil A) en grupos ficticios con 10–12 equipos inventados. Calendario con próximos partidos y últimos resultados.

## Páginas
- `/los-almendros/` inicio: hero con el balón 3D y el titular, próximo partido (acta en mono), "inscribe a tu hijo/a" con selector rápido de año de nacimiento que adelanta la categoría, valores y metodología del club, últimas noticias, cifras del club con dorsales grandes, galería y patrocinadores locales a línea (nombres inventados, sin logos reales).
- `/los-almendros/equipos/` categorías y equipos por año de nacimiento, entrenadores y horarios.
- `/los-almendros/noticias/` listado + `/los-almendros/noticias/<slug>/` detalle.
- `/los-almendros/competicion/` clasificaciones (selector de equipo) y calendario/resultados.
- `/los-almendros/club/` historia, instalaciones con el campo 3D, contacto y mapa estilizado (SVG propio, sin incrustar mapas externos).
- `/los-almendros/inscripcion/` preinscripción guiada en 4 pasos:
  1. Fecha de nacimiento (y sexo opcional, para el femenino): categoría, horario y cuota en vivo.
  2. Datos del jugador o jugadora: nombre, apellidos, DNI/NIE opcional, colegio, talla de equipación, si ha jugado antes y si tiene un hermano en el club (descuento).
  3. Tutor y autorizaciones: datos de contacto, alergias y observaciones médicas, autorización médica, consentimiento de imagen y protección de datos (casillas obligatorias redactadas con naturalidad).
  4. Resumen: desglose de la cuota, plazos, código de preinscripción y justificante descargable (HTML imprimible o PDF generado en el cliente, con el escudo). Aviso claro: "Demostración: no se envía ningún dato".
  Validación en español, en línea y accesible. Autoguardado en localStorage con try/catch, se puede volver atrás sin perder nada y hay un botón para empezar de nuevo.

## Movimiento
Lento y preciso: el balón gira despacio, las secciones entran con un desplazamiento corto y fade, y en las tablas se dibuja primero la línea de cal. Hay View Transitions entre páginas. Con reduced motion solo hay fades.

## Calidad
Se aplican las reglas de AGENTS.md: url(), noindex, 375/1440 px sin scroll horizontal, matriz responsive, `src/examples/los-almendros/` aislado. Hay tests unitarios para la categoría por fecha (con los bordes de cada año), las cuotas y descuentos, la validación y el código de preinscripción, y un e2e del flujo completo de preinscripción, incluido el autoguardado. Se añade a projects.ts con un nuevo kind **"Clubes y asociaciones"**, capturas de escritorio y móvil, y un favicon 3D propio (el escudo).
