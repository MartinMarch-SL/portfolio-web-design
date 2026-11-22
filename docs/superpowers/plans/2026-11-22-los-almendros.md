# Plan · 07 UD Los Almendros
1. Fotos: adaptar scripts/photos/fetch-candidates.mjs con queries para `los-almendros` (≤8: niños entrenando, fútbol base, campo municipal, balón en césped, banquillo, cal del campo, grada de barrio, botas), hojas de contactos, Claude elige, apply-selection en un lote. Sin escudos ni marcas visibles.
2. Brief A (Codex, esfuerzo alto): fuentes, tokens, layout, escudo SVG, datos (categorías, equipos, noticias, competición), lógica (categoría por fecha, cuotas, validación, código) con tests unitarios, y todas las páginas con el balón OGL, el campo CSS 3D y el escudo con relieve. Preinscripción en 4 pasos con autoguardado y justificante, e2e del flujo completo, matriz responsive y placeholders hasta tener las fotos.
3. Brief B (Codex, low): integrar las fotos elegidas, la entrada en projects.ts con el kind "Clubes y asociaciones", capture-previews, favicon 3D (generate-favicons y PortfolioIcons) y las correcciones de la revisión.
4. Revisión con la hoja de contactos (1440 + 390) y, si hace falta, un brief C de correcciones con low.
5. Deploy: fast-forward a main y comprobar el run.
