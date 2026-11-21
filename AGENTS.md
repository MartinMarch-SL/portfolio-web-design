# Portfolio web design

Private showcase of fictional client websites, deployed as a static site to GitHub Pages under `/portfolio-web-design/`.

## Stack

- Node.js 22 and npm, Astro 7.4.13, TypeScript 7.0.2.
- Motion 14.14.0, Lenis 1.3.27, OGL 1.0.11.
- Fontsource 5.3.0 (Archivo, Inter Tight, JetBrains Mono).
- Vitest 5.1.1, Playwright 1.63.0 (Chromium), sharp 0.35.5.

## Folder map

- `src/pages/` — Astro routes for the showcase and each example.
- `src/showcase/` — showcase layout, project registry, tokens and client scripts.
- `src/lib/` — shared base URL and responsive image helpers.
- `src/examples/<name>/Layout.astro` — example page layout and metadata.
- `src/examples/<name>/components/` — example Astro components.
- `src/examples/<name>/scripts/` — example client TypeScript.
- `src/examples/<name>/styles/` — example CSS and tokens.
- `src/examples/<name>/data/` — example content and fixtures.
- `src/examples/<name>/lib/` — example logic.
- `public/examples/<name>/img/` — example photos, variants and credits.
- `public/showcase/img/` — project previews and credits.
- `scripts/photos/` — Unsplash candidates, selection and placeholders.
- `scripts/generate-responsive-images.mjs` — responsive image variants.
- `scripts/generate-grain.mjs` — grain texture.
- `scripts/perf/` — scroll performance benchmark and results.
- `scripts/qa/` — screenshot contact sheet.
- `tests/unit/` — Vitest unit tests.
- `tests/e2e/` — Playwright browser tests.
- `docs/superpowers/specs/` — design specs.
- `docs/superpowers/plans/` — implementation plans.
- `.github/workflows/deploy.yml` — GitHub Pages build and deployment.

## Hard rules

- Open-source (OSI) dependencies only. **No GSAP**, no UI kits, no Tailwind component libraries, no icon packs in circles.
- `astro.config.mjs` uses `site: 'https://martinmarch.github.io'`, `base: '/portfolio-web-design'`, `output: 'static'`, `trailingSlash: 'always'`.
- Use `url()` from `src/lib/url.ts` for every internal path, including all hrefs and asset paths. No literal `href="/..."` or `src="/..."`.
- Every page has `<meta name="robots" content="noindex, nofollow">`. `public/robots.txt` contains `User-agent: *\nDisallow: /`.
- No author name anywhere. All site copy in Spanish (RUIDO may use some Catalan). No lorem ipsum, no exclamation marks in RUIDO copy.
- `src/showcase/**` and `src/examples/**` never import from each other. Examples never import from each other.
- Animate transform and opacity only. Never animate layout properties or font variation per frame. No SVG filters or mix-blend on animated or full-viewport layers.
- Every animation needs a `prefers-reduced-motion: reduce` path (simple fades or none). Disable cursor, magnetic buttons and WebGL hover on `(hover: none)` devices.
- Wrap all `localStorage` access in try/catch. The site works without storage.
- Layout must work at 375 px and 1440 px without horizontal page scroll. Keep intended horizontal scrolling inside a sticky container. The full responsive matrix must pass.
- Use Unsplash License photos under `public/examples/<name>/img/` and `public/showcase/img/`. WebP, max 1600 px wide, under 300 KB each. No AI-generated images.
- RUIDO tokens `--asphalt:#0E0E0E; --concrete:#C9C6BF; --chalk:#EDEBE6; --signal:#FF4F00`.
- Bar Caribe tokens `--noche:#12100E`, `--madera:#1E1915`, `--humo:#2A231E`, `--crema:#EEE4CF`, `--ceniza:#A89B88`, `--laton:#C8A05A`, `--rotulo:#E2472C`, `--azulejo:#2E8573`.
- Index tokens `--paper:#F3F1EC; --ink:#141414; --muted:#8A8780` (inverted in dark mode).

## Add an example

1. Put routes in `src/pages/<name>/` and the isolated layout, components, scripts, styles, data and lib in `src/examples/<name>/`.
2. Add or update the live entry in `src/showcase/projects.ts` with its name, sector, `url()` route and showcase preview.
3. Use `scripts/photos/*` to source and process photos. The current workflow targets RUIDO, so adapt its searches, targets and credits paths for the new example. Record photographer and Unsplash URL in `CREDITS.md`.
4. Add representative routes to the explicit page matrix in `tests/e2e/responsive.spec.ts`. The links spec automatically crawls pages reachable from the showcase and checks their image references.

## Commands

```sh
export ASTRO_TELEMETRY_DISABLED=1
npm test
npx tsc --noEmit
npm run build
npm run e2e
node scripts/perf/scroll-jank.mjs
npm run preview -- --host 127.0.0.1 --port 4321
# In another terminal while preview is running
npm run sheet -- test-results/sheet.jpg "" "ruido/"
```

Do not commit. The lead reviews and commits.
