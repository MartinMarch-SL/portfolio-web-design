# Ejemplo 02 — BAR CARIBE (bar de barrio)

## Cliente (ficticio)
Bar Caribe, C/ de la Esperanza 12, Lavapiés, Madrid. Abierto desde 1974 por la familia Ordóñez; hoy lo lleva la segunda generación (Lola en barra, Paco en cocina). Bar de toda la vida donde se come bien: menú del día, tapas de vitrina, vermut de grifo, raciones. Cierra los lunes. Cocina 13:00–16:00 y 20:00–23:30.

## Idea
**"Moderno por fuera, de toda la vida por dentro."** Rejilla y tipografía actuales, mucho aire y ritmo editorial, pero cada pieza sale de los objetos del bar: el rótulo, la pizarra del menú, la vitrina, la comanda de papel, el azulejo y la servilleta de "Gracias por su visita". Nada de estética de restaurante fino ni de plantilla. El humor es castizo y seco, sin forzarlo.

## Identidad
- Tokens: `--noche:#12100E`, `--madera:#1E1915`, `--humo:#2A231E`, `--crema:#EEE4CF`, `--ceniza:#A89B88`, `--laton:#C8A05A`, `--rotulo:#E2472C`, `--azulejo:#2E8573`, con fondo oscuro, texto crema y acentos de latón, neón rojo y verde de azulejo.
- Tipos (Fontsource): **Bricolage Grotesque** (titulares muy gordos, compactos y en mayúsculas, como un rótulo), **Instrument Sans** (texto), **Caveat** (solo para la pizarra y las notas a mano). Los precios van en cifras tabulares.
- Texturas solo con CSS: un friso de azulejo hecho con gradientes y el borde dentado del ticket. Grano suave reutilizando la técnica de RUIDO, generado propio.

## Páginas (`/bar-caribe/…`)
1. **Inicio**: hero con la foto de la barra y el rótulo "BAR CARIBE" a pantalla completa, que se enciende letra a letra (opacidad) como un neón al arrancar; debajo, "Desde 1974 · Lavapiés". Después la **pizarra del menú del día**, que cambia según el día de la semana (el lunes muestra "Hoy cerrado, vuelva mañana"). Sigue **"En la barra hoy"**, una vitrina de tapas con scroll horizontal dentro de un contenedor sticky y etiquetas de precio tipo pinza. Luego una franja de números ("50 años", "3 cafeteras", "0 manteles") y un vermut destacado. Cierra con un CTA de reserva.
2. **Carta**: secciones (Para picar, Raciones, Bocadillos, Postres caseros, Bebidas). Filtros por alérgenos y la etiqueta "de la casa". Al tocar un plato se añade a una **comanda** de papel fija (un drawer en móvil) con el total; se guarda en localStorage dentro de try/catch y tiene un botón "Pedir la cuenta" que la vacía con una broma.
3. **Reservas**: formulario con forma de comanda (nombre, teléfono, día, hora, comensales de 1 a 12). Valida contra el horario real (lunes cerrado, franjas de cocina, más de 8 comensales pide llamar). El envío es simulado y muestra un "ticket" de confirmación.
4. **La casa**: historia en línea temporal (1974, 1992, 2008, hoy), "Los de siempre" (equipo y parroquianos), y contacto, horario y cómo llegar (sin mapa embebido: una ilustración de calle hecha con CSS o un enlace).

Footer común: servilleta con "Gracias por su visita" y un enlace de vuelta al catálogo.

## Movimiento
Lenis y Motion. El neón del rótulo, las reveladas suaves, la vitrina horizontal, el ticket de la comanda que "imprime" (translateY) y un ligero vaivén del cartel de precio al hacer hover. Todo con transform/opacity y alternativa reduced-motion.

## Fotos (Unsplash)
Barra o interior del bar, tapas (croquetas, tortilla, bravas, boquerones, ensaladilla, calamares, pulpo, gildas), un vermut, la sala, la fachada o la calle, y gente (camarero, clientes). Sin logos visibles.
