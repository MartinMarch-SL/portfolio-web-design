# Encargo v2: el briefing como juego, con contenido real y tipos de plataforma

Sustituye la dirección de arte y el flujo del spec `2026-11-22-encargo-design.md`. Se mantienen el generador de prompt, el envío a Drive y las reglas generales. Ruta `/encargo/` y código en `src/showcase/encargo/`. Se añade la página nueva `/plataformas/`.

## Intención
Encargo pasa de "brief estético" a **la herramienta con la que el estudio recoge todo lo que el cliente quiere**:
- qué tipo de web o plataforma necesita;
- su opinión sobre el diseño;
- su **contenido real**: textos por página y carpetas de imágenes.

Todo llega a la carpeta de Drive del estudio. Debe sentirse como un **juego** corto y agradable, no como un formulario. Sin precios por ahora: más adelante se estimarán horas por tipo de plataforma.

## Tipos de plataforma (modelo de negocio, sin precio)
| Tipo | Qué es | Quién edita qué | Ejemplos del catálogo |
|---|---|---|---|
| 1 · Escaparate | Web estática, solo diseño y contenido | El estudio hace los cambios de textos y fotos bajo petición | RUIDO, Marès, Bar Caribe |
| 2 · Autogestionable | Web con **usuario administrador** y panel dentro de la propia web: cambiar títulos y textos, añadir, quitar u ordenar obras, fotos, noticias y secciones | El cliente, sin tocar código | Simón Lera (añadir cuadros), Inés Arranz |
| 3 · Con funcionalidades | Lo anterior más lógica de negocio con backend: reservas, inscripciones, pagos, áreas de socios, notificaciones | El cliente gestiona datos y contenido | Las Moreras, Los Almendros, Pinar Alto, Lía Ferro |
| 4 · Plataforma | Producto con usuarios y roles, marketplace o SaaS, integraciones, panel de gestión completo | Equipos del cliente y usuarios finales | Proyectos a medida |

Cada tipo lleva su descripción breve, "incluye", "no incluye", plazo orientativo en semanas (sin precio) y qué datos va a pedir el juego. Los datos viven en `src/showcase/encargo/data/plataformas.ts`, preparados para añadir horas y precio más adelante: campos `horasMin`/`horasMax` opcionales y vacíos.

## Página `/plataformas/`
- Página del showcase en tema oscuro, enlazada desde la cabecera del índice ("Plataformas") y desde Encargo.
- Explica los 4 tipos con un esquema visual de capas que se añaden a cada nivel: diseño → panel de administración → backend y lógica → usuarios y roles. Puede ser CSS/SVG con una ligera profundidad 3D.
- Incluye una comparativa por columnas (sin precios) y enlaces a los ejemplos del catálogo de cada tipo.

## Dirección de arte de Encargo: el índice oscuro, en modo juego
- Mismos tokens y tipografía que el índice: fondo casi negro, letra grande y gruesa (Archivo e Inter Tight), mono para la numeración. Sin papel ni gesso.
- **Mecánica de juego**:
  - el recorrido es un "mapa" de niveles (pantallas cortas, una decisión principal en cada una);
  - una barra de progreso con niveles desbloqueados;
  - las elecciones son cartas grandes que se seleccionan con un toque y animación de "jugar carta";
  - comparaciones "esto o esto" (dos opciones visuales enfrentadas) para el gusto;
  - deslizadores como diales;
  - al completar un nivel, un pequeño resumen ("Desbloqueado: paleta");
  - al final, una pantalla de "partida completada" con la ficha del proyecto.
- Sin puntuaciones absurdas, sin confeti, sin emojis ni flechas de símbolo. Todo es elegante y rápido: cada nivel lleva 30–60 s.
- La maqueta viva actual se mantiene, adaptada al tema oscuro, como "tu web tomando forma" a un lado (o plegada en móvil).

## Flujo (ramificado por tipo)
0. **Elige tu tipo de web**: las 4 cartas, con "No lo sé, ayúdame" (3 preguntas rápidas que recomiendan un tipo). Enlace a /plataformas/ para saber más.
1. **Tu negocio**: nombre, sector, objetivo y público (de la v1, condensado).
2. **Tu gusto**: duelos "esto o esto" (claro u oscuro, sobrio o expresivo, foto o ilustración, quieto o con movimiento…), paleta, tipografía y nivel de 3D/animación. Reutiliza datos y muestras de la v1.
3. **Páginas y estructura**: páginas como cartas. Por cada página elegida, qué secciones quiere.
4. **Tu contenido**:
   - por cada página, campos de texto (titular, texto principal y secciones), cada uno con la opción "lo escribís vosotros";
   - **subida de carpetas de imágenes** por página o categoría (`<input type=file multiple webkitdirectory>` y arrastrar y soltar);
   - las imágenes se previsualizan en miniatura, se pueden reordenar o quitar y llevan un pie opcional;
   - el logo y los documentos (PDF de carta o tarifas) se pueden subir también.
5. **Lo que el cliente podrá editar** (solo tipos 2–4): qué cosas quiere cambiar él mismo (títulos, textos, galerías u obras, noticias, precios, horarios…), cuántos administradores habrá y con qué roles.
6. **Funcionalidades** (solo tipos 3–4): reservas, inscripciones, pagos, área privada, notificaciones, multiidioma e integraciones. En el tipo 4, además: tipos de usuario y roles, qué puede hacer cada uno, si es marketplace (vendedores, comisiones) e integraciones externas. Todo con cartas y preguntas cortas, más un campo libre "cuéntanos cómo funciona".
7. **Logística**: plazo, idiomas, dominio o hosting actual, referencias que le gustan (URLs), contacto. Sin presupuesto en cifras.
8. **Partida completada**: ficha del proyecto con el tipo, el resumen y el contenido recibido (número de textos e imágenes por página), el prompt generado (ampliado con el tipo de plataforma, el contenido editable, las funcionalidades y la lista de archivos) y un botón para enviar al estudio. Se mantienen la descarga .md y el email como plan B.

Autoguardado en localStorage (try/catch) del estado sin las imágenes. Las imágenes viven en memoria e IndexedDB (try/catch) para sobrevivir a una recarga cuando se pueda. Se puede volver a cualquier nivel desbloqueado.

## Envío a Google Drive (opción A elegida por el dueño)
- Se amplía `docs/encargo/apps-script/Code.gs`, que ya crea `Encargos/<nombre>`:
  - acción `create`: crea la carpeta del encargo y guarda `encargo.md` y `encargo.json`;
  - acción `upload`: recibe **un archivo por petición** (base64, nombre, subcarpeta) y lo guarda en `Encargos/<nombre>/imagenes/<pagina>/`;
  - acción `finish`: escribe `manifiesto.json` con la lista y un resumen.
- Cliente:
  - las imágenes se reducen en el navegador antes de enviarse (lado largo ≤2400 px, JPEG/WebP ≈0,85; se pueden enviar originales si pesan menos de 8 MB);
  - se suben en serie con reintentos y una barra de progreso por archivo y total;
  - el resto continúa si uno falla, que se puede reintentar al final.
- Límite visible para el cliente, por ejemplo 150 imágenes o unos 300 MB por encargo. Si se supera, se ofrece enviar un enlace (Drive o WeTransfer) en un campo de texto.
- Se actualiza `docs/encargo/apps-script/README.md` con los pasos para que el dueño pegue el script nuevo y vuelva a desplegar con la misma URL.
- Hay un modo de prueba sin red: con `?demo=1` o si falta la URL se simula el envío.

## Calidad
- Se mantienen las reglas de AGENTS.md: url(), noindex, 375/1440 px sin scroll horizontal, reduced motion (sin animación de cartas, solo fades) y accesible por teclado (cartas como radio o checkbox reales).
- Tests unitarios:
  - ramificación por tipo (qué niveles aparecen);
  - recomendador de "No lo sé";
  - buildPrompt v2;
  - reducción y troceo de la subida (lógica pura);
  - manifiesto.
- E2E:
  - recorrido completo tipo 1 y tipo 3 con subida de una carpeta simulada;
  - envío en modo demo;
  - recarga y recuperación;
  - /plataformas/.
