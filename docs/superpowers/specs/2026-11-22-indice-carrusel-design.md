# Índice v2 — carrusel 3D por tipo de web

Mantener el índice sencillo, oscuro (tokens del índice en modo oscuro: `--paper` y `--ink` invertidos, como ya estaba), tipografía muy grande y gruesa (Archivo en peso máximo / ancho expandido). Profundidad 3D, sin adornos. Sin emojis, flechas de símbolo, píldoras ni tarjetas de colores.

## Estructura
1. Cabecera mínima: marca del catálogo a la izquierda; menú a la derecha con "Webs" y **"Encargo"** (`url('encargo/')`).
2. Titular enorme y grueso (2 líneas como mucho).
3. **Filtro por tipo de web** (no por número de ejemplo): pestañas tipográficas grandes en una fila (subrayado/peso que cambia; sin fondo ni píldora), con contador en mono: Todas · Tienda online · Reservas y citas · Portfolio · Catálogo · Hostelería. Campo nuevo `kind` en `projects.ts` (RUIDO=Tienda online; Bar Caribe=Hostelería; Inés Arranz y Lía Ferro=Reservas y citas; Marès=Catálogo; Simón Lera=Portfolio). El sector sigue como dato secundario.
4. **Carrusel 3D**: anillo/cilindro de "pantallas" (capturas reales de cada web, no la foto de stock) en perspectiva, con luz y sombra de contacto, la del frente nítida y grande, las demás giradas y atenuadas. Navegación: arrastrar, rueda/trackpad horizontal, flechas de teclado y botones Anterior/Siguiente (texto, no símbolos). Debajo, nombre del proyecto gigante y grueso + tipo + sector + "Ver web". Al cambiar de filtro, el anillo se recompone con una transición lenta (las que salen se hunden, las que entran se levantan). Clic en la frontal abre la web; en una lateral la trae al frente.
5. Cada pantalla puede mostrar escritorio y, al pasar el ratón/mantener, la versión móvil (captura 375) deslizándose delante.
6. Cierre: bloque "Encargo" con frase grande y enlace a `/encargo/`.

## Capturas
Script `scripts/qa/capture-previews.mjs` (Playwright, sobre `astro preview`): captura cada web a 1440×900 y 375×812, pasa a WebP con sharp (≤1600 px, <300 KB) en `public/showcase/img/screens/<name>-desktop.webp` y `-mobile.webp`. Se ejecuta a mano y se commitean las imágenes.

## Técnica
CSS 3D (`transform-style: preserve-3d`, solo transform/opacity) basta; nada de OGL salvo que aporte. Reduced-motion: sin giro animado, cambio directo con fundido; lista accesible (los elementos son enlaces reales, orden de foco lógico). `(hover:none)`: sin efectos de hover; swipe. 375: una pantalla al frente con las vecinas asomando, sin scroll horizontal de página. Actualizar tests e2e del índice (filtros, navegación por teclado, enlaces) y unit de projects si aplica.
