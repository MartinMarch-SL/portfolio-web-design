# Encargo — formulario-brief con "maqueta viva"

Herramienta comercial del estudio. Ruta `/encargo/` (+ enlace "Encargo" en la cabecera/menú del índice). Código en `src/showcase/encargo/` (no importa de `src/examples/**`). Todo en español, sin precios.

## Objetivo
El futuro cliente rellena ~6 pasos (8–10 min, casi todo elecciones visuales de un toque). Al final se genera **el prompt** (Markdown) con el que el estudio pedirá a una IA crear su web de un solo intento, + JSON de respuestas. Se envía a Google Drive (Apps Script) o, como plan B, se descarga el .md y se ofrece mailto.

## Dirección de arte: "estudio de diseño en blanco"
- Materia: papel de algodón, gesso, gris cálido, tinta. Tokens propios: `--papel:#F4F1EA; --gesso:#FBFAF6; --gris:#D9D4CA; --piedra:#9C968B; --tinta:#1A1917; --grafito:#4A4741`. Acento único y mínimo: tinta (sin color de marca chillón).
- Profundidad por luz (luz cenital suave), sombras de contacto realistas en capas, grano fino (reutilizar técnica, no el archivo de ejemplos), relieve tipo papel prensado (deboss) en controles.
- Tipografía: serif editorial de display (Fontsource OFL, p. ej. Fraunces o Newsreader) + Inter Tight para UI + JetBrains Mono para fichas/numeración ("Lámina 03 / 06").
- PROHIBIDO: emojis, flechas de símbolo (→ ✓ ★), píldoras redondeadas, tarjetas de colores, manchas de gradiente, layout SaaS, iconos en círculos. Controles = muestras físicas: láminas, recortes de papel, fichas con cantos, interruptores de latón/tinta, deslizadores como reglas grabadas.
- Movimiento lento y preciso (600–1100 ms, curvas suaves), solo transform/opacity. Transición entre pasos = **pasar láminas de un muestrario**: la lámina actual se levanta en 3D (rotateX/Y con perspectiva, sombra que se alarga) y se apila detrás mientras la siguiente se asienta.

## Layout
- 1440: dos columnas. Izquierda (~45%) la lámina del paso; derecha sticky "la maqueta viva" sobre una mesa de papel con luz y sombra.
- 375: la maqueta se reduce a una franja fija superior/inferior plegable (miniatura del móvil) que puede ampliarse; nada de scroll horizontal.
- Barra de progreso: regla graduada fina con 6 marcas + numeración mono. Atrás/Siguiente siempre visibles. Cada paso puede saltarse parcialmente; "Más detalle" (details/disclosure) opcional por paso con campos extra.

## La maqueta viva (elemento principal)
- OGL: escena con un navegador de escritorio y un móvil flotando (planos con grosor/cantos biselados simulados, sombra de contacto en el suelo, leve balanceo lento y parallax con puntero en hover:hover).
- La "pantalla" es una textura generada desde un **canvas 2D** que dibuja la web del cliente a partir del estado: nombre del negocio con la pareja tipográfica elegida, paleta, textura (procedural: papel, lino, hormigón, grano, vidrio, metal, yeso, madera), luz/oscuro, estructura (nav con las páginas elegidas, hero, bloques según objetivo: botón Reservar / Comprar / Contactar / Ver obra), y un glifo/miniatura del artefacto elegido.
- Se redibuja en cada cambio con una transición suave (crossfade de texturas en el shader).
- Fallback sin WebGL o reduced-motion: el mismo canvas 2D mostrado plano en un marco CSS de navegador con sombra (sin animación en reduced-motion).

## Pasos (contenido)
1. **Tú y tu negocio**: nombre*, sector (fichas de un toque + otro), ciudad, qué vendes (texto corto), a quién (fichas de público), objetivo principal (reservas, ventas, contacto, portfolio, información, comunidad). Más detalle: competencia/referencias, qué te diferencia.
2. **Marca**: ¿ya tienes marca? Sí → subir logo (FileReader en local; se guarda nombre, dimensiones y colores dominantes extraídos por canvas, no la imagen en localStorage si >200 KB), colores (inputs color/hex), fuentes (texto). No → personalidad con 5 deslizadores de pares (clásica–contemporánea, sobria–expresiva, cálida–fría, artesanal–técnica, íntima–monumental) + referencias (texto/URLs).
3. **Color y materia**: 8–10 paletas curadas mostradas como muestras sobre textura real (recortes de papel/tela pintados, con sombra), modo claro/oscuro, textura dominante (8 opciones con muestra procedural). Si trajo colores de marca, aparece "Tu paleta" primera.
4. **Tipografía**: 6–8 parejas (todas Fontsource OFL, cargar solo las necesarias con `font-display:swap`), cada una muestra **el nombre del negocio en vivo** + una línea de texto. Más detalle: escala (contenida/generosa).
5. **Estructura y artefactos**: páginas (fichas multi: Inicio, Sobre, Servicios, Carta/Menú, Tienda, Portfolio, Blog, Reservas, Contacto, FAQ…), galería de artefactos con mini-demo viva cada uno (canvas/CSS pequeño, se anima al hover/en vista, quieto en reduced-motion):
   - Plano vivo con recorrido de la luz (Marès), Anamorfosis (Inés Arranz), Reverso del lienzo y luz rasante (Simón Lera), Escáner corporal (Lía Ferro),
   - nuevos: Muestrario de materiales que se pliega, Cuaderno de bitácora que se escribe a mano, Mesa de luz con negativos, Reloj de sombra/horario solar del local, Mapa de relieve táctil de la ciudad, Carta que se despliega como papel plegado.
   - Elegir 0–2. Nivel de animación/3D (deslizador: quieto–sutil–rico–escénico) y tono de los textos (fichas: cercano, sobrio, poético, técnico, con humor, institucional) + tú/usted.
6. **Contenido y logística**: fotos (propias / banco / sesión a encargar / mezcla), idiomas (multi), funcionalidades (reservas, tienda, blog, newsletter, formulario, mapa, multi-idioma, área privada), plazo (fichas), presupuesto orientativo SIN cifras (ajustado / estándar / ambicioso / por definir), contacto: nombre, email*, teléfono, preferencia de contacto.
- **Final**: resumen visual (la maqueta grande + ficha técnica tipo lámina), prompt generado en un bloque legible con copiar, JSON plegado, botones Enviar al estudio / Descargar .md / Escribir por email.

## Generador de prompt (`src/showcase/encargo/lib/prompt.ts`, función pura)
`buildPrompt(answers): string` → Markdown con secciones fijas: Cliente, Objetivos, Público, Marca (existente o a diseñar, personalidad en palabras), Tokens de color (CSS custom properties con hex), Tipografías (familias, pesos, uso), Texturas y luz, Páginas (lista + propósito de cada una), Artefactos (descripción técnica de cada uno elegido), Movimiento y 3D, Tono y voz (con ejemplos de frase), Contenido (fotos, idiomas, funcionalidades), Logística (plazo, presupuesto cualitativo), Restricciones de diseño (las prohibiciones del estudio: nada de estética IA, accesibilidad, reduced-motion, rendimiento, 375/1440), Criterios de hecho. Campos vacíos → "Sin indicar" o se omiten con elegancia; nunca "undefined". También `buildJson(answers)` y `slug(nombre)` para nombres de archivo `AAAA-MM-DD-<slug>.md/.json`.

## Persistencia y envío
- Autoguardado en localStorage (`encargo:v1`, try/catch, debounce). Botón discreto "Empezar de nuevo".
- `src/showcase/encargo/config.ts`: `APPS_SCRIPT_URL = ''`, `STUDIO_EMAIL = 'mmarchrovira@gmail.com'`.
- Envío: `fetch(APPS_SCRIPT_URL, {method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body: JSON.stringify({filename, markdown, json})})`. Sin URL o error → descarga automática del .md + mailto (asunto y cuerpo con resumen corto, prompt completo si cabe ~1800 chars, si no indicar que adjunte el .md).
- Confirmación elegante: lámina final "Recibido" con el sello en relieve, sin emojis.
- `docs/encargo/apps-script/Code.gs`: `doPost(e)` → busca/crea carpeta "Encargos" en Drive, crea subcarpeta o archivos `<filename>.md` y `.json`, devuelve JSON `{ok:true}`; `doGet` simple de salud. Guía `docs/encargo/apps-script/README.md` en 5 pasos.

## Requisitos técnicos
`url()` en todo, noindex, reduced-motion, fallback sin WebGL, 375/1440 sin scroll horizontal, accesible (labels, focus visible, teclado: Enter/flechas en fichas como radios/checkbox reales). Tests unitarios de `prompt.ts`; e2e del flujo completo (rellenar 6 pasos, ver prompt, recargar y conservar, atrás, fallback sin URL → descarga .md); añadir `/encargo/` a la matriz responsive.
