# Ejemplo 04 — MARÈS · Propietats (inmobiliaria, Palma)

## Cliente (ficticio)
Marès Propietats es una agencia inmobiliaria boutique con oficina en Santa Catalina, Palma de Mallorca. Vende y alquila viviendas con carácter: pisos en el casco antiguo, áticos frente al mar en Portixol, casas en Son Vida y Gènova, y alguna finca en la Serra. Atiende a compradores locales y a internacionales. La web debe generar **leads** (visitas, valoraciones) y lucir el producto.

## Idea
**"La luz de Palma, en piedra."** El marès es la arenisca dorada con la que está construida la isla, y la web es luz mediterránea sobre ese material: blanco de cal, arenisca, sombras largas de mediodía y el azul profundo de la bahía. Es moderna, arquitectónica y editorial, con animaciones con peso y nada de plantilla de portal inmobiliario.

## Identidad
- Tokens: `--cal:#F6F2EA` (fondo), `--mares:#DCC7A1` (arenisca), `--badia:#0E2A38` (azul profundo: texto y secciones oscuras), `--pi:#33493B` (pino), `--teula:#B4552F` (acento), `--ombra:#6E6457` (texto secundario).
- Tipos (Fontsource): **Instrument Serif** (titulares enormes con cursivas), **Geist** (sans de interfaz y datos), y cifras tabulares para precios y m².
- Textura: una persiana mallorquina (lamas verdes, la "persiana de llibret") dibujada con CSS como motivo de transición y en revelados. La rejilla es arquitectónica, con líneas finas que la hacen visible.

## Páginas (`/mares/…`)
1. **Inicio**:
   - Un hero a pantalla completa con la foto de Palma y el titular "Casas con luz propia". Al cargar, unas lamas de persiana (en translate/scale) se abren y desvelan la foto.
   - Un buscador rápido (operación, zona, precio).
   - "Selección" con 3–4 propiedades destacadas en tarjetas apiladas sticky (stacking cards).
   - **Mapa de barrios** estilizado en SVG con la costa de la bahía y los barrios (Casco Antiguo, Santa Catalina, Portixol, Son Armadans, Gènova, Son Vida, Bendinat). Al pasar o tocar un barrio se ven su precio medio por m² y el número de viviendas, con un enlace al listado filtrado.
   - Cifras, un marquee lento de barrios y una sección de servicios.
   - CTA "¿Cuánto vale tu casa?".
2. **Propiedades**: listado con filtros (venta/alquiler, barrio, precio, habitaciones, características como terraza, piscina, vistas al mar o ascensor), orden, contador animado de resultados, estado en la URL (query params) y vista de mapa/lista.
3. **Ficha de propiedad** (`/mares/propiedades/[slug]/`, 8 propiedades): galería con lightbox accesible, datos clave (m², habitaciones, baños, planta, año, certificado energético), descripción, característica, **calculadora de hipoteca** (entrada, plazo, interés) y formulario "Solicitar visita" (simulado) con elección de franja. Al final, propiedades similares.
4. **Vender**: un valorador en 3 pasos (barrio, m², estado y extras) que da una horquilla de precio a partir del €/m² del barrio, y después el formulario de contacto. Simulado.
5. **Estudio**: el equipo (3 personas), la forma de trabajar, idiomas (ES/CA/EN/DE), la oficina y el contacto.

Footer: dirección (C/ de Sant Magí 41, Santa Catalina), teléfono, email, número de API ficticio y la vuelta al catálogo.

## Movimiento
Lenis y Motion. La persiana que se abre, titulares que entran por líneas, stacking cards, imágenes con parallax suave (translate en el wrapper), el mapa con transiciones de opacidad, contadores y transiciones de página con la View Transitions de Astro (`ClientRouter`), cuidando que los scripts se reinicialicen. Solo transform y opacity, con alternativa reduced-motion.

## Fotos (Unsplash)
Palma (catedral, casco antiguo, bahía), Santa Catalina y calles, exteriores mediterráneos (villas, piscinas, terrazas con vistas), interiores luminosos (salón, cocina, dormitorio, baño), detalles (persianas, piedra, patios) y retratos del equipo. Sin logos ni rótulos de agencias reales.

---
## Rediseño v2 (sustituye identidad y home)
Feedback del dueño: poco elegante, colores planos, "parece IA"; el eje deben ser **las casas**, no la ciudad. Nuevo concepto: **dossier de arquitectura**. Fotografía de casas a sangre, datos técnicos en mono, como un cajetín de plano.
- Tokens: `--cal:#EEEAE3`, `--carbon:#1A1A18`, `--grafito:#5B5A55`, `--olivo:#5E6146` (acento mínimo).
- Tipos: **Geist** y **Geist Mono** (datos, cotas, cajetín). Sin serif.
- Fuera: la persiana, el mapa de la bahía en la home, la foto de la catedral, los emojis y las flechas pictográficas.
- Artefactos: (1) un hero que va pasando **una casa cada vez** a sangre, con el cajetín técnico cuyas cifras ruedan. (2) un **índice tipográfico de casas** en el que la foto sigue al cursor. (3) en la ficha, un **plano vivo**: una planta SVG de trazo fino en la que, al pasar por una estancia, se ve su foto. (4) **El recorrido de la luz**: un slider de horas en el que el sol se mueve en arco y se iluminan las estancias que reciben sol según su orientación (cálculo solar para la latitud de Palma).
