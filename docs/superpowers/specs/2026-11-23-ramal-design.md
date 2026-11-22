# 09 · RAMAL Instalaciones Técnicas: instaladora MEP (Zaragoza)

Empresa ficticia, fundada en 2003, con unos 85 técnicos propios. Hace instalaciones eléctricas (baja y media tensión), climatización y ventilación, protección contra incendios (PCI), fontanería y saneamiento, fotovoltaica de autoconsumo y control (BMS). Trabaja subcontratada por ingenierías y constructoras en naves logísticas, hospitales, oficinas, hoteles y retail. Ruta `ramal/`. La web es B2B: tiene que transmitir solvencia técnica, capacidad y cumplimiento normativo. Convierte con la **solicitud de oferta** y el **dossier de empresa**. Todo es simulado, sin backend.

## Identidad: precisión de plano, acabado editorial
- Referencia: un juego de planos de instalaciones bien delineado y la estética de las ingenierías europeas actuales. Es sobria, técnica y con aire. Nada de casco amarillo, cinta de peligro ni fotos de stock de apretón de manos.
- Tokens: `--papel:#F2F1EC` (fondo claro dominante), `--grafito:#15181B` (texto y secciones oscuras), `--pizarra:#2A3036`, `--linea:#C9CCC9` (retícula y cotas), `--cobre:#C26A3A` (acento: cableado y tubería; botón principal, datos clave, ≤5 %). Colores de disciplina, solo en el modelo 3D y en las leyendas, desaturados: eléctrico `#D9A441`, clima `#4F8FB8`, PCI `#B5473A`, fontanería `#3F8C7A` y FV `#7B6FB0`.
- Tipos: **Geist** (titulares grandes y ajustados, peso 500–600; texto) y **Geist Mono** (cotas, especificaciones, cifras y referencias de plano).
- Lenguaje gráfico: retícula de plano muy tenue, cotas con flechas de delineación dibujadas en SVG (no son glifos de texto), cajetín de plano como pie de sección (proyecto, escala, revisión) y códigos de disciplina (E-, M-, PCI-, F-, FV-).
- Prohibido: emojis, flechas de símbolo en el texto, píldoras, tarjetas de colores, manchas de degradado y plantilla SaaS.

## Elemento estrella: el modelo de instalaciones (3D)
- En el hero va un modelo isométrico tipo BIM de una planta técnica: forjado, pilares, bandejas de cable, conductos de clima con difusores, tuberías de PCI con rociadores, fontanería, cuadro eléctrico y paneles FV en cubierta. Se renderiza en **OGL** con líneas limpias y caras planas en `--papel`/`--linea`, y cada disciplina en su color.
- Al hacer scroll el modelo se **despieza por capas** (cada disciplina sube y se etiqueta con cotas y datos). Un selector de disciplinas aísla cada una y la cámara gira despacio. Fallback: ilustración isométrica en SVG con las mismas capas. Con reduced motion no hay giro y el despiece es estático.
- Hay un contador de cifras de la empresa con estilo de cajetín: m² ejecutados, kWp instalados, obras al año y horas sin accidentes.

## Páginas
- `/ramal/` inicio:
  - hero con el modelo 3D y el titular, por ejemplo "Instalaciones que se entregan como se proyectan.";
  - para ingenierías y constructoras: cómo trabajamos (lectura de proyecto, replanteo y BIM, ejecución, legalización y puesta en marcha, mantenimiento);
  - disciplinas, obras destacadas, sectores, certificaciones y homologaciones, cifras, seguridad y calidad, y la llamada a solicitar oferta.
- `/ramal/disciplinas/` cada disciplina con su alcance, normativa (REBT, RITE, RIPCI, CTE) y equipos propios.
- `/ramal/obras/` un listado filtrable por sector y disciplina, y `/ramal/obras/<slug>/` con 6 obras ficticias. Cada ficha técnica lleva la ingeniería y la constructora (ficticias), la superficie, la potencia, el plazo, el alcance por disciplina, el reto y la solución, fotos y un pequeño esquema SVG.
- `/ramal/empresa/` historia, equipo técnico (cargos, sin caras de stock), medios propios, seguridad y salud, y calidad y medio ambiente. Certificaciones ficticias pero creíbles:
  - ISO 9001, 14001 y 45001;
  - instaladora habilitada en baja tensión, RITE y PCI;
  - REA;
  - póliza de responsabilidad civil.
- `/ramal/oferta/` solicitud de oferta en 3 pasos:
  1. Proyecto: tipo de obra, ubicación, superficie, disciplinas implicadas y fase (licitación, adjudicada o en obra).
  2. Documentación: adjuntar mediciones o pliego. Se leen en local y se listan con su nombre y tamaño; no se suben a ningún sitio.
  3. Contacto: empresa, CIF, persona, cargo, email y teléfono. Plazo de respuesta deseado.

  El resumen genera la referencia `RML-OF-26-XXXX` y un justificante descargable. Se autoguarda en localStorage con try/catch y lleva el aviso "Demostración: no se envía ningún dato".
- Dossier de empresa: un botón "Descargar dossier" genera en el cliente un dossier imprimible en HTML/PDF (portada, datos, capacidades, certificaciones, obras y contacto).
- Estimador orientativo en `/ramal/oferta/` o en el inicio: superficie × tipo de obra × disciplinas da el rango de plazo y el equipo estimado (técnicos), sin precios cerrados, con una nota clara de que es orientativo.

## Movimiento
Preciso y lento: el modelo se despieza con easing suave, las líneas de cota se dibujan, las cifras cuentan, hay scroll suave con Lenis y View Transitions. Con reduced motion solo hay fades.

## Calidad
Se aplican las reglas de AGENTS.md: url(), noindex, 375/1440 px sin scroll horizontal, matriz responsive y `src/examples/ramal/` aislado. Tests unitarios: validación (CIF/NIF, email, teléfono), referencia, estimador y filtro de obras. E2E de la solicitud de oferta completa (adjuntar un fichero, recargar y recuperar, resumen y descarga) y de la descarga del dossier. En projects.ts va con el kind nuevo **"Industria y servicios"**, capturas de escritorio y móvil y favicon 3D propio (isotipo).
