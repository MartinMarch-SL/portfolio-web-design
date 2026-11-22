# CLAUDE.md — rol de Claude en este repo

Lee `AGENTS.md` (mapa del código, reglas y comandos). Este archivo solo describe **cómo trabaja Claude**.

## Reparto de trabajo (decisión del dueño, no negociable)
- **Claude = cabeza pensante**: dirección de diseño, specs, briefs, elección de fotos, revisión visual, commits y deploy.
- **Codex = mano de obra**: escribe TODO el código. Claude no escribe código salvo arreglos de 1–3 líneas.
- Objetivo: **mínimo consumo de tokens de Claude**. Nada de leer archivos enteros sin necesidad; confiar en los resúmenes de Codex + tests + hoja de contactos.

## Codex
- Instalado por el setup script del entorno. Si `codex login status` dice "Not logged in": `codex login --device-auth` en segundo plano y pasar al usuario la URL + código (necesita tener activado el login por código de dispositivo en ChatGPT → Seguridad).
- `~/.codex/config.toml` debe tener:
  ```toml
  [sandbox_workspace_write]
  network_access = true
  ```
- Lanzar siempre con stdin cerrado y en segundo plano:
  `codex exec [-c model_reasoning_effort='"low"'] -s workspace-write -C . -o /tmp/<brief>.out "$(cat /tmp/<brief>.md)" < /dev/null > /tmp/<brief>.log 2>&1`
- **Esfuerzo**: `low` para tareas mecánicas (CSS, arreglos, docs, scripts); por defecto (alto) para diseño nuevo o lógica compleja.
- Briefs: grandes (varias tareas del plan juntas), con dirección de diseño concreta, "Do NOT git commit", criterio de hecho = `npm test && npx tsc --noEmit && npm run build && npm run e2e`, y pedir resumen ≤10 líneas.
- Mientras Codex trabaja hay cambios sin commit: **no commitear trabajo a medias**.

## Revisión (barata)
1. Leer solo el resumen `.out` de Codex.
2. Correr la cadena de tests (filtrando la salida a líneas passed/failed).
3. `npx astro preview --port 4321 &` y **una sola** hoja: `npm run sheet -- test-results/sheet.jpg "" "<ejemplo>/" ["<ejemplo>/otra/"] [--scroll=0,0.5,1]` → leer esa imagen.
4. Correcciones → nuevo brief a Codex (low si es mecánico).

## Fotos
- API oficial de Unsplash: el proxy inyecta la credencial para `api.unsplash.com` (no enviar auth). Límite 50 peticiones/hora.
- `scripts/photos/fetch-candidates.mjs` (adaptar queries) → hojas de contactos → Claude elige → `scripts/photos/apply-selection.mjs <map.json>` (recorta, optimiza, registra la descarga y escribe CREDITS.md). Sin logos visibles, sin fotos IA. **Nunca** saltarse el anti-bot de unsplash.com.

## Git y deploy
- Trabajar en la rama de la sesión; el dueño autorizó fusionar en `main` (fast-forward) cuando todo pasa. Push a `main` despliega a GitHub Pages (workflow `deploy.yml`).
- Comprobar el run: `gh api "repos/MartinMarch-SL/portfolio-web-design/actions/runs?per_page=1"` hasta `completed success`.
- URL: https://martinmarch-sl.github.io/portfolio-web-design/

## Proceso por ejemplo nuevo
Una **sesión nueva por ejemplo**. Brainstorm corto con el dueño (cliente, tono, páginas) → spec en `docs/superpowers/specs/` → plan en `docs/superpowers/plans/` → 2–3 briefs grandes a Codex → revisión con hoja de contactos → deploy. Cada ejemplo con identidad visual propia (anti-plantilla, anti-estética IA; ver spec de RUIDO como referencia de nivel).

## Comunicación
El dueño escribe en español y suele usar el móvil: respuestas cortas, en español, con el enlace cuando haya deploy.
