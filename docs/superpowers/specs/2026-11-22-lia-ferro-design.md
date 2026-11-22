# 06 · Lía Ferro — tatuadora (Madrid, Malasaña)

Tatuadora ficticia de fine line, blackwork y ornamental. Ruta `lia-ferro/`. Todo frontend: disponibilidad, reservas, confirmaciones y pagos son simulados (sin backend), pero se comportan como reales.

## Identidad: elegante con un filo cyberpunk contenido
- Base sobria: casi negro cálido, piel y acero. El cyberpunk solo en el lenguaje de "escáner": líneas HUD de 1px, cotas en mono, retícula muy tenue, un único acento frío usado con cuentagotas. Nada de neón saturado, glitch, magenta, lluvia ni katakana.
- Tokens: `--tinta:#0C0D0F` `--grafito:#17191D` `--acero:#8D939B` `--piel:#E8E0D5` (texto principal) `--hueso:#F4EFE8` `--frio:#7FD6D2` (solo HUD, ≤3% de la superficie).
- Tipos: Syne (display, pesos medios, mayúsculas espaciadas en titulares), IBM Plex Sans (texto), IBM Plex Mono (HUD, cotas, precios).
- Profundidad: fotografía de piel y tinta en blanco y negro con grano, luz rasante; el 3D del configurador.

## Elementos originales
1. **El cuerpo escaneado (configurador 3D, OGL)**: maniquí procedural renderizado como escaneo (nube de puntos densa + curvas de nivel finas, color hueso sobre tinta, línea de barrido lenta). Se gira con el dedo/ratón. Zonas seleccionables (antebrazo int./ext., bíceps, hombro, clavícula, nuca, espalda alta, costillas, muslo, gemelo, tobillo). Al elegir zona la cámara viaja con suavidad y la zona se ilumina con cotas HUD (cm).
2. **El diseño sobre la piel**: el diseño elegido (flash propio en SVG o imagen subida por el usuario, leída en local) se proyecta como calcomanía sobre la zona; se escala en cm reales, se rota y se desplaza. La cota se actualiza en vivo.
3. **Presupuesto vivo**: tamaño × estilo × zona (dificultad) × color/negro → horas, nº de sesiones, rango de precio, señal. Explicación desglosada en mono, sin tarjetas.
4. **Reserva simulada**: calendario de huecos ficticio (sesiones de mañana/tarde), formulario, pago de señal falso (campo de tarjeta de demostración con aviso claro "demo, no se cobra nada"), código de reserva y resumen descargable; **cuidados**: calendario de curación día 1–30 descargable como .ics y guía por fases.

## Páginas
- `/lia-ferro/` inicio: hero (cuerpo escaneado girando lento con 2–3 piezas ya colocadas, titular), trabajos destacados, cómo funciona el encargo (4 pasos), estudio, contacto.
- `/lia-ferro/trabajos/` portfolio por estilo (fine line / blackwork / ornamental) con visor a pantalla completa.
- `/lia-ferro/encargo/` el configurador completo (zona → diseño → tamaño → presupuesto → reserva → confirmación). Estado guardado en localStorage (try/catch).
- `/lia-ferro/flash/` hoja de flash disponibles (SVG propios, finos y bien dibujados: ornamental, geométrico, botánico de línea) con "llevar al cuerpo".
- `/lia-ferro/cuidados/` guía y calendario .ics.

## Movimiento
Lento y preciso; transiciones de cámara con inercia; barrido de escáner sutil; View Transitions entre páginas. Reduced motion: sin barrido ni giro automático.
