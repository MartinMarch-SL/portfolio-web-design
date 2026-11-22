# 05 · Simón Lera — pintor (Valencia)

Pintor ficticio de óleo abstracto-matérico, estudio en el Cabanyal. Web para exponer y vender obra original y atraer galerías. Ruta: `simon-lera/`.

## Identidad
- Concepto: **la web es un lienzo imprimado**. Fondo blanco cálido con trama de lino sutil (textura generada, no imagen pesada) y grano. Nada de bloques de color: la profundidad sale de la obra, la sombra proyectada de los bastidores y la luz.
- Tokens: `--gesso:#FBF8F2` `--lienzo:#F3EDE2` `--imprimacion:#E7DECF` `--carbon:#1D1A16` `--sepia:#6F6455` `--siena:#9C4F2E` (siena solo en detalles mínimos: subrayado activo, número de obra).
- Tipografía: Bodoni Moda (display; cursiva para títulos de obra) + Hanken Grotesk (texto, cifras tabulares para fichas). No reutilizar fuentes de otros ejemplos.
- Movimiento: lento (700–1400 ms), curvas suaves, 3D con perspectiva real. Lenis. Reduced-motion: fundidos.

## Elementos originales
1. **El reverso (hero, WebGL con OGL)**: un lienzo 3D sobre bastidor de madera (grosor visible, sombra suave sobre la pared) gira despacio con el scroll y muestra su **reverso**: madera, tela cruda, grapas y la etiqueta manuscrita del pintor (título, año, técnica, firma). Pasa de "obra" a "objeto hecho a mano".
2. **Luz rasante (ficha de obra)**: shader que trata la luminancia de la foto como relieve y la ilumina con una luz rasante que sigue el cursor (o recorre sola en móvil/scroll). Se ve la materia del óleo como en un museo con linterna. Toggle "Luz de sala / Luz rasante".
3. **Escala real**: en la ficha, la obra a escala junto a una silueta humana de línea fina (1,75 m) y la línea de un sofá, conmutables.

## Transiciones
- View Transitions entre la sala (catálogo) y la ficha: el cuadro "se descuelga" de la pared y se convierte en la imagen de la ficha (morph del mismo elemento).
- Catálogo "Sala": muro blanco en perspectiva 3D (CSS 3D, transform) con scroll horizontal dentro de contenedor sticky; los cuadros cuelgan a alturas y tamaños proporcionales a sus medidas reales, con cartela pequeña. En móvil, columna vertical con leve inclinación 3D al entrar.

## Páginas
- `/simon-lera/` inicio: hero El reverso → serie actual (3 obras) → frase del pintor → estudio (foto) → próxima exposición → contacto.
- `/simon-lera/obra/` sala con filtro por serie (Salitre, Cal, Mediodía) y disponibilidad (texto, no píldoras).
- `/simon-lera/obra/[slug]/` ficha: luz rasante, escala real, datos (técnica, medidas, año, estado: disponible/reservado/colección privada), "Solicitar información" (formulario simple, sin backend, mensaje de confirmación).
- `/simon-lera/estudio/` proceso: imprimación, capas, tiempos de secado; fotos de taller.
- 9 obras en 3 series.

## Fotos (Unsplash)
Pinturas abstractas matéricas de paleta cálida y coherente (ocres, cal, siena, azul salitre), fotografiadas planas; detalles de empaste; taller, manos, pinceles, espátula; pared de galería. Sin logos, sin IA.
