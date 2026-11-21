# Showcase de webs de ejemplo — Índice + Ejemplo 01 «RUIDO» (moda urbana)

Fecha: 2026-11-21 · Estado: pendiente de aprobación

## Intención y porqué

Una web privada (no indexada, sin nombre del autor) que sirve para **enseñar a clientes potenciales lo que se puede hacer**. Entra por un índice sobrio desde el que se abre cada web de ejemplo, cada una de un negocio ficticio. Público final de esos ejemplos: particulares, autónomos y pequeñas empresas.

El criterio de éxito es que un cliente piense «esto lo ha hecho un estudio senior», **no** «esto es una plantilla / está hecho con IA».

## Objetivos

1. **Índice** sobrio, elegante y profesional que liste los ejemplos y lleve a cada uno.
2. **Ejemplo 01: RUIDO**, una marca de ropa urbana ficticia (Barcelona), en formato lookbook editorial + tienda funcional simulada.
3. Mucha animación y acabado de alta gama, **solo con herramientas open source** (licencias OSI: MIT/OFL/Apache).
4. Arquitectura que permita añadir ejemplos nuevos sin tocar los existentes.

## No-objetivos

- Pagos reales, backend, cuentas de usuario, CMS.
- SEO / indexación (se añade `noindex`).
- Los demás ejemplos (se diseñan uno a uno más adelante).

## Anti-objetivos (fracaso aunque «funcione»)

- Estética IA genérica: degradados morados/azules, glassmorphism por defecto, tarjetas con sombra suave en rejilla de 3, emojis, iconos de Lucide en círculos, «Soluciones innovadoras».
- Que el índice y RUIDO compartan estilos o parezcan del mismo kit.
- Texto de relleno (lorem ipsum) o copy vago. Todo el contenido es concreto y creíble: precios, tejidos, gramajes, tallas, fechas de drop.
- Animación que entorpece: bloqueos de scroll, esperas largas, mareo. Se respeta `prefers-reduced-motion`.
- Imágenes generadas con IA.

## Restricciones

- Todo open source. GSAP queda **descartado** (gratuito pero no OSI).
- Fotografía real con licencia libre de uso (Unsplash License), descargada y servida localmente y optimizada. Requiere abrir `images.unsplash.com` (y `unsplash.com` para buscar) en el entorno; se pedirá en el momento.
- **Codex escribe el código**; Claude define, especifica, revisa, verifica en navegador (Playwright) y hace commit.
- Debe funcionar bien en móvil (375 px) y escritorio (1440 px+).

## Enfoques considerados

| Enfoque | Pros | Contras |
|---|---|---|
| **A. Astro multipágina** (elegido) | Cada ejemplo aislado con estilos propios; HTML estático rápido; islas JS solo donde hace falta; View Transitions nativas | Interactividad tipo app (carrito) requiere un pequeño store en JS |
| B. SPA Vite + React | Interacción tipo app sencilla | Base compartida → ejemplos tienden a parecerse; más peso |
| C. HTML/CSS/JS a mano | Control total | Mucha repetición al crecer |

Elegido A por aislamiento entre ejemplos y rendimiento. Decisión de Claude, aceptada por el usuario.

## Stack

- **Astro 7** (salida estática), TypeScript.
- **Motion** (MIT) — animaciones JS, scroll-linked, springs.
- **Lenis** (MIT) — scroll suave.
- **OGL** (MIT) — WebGL ligero para el efecto de distorsión de imágenes en RUIDO.
- Fuentes vía **Fontsource** (OFL), autoalojadas.
- View Transitions API (vía `<ClientRouter />` de Astro) para transiciones entre páginas de un mismo ejemplo.
- Playwright (preinstalado) para verificación y capturas.

## Estructura

```
src/
  pages/
    index.astro                 ← índice
    ruido/index.astro           ← portada campaña
    ruido/tienda.astro          ← catálogo + filtros
    ruido/producto/[slug].astro ← ficha
    ruido/checkout.astro        ← pago simulado + confirmación
  showcase/                     ← estilos/componentes SOLO del índice
  examples/ruido/               ← estilos, componentes, datos y scripts SOLO de RUIDO
    data/products.ts
public/examples/ruido/img/      ← fotos optimizadas (AVIF/WebP)
```

Regla: nada de `examples/ruido` se importa desde el índice ni viceversa. Cada ejemplo tiene su propio layout, tokens y fuentes.

## Parte 1 — Índice

**Tono**: galería / estudio de arquitectura. Sobrio, tipográfico, casi sin color.

- Paleta: papel cálido `#F3F1EC`, tinta `#141414`, gris `#8A8780`; modo oscuro invertido.
- Tipografía: **Fraunces** (serif variable, ejes ópticos) para títulos + **Inter Tight** para texto.
- Layout: cabecera mínima («Catálogo de proyectos — 2026»), y un **índice tipográfico en filas grandes**: número (01, 02…), nombre del proyecto, sector, año, etiquetas. Líneas finas separando filas.
- Interacción: al pasar por una fila, una **imagen de vista previa sigue al cursor** con inercia (Motion spring) y recorte animado; la fila desplaza el texto ligeramente. En móvil, la vista previa aparece en línea dentro de la fila.
- Filas futuras visibles pero desactivadas, marcadas «En preparación» (p. ej. Restaurante, Estudio de arquitectura, Fisioterapeuta, Fotógrafo de bodas, Inmobiliaria), para mostrar amplitud. Solo RUIDO es enlace activo.
- Entrada: las líneas se dibujan y el texto aparece con máscara, escalonado; una vez, breve (< 1,2 s).
- Transición al ejemplo: la imagen de vista previa se expande a pantalla completa y se navega.
- `noindex, nofollow`. Sin nombre del autor.

## Parte 2 — RUIDO (moda urbana)

**Concepto de marca** (ficticia): RUIDO, colectivo de ropa urbana de Barcelona. Series cortas producidas en talleres de L'Hospitalet y drops numerados. Algodón pesado, cortes amplios, gráficos tipográficos. Voz: directa, seca, en castellano con algo de catalán («Fet a Barcelona»), sin exclamaciones.

**Dirección visual**
- Paleta: negro asfalto `#0E0E0E`, hormigón `#C9C6BF`, blanco tiza `#EDEBE6` y **naranja de seguridad `#FF4F00`** como único acento.
- Tipografía: **Archivo** variable (eje de anchura 62–125) para display, condensada/expandida según contexto. **JetBrains Mono** para etiquetas, precios y metadatos («SS27 / DROP 04 / 380 GSM»).
- Rejilla de 12 columnas visible a ratos (líneas finas de 1 px), textura de **grano** (SVG feTurbulence) sobre todo el sitio, piezas tipo cinta/pegatina rotadas que rompen la rejilla.

**Artefactos de diseño y animación**
1. **Hero cinético**: la palabra RUIDO a pantalla completa cuya anchura tipográfica (eje `wdth`) y tracking responden al scroll y al cursor; foto de campaña revelándose por máscara.
2. **Ticker / marquesina** infinita con la info del drop, que acelera con la velocidad de scroll y cambia de sentido.
3. **Cuenta atrás** al próximo drop en mono, con dígitos que ruedan.
4. **Sección de drop en scroll horizontal** con la escena fijada (sticky), productos que entran con parallax.
5. **Distorsión WebGL** (OGL) de la imagen de producto al pasar el cursor (desplazamiento con ruido + separación RGB sutil). Fallback a CSS si no hay WebGL.
6. **Cursor propio** con etiqueta contextual («VER», «ARRASTRA», «AÑADIR») y botones magnéticos.
7. **Lookbook** editorial con imágenes a sangre, recortes asimétricos y pies de foto en mono.
8. Transiciones entre páginas con View Transitions: la foto de la tarjeta vuela a su sitio en la ficha.
9. Reducción de movimiento: todo lo anterior degrada a fundidos simples.

**Páginas**
- **Portada**: hero cinético → marquesina → drop actual (scroll horizontal) → manifiesto en texto grande que se revela por palabras → lookbook → taller/proceso (números: 3 talleres, 380 g/m², 200 piezas por modelo) → newsletter «Avísame del próximo drop» (sin envío real; confirma en la UI) → pie.
- **Tienda**: rejilla con filtros (categoría, talla, color) y orden; animación de reordenación (layout FLIP con Motion); cambio a vista densa/amplia.
- **Ficha de producto**: galería con arrastre, selector de talla (con tallas agotadas), color, guía de tallas en panel, detalles (tejido, gramaje, corte, cuidados), «Completa el look».
- **Carrito**: panel lateral con contador animado, cambio de cantidades, envío gratis desde 120 €; estado en `localStorage`.
- **Checkout**: formulario simulado (sin datos reales enviados) → confirmación con número de pedido y animación.

**Catálogo**: ~12 productos (hoodies, camisetas heavyweight, cargo, chaqueta work, gorra, tote) con nombres propios, precios en € (35–189 €), tallas XS–XXL, 1–3 colores.

## Despliegue — GitHub Pages

- Repo público `MartinMarch/portfolio-web-design` → URL `https://martinmarch.github.io/portfolio-web-design/`.
- `astro.config` con `site: 'https://martinmarch.github.io'` y `base: '/portfolio-web-design'`. **Todos** los enlaces internos y rutas de assets deben pasar por `import.meta.env.BASE_URL` (nunca rutas absolutas `/...`), o se rompen en Pages.
- Workflow `.github/workflows/deploy.yml` con la acción oficial `withastro/action` + `actions/deploy-pages`, disparado en push a `main` y manualmente (`workflow_dispatch`).
- Paso manual único del usuario: Settings → Pages → Source: «GitHub Actions».
- Se publica cuando el trabajo de la rama se fusiona en `main`.
- `noindex` en todas las páginas + `robots.txt` con `Disallow: /`.

## Proceso de trabajo con Codex

Claude escribe el plan por tareas pequeñas y verificables. Para cada tarea: especificación precisa → `codex exec` dentro del repo → Claude revisa el diff, ejecuta `astro build`, saca capturas con Playwright en móvil y escritorio, y devuelve correcciones a Codex hasta que cumple → commit en `claude/frontend-expert-skills-lnxuoj`.

## Decisiones de Claude (revisables)

- Nombre y concepto de marca «RUIDO», Barcelona, paleta naranja de seguridad.
- Tipografías Archivo + JetBrains Mono (RUIDO) y Fraunces + Inter Tight (índice).
- Mostrar las filas futuras «En preparación» en el índice.
- Fotos de Unsplash.

## Lo que queda a criterio del constructor

Detalles de easing/duraciones dentro de la dirección anterior, estructura interna de componentes, nombres de productos y textos (respetando la voz), selección concreta de fotos.
