# 10 · HALDA: consultora de innovación en visión artificial y hardware industrial (Bilbao)

Consultora ficticia fundada en 2016, con unas 40 personas (ingeniería de visión, electrónica, mecánica, software embebido y datos). Diseña y despliega sistemas de **visión artificial** y **hardware a medida** para fábricas: inspección de calidad, guiado de robots, trazabilidad, metrología y dispositivos edge. Ruta `halda/`. La web es B2B premium, con fondos negros profundos, modelos 3D profesionales y casos de uso concretos. Convierte con "Cuéntanos tu reto" (simulado, no envía nada).

## Identidad: laboratorio óptico de noche
- Referencia: la fotografía de producto de cámaras industriales sobre negro, los visores de nubes de puntos y las fichas técnicas de óptica. Es precisa, silenciosa y cara. Nada de cerebros brillantes, robots humanoides, circuitos de stock azules ni degradados violetas de "IA".
- Tokens: `--negro:#060708` (fondo), `--carbon:#0E1013` (superficies), `--acero:#1A1E23`, `--niebla:#8A939C` (texto secundario), `--blanco:#ECEFF1` (texto), `--deteccion:#3FE0B5` (uso exclusivo en las cajas de detección, el escaneo y el dato vivo, ≤3 %), `--defecto:#FF5A3C` (solo para marcar defectos detectados).
- Tipos: **Geist** (titulares grandes, pesos 400–500, tracking ajustado), **Geist Mono** (telemetría, métricas y especificaciones) e **Instrument Serif** en cursiva solo para 2–3 palabras de acento en titulares. Todas ya instaladas. Cada ejemplo está aislado, así que no se importa nada de ramal.
- Lenguaje gráfico: retículas de calibración (tablero de ajedrez, cruces de alineación), cajas de detección con etiqueta y confianza (`DEF-03 · rayado · 0,97`), escalas en mm, ejes XYZ y líneas de escaneo. La luz es protagonista: un solo foco suave sobre cada modelo y reflejos especulares discretos.
- Prohibido: emojis, flechas de símbolo, píldoras, tarjetas de colores, manchas de degradado, plantilla SaaS y cualquier cliché de "IA".

## 3D (OGL, profesional, low-poly cuidado, con fallback)
1. **Hero, "la estación de inspección"**: cámara industrial con óptica y anillo de luz sobre una cinta en la que pasan piezas mecanizadas de aluminio, despacio. Al pasar bajo la cámara, un plano de escaneo barre la pieza y aparece su réplica en nube de puntos a un lado, con una caja de detección cuando hay defecto. Los materiales son metal anodizado, aluminio cepillado y vidrio de la lente, con iluminación de estudio sobre negro. La cámara orbita ligeramente con el puntero o la inclinación.
2. **Un modelo por caso de uso**, en su ficha y en el selector de casos del inicio:
   - **Inspección superficial en línea**: pieza con defecto marcado y mapa de calor.
   - **Bin-picking robótico**: caja con piezas en nube de puntos, pose 6D estimada y la trayectoria de la pinza.
   - **AOI de placas electrónicas**: PCB con componentes y la detección de una soldadura fría.
   - **Metrología 3D**: perfil láser sobre una pieza con cotas y tolerancias.
   - **Trazabilidad**: lectura de código DPM grabado en metal.
   - **Hardware edge a medida**: carcasa de dispositivo de visión que **se despieza** (tapa, disipador, placa portadora, módulo de cómputo, sensor y óptica) con etiquetas técnicas.
3. Fallback: renders estáticos (capturas generadas en build con Playwright, o SVG detallado) con la misma composición. Con reduced motion, escenas quietas. En dispositivos sin hover, sin efectos de puntero.

## Casos de uso (ficticios, con métricas creíbles)
Seis casos, uno por modelo. Cada uno tiene:
- cliente anónimo por sector: automoción tier 1, farmacéutico, electrónica, fundición, alimentación y logística;
- reto, solución (óptica, iluminación, modelo, hardware e integración con PLC/OPC UA/MES), resultado con 3 métricas (por ejemplo, "−82 % escapes de defecto", "0,4 s por pieza", "ROI en 7 meses"), plazo del proyecto, stack y una cita del responsable de planta (nombre ficticio y cargo, sin foto de cara).

## Páginas
- `/halda/` inicio:
  - hero con la estación de inspección y el titular, por ejemplo "Vemos lo que tu línea no ve.", con un acento en serif;
  - franja de telemetría en vivo simulada (piezas/min, tasa de defectos, latencia);
  - selector de casos de uso: lista grande a la izquierda y el modelo 3D del caso a la derecha, cambiando con transición;
  - capacidades (visión artificial, hardware y electrónica, edge y MLOps, integración industrial);
  - método (diagnóstico en planta, prueba de concepto en el laboratorio, piloto en línea, despliegue y soporte);
  - laboratorio (fotos de banco de pruebas), sectores, cifras, partners tecnológicos como wordmarks genéricos sin logos reales, y CTA.
- `/halda/casos/` el índice filtrable por sector y tecnología, y `/halda/casos/<slug>/` con las 6 fichas.
- `/halda/servicios/` consultoría y diagnóstico, prueba de concepto, desarrollo de hardware (electrónica, mecánica, certificación CE), software de visión y modelos, despliegue edge y MLOps, y soporte.
- `/halda/laboratorio/` el método y el laboratorio: banco óptico, celdas robóticas, impresión 3D y equipos de medida, con fotos.
- `/halda/contacto/` "Cuéntanos tu reto" en 3 pasos:
  1. Problema: tipo (inspección, guiado, medición, lectura o hardware), sector, cadencia de la línea (piezas/min), tamaño del defecto mínimo (mm) y entorno (polvo, temperatura, vibración).
  2. Datos disponibles: imágenes de ejemplo; se adjuntan en local y se muestran como miniaturas, nada se sube.
  3. Contacto.

  El resumen genera la referencia `HLD-26-XXXX` y una **estimación orientativa** de la primera fase: tipo de PoC, duración en semanas y la resolución y el campo de visión sugeridos, calculados a partir del defecto mínimo y el tamaño de la pieza. Lleva justificante descargable, autoguardado con try/catch y el aviso de demostración.

## Movimiento
Cinematográfico pero sobrio: transiciones de cámara lentas con easing, el escaneo como único elemento "vivo", las cifras con conteo suave, scroll suave con Lenis y View Transitions. Con reduced motion solo hay fades.

## Calidad
Se aplican las reglas de AGENTS.md: url(), noindex, 375/1440 px sin scroll horizontal, matriz responsive y `src/examples/halda/` aislado. Rendimiento: cada escena 3D solo se renderiza mientras está visible (IntersectionObserver), con DPR limitado a 2 y sin postprocesado pesado. Tests unitarios: cálculo de resolución y campo de visión, la estimación de PoC, la validación, la referencia y el filtro de casos. E2E del formulario completo (adjuntar imagen, recargar, resumen y descarga) y del selector de casos. En projects.ts va con el kind "Industria y servicios", capturas de escritorio y móvil y favicon 3D propio.
