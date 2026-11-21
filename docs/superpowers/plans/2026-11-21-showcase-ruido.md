# Showcase Index + RUIDO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Execution method (set by the user):** Claude is the lead — writes each task brief, reviews diffs, runs verification and commits. **Codex CLI writes the code** via `codex exec -s workspace-write -C <repo> "<brief>" < /dev/null`. Each brief = this plan's task + Global Constraints + relevant spec section.

**Goal:** A static Astro site deployed to GitHub Pages with a sober showcase index and a first, fully interactive example: RUIDO, a fictional Barcelona urban-wear brand (campaign home, shop, product, cart, mock checkout).

**Architecture:** Astro multi-page static output. Index and each example live in isolated folders with their own layout, tokens and fonts; nothing is shared but a base-URL helper. Interactivity is plain TypeScript client scripts (Motion, Lenis, OGL); pure logic (cart, filters) is unit-tested with Vitest; pages are smoke-tested with Playwright.

**Tech Stack:** Astro 7, TypeScript, Motion 14, Lenis 1.3, OGL 1.0, Fontsource (Fraunces, Inter Tight, Archivo, JetBrains Mono), Vitest, Playwright (preinstalled Chromium).

**Spec:** `docs/superpowers/specs/2026-11-21-showcase-ruido-design.md`

## Global Constraints

- Open-source (OSI) dependencies only. **No GSAP**, no UI kits, no Tailwind component libraries, no icon packs in circles.
- `astro.config.mjs`: `site: 'https://martinmarch.github.io'`, `base: '/portfolio-web-design'`, `output: 'static'`, `trailingSlash: 'always'`.
- Every internal href and asset path goes through `url()` from `src/lib/url.ts`. No literal `href="/..."` or `src="/..."` anywhere.
- Every page: `<meta name="robots" content="noindex, nofollow">`. `public/robots.txt` = `User-agent: *\nDisallow: /`.
- No author name anywhere. All copy in Spanish (RUIDO may use some Catalan). No lorem ipsum, no exclamation marks in RUIDO copy.
- `src/showcase/**` and `src/examples/ruido/**` never import from each other.
- Every animation has a `prefers-reduced-motion: reduce` path (simple fades or none). Cursor, magnetic buttons and WebGL hover are disabled on `(hover: none)` devices.
- `localStorage` access always wrapped in try/catch; site works without it.
- Layout correct at 375 px and 1440 px, no horizontal page scroll (except intended horizontal-scroll section, which is inside a sticky container).
- Photos: Unsplash License, stored under `public/examples/ruido/img/` and `public/showcase/img/`, max 1600 px wide, WebP, < 300 KB each. No AI-generated images.
- RUIDO tokens: `--asphalt:#0E0E0E; --concrete:#C9C6BF; --chalk:#EDEBE6; --signal:#FF4F00`. Index tokens: `--paper:#F3F1EC; --ink:#141414; --muted:#8A8780` (inverted in dark mode).

## Review Focus

1. **Base path on GitHub Pages** — every link/asset resolves under `/portfolio-web-design/`; a link checker over `dist/` finds zero 404s (Task 9).
2. **Touch / no-hover devices** — no invisible custom cursor, no hover-only content; preview images on the index show inline on mobile (Tasks 2, 4).
3. **Reduced motion** — with `reducedMotion: 'reduce'` pages render fully, nothing stuck at opacity 0 (Task 9).
4. **Sold-out sizes / no size chosen** — "Añadir" disabled until an in-stock size is selected (Task 7).
5. **No storage / no WebGL** — cart works in memory if `localStorage` throws; images show plain if WebGL context fails (Tasks 3, 6).

---

### Task 0: Photos (Claude, not Codex)

Needs `images.unsplash.com` + `unsplash.com` allowed in the environment.

- [ ] Pick ~18 logo-free streetwear/urban photos (campaign, lookbook, product-on-model, workshop) + 1 preview for the index; consistent cold/neutral grade.
- [ ] Download, resize to ≤1600 px WebP with `sharp`, save under `public/examples/ruido/img/` with descriptive names; write `public/examples/ruido/img/CREDITS.md` (photographer + Unsplash URL per file).
- [ ] Commit.

### Task 1: Scaffold, config, deploy, test harness

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `src/lib/url.ts`, `public/robots.txt`, `.github/workflows/deploy.yml`, `vitest.config.ts`, `playwright.config.ts`, `tests/unit/url.test.ts`, `tests/e2e/smoke.spec.ts`, `.gitignore`

**Interfaces:**
- Produces: `url(path: string): string` — joins `import.meta.env.BASE_URL` with `path`, strips duplicate slashes, keeps trailing slash for page paths (`url('ruido/') === '/portfolio-web-design/ruido/'`, `url('/examples/ruido/img/a.webp') === '/portfolio-web-design/examples/ruido/img/a.webp'`).
- npm scripts: `dev`, `build`, `preview`, `test` (vitest run), `e2e` (playwright test against `astro preview` on port 4321).

- [ ] **Step 1:** Write `tests/unit/url.test.ts` with the two assertions above plus `url('') === '/portfolio-web-design/'`.
- [ ] **Step 2:** `npm test` → FAIL (module missing).
- [ ] **Step 3:** Scaffold Astro project, deps, `url.ts`, robots.txt, a placeholder `src/pages/index.astro`.
- [ ] **Step 4:** `deploy.yml`: on push to `main` + `workflow_dispatch`; jobs build (`withastro/action@v3`) and deploy (`actions/deploy-pages@v4`), permissions `pages: write, id-token: write`.
- [ ] **Step 5:** `tests/e2e/smoke.spec.ts`: GET `/portfolio-web-design/` → status 200, has `meta[name=robots][content*=noindex]`.
- [ ] **Step 6:** `npm test && npm run build && npm run e2e` → all PASS.
- [ ] **Step 7:** Commit `chore: scaffold Astro site with Pages deploy and test harness`.

### Task 2: Showcase index

**Files:**
- Create: `src/showcase/Layout.astro`, `src/showcase/tokens.css`, `src/showcase/projects.ts`, `src/showcase/index-reveal.ts`, `src/showcase/preview-cursor.ts`; Modify: `src/pages/index.astro`; Test: `tests/e2e/index.spec.ts`

**Interfaces:**
- Produces: `projects: { n: string; name: string; sector: string; year: number; tags: string[]; href?: string; preview?: string; status: 'live' | 'soon' }[]` — RUIDO live (`href: url('ruido/')`); soon: Restaurante, Estudio de arquitectura, Fisioterapia, Fotografía de bodas, Inmobiliaria.

- [ ] **Step 1:** `index.spec.ts`: 6 rows render; exactly 1 `a[href$="/ruido/"]`; "En preparación" rows are not links; at 375 px `document.documentElement.scrollWidth <= 375`.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Build per spec "Parte 1": Fraunces + Inter Tight, typographic rows with hairlines, staggered mask reveal (< 1.2 s total), cursor-following preview (Motion spring) on hover-capable devices, inline preview on touch, click → preview scales to fullscreen then navigates. Dark mode via `prefers-color-scheme`.
- [ ] **Step 4:** Run → PASS. Claude: screenshots desktop + mobile, design review.
- [ ] **Step 5:** Commit `feat: showcase index`.

### Task 3: RUIDO foundation

**Files:**
- Create: `src/examples/ruido/Layout.astro`, `styles/tokens.css`, `styles/base.css`, `components/Header.astro`, `components/Footer.astro`, `components/Grain.astro`, `scripts/smooth-scroll.ts` (Lenis), `scripts/cursor.ts`, `scripts/magnetic.ts`, `scripts/motion-prefs.ts`, `data/products.ts`; Test: `tests/unit/products.test.ts`

**Interfaces:**
- Produces `type Size = 'XS'|'S'|'M'|'L'|'XL'|'XXL'`; `type Category = 'sudaderas'|'camisetas'|'pantalones'|'chaquetas'|'accesorios'`;
  `interface Product { slug; name; category: Category; price: number /* EUR */; colors: {name: string; hex: string}[]; sizes: Size[]; soldOut: Size[]; fabric: string; gsm?: number; fit: string; care: string[]; images: string[] /* paths for url() */; drop: string; description: string; isNew: boolean }`;
  `products: Product[]`; `getProduct(slug: string): Product | undefined`.
- Produces `prefersReducedMotion(): boolean`, `canHover(): boolean` in `motion-prefs.ts`.
- Cursor: elements with `data-cursor="VER|ARRASTRA|AÑADIR"` set the label.

- [ ] **Step 1:** `products.test.ts`: 12 products; unique slugs; every price in 35–189; every `soldOut ⊆ sizes`; every image path exists in `public/`.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement data (copy per spec voice: names, 380 GSM etc.), layout with Archivo variable + JetBrains Mono, grain overlay, header (logo, Tienda, Lookbook, cart button with count), Lenis, cursor + magnetic (disabled when `!canHover()`), `<ClientRouter />`.
- [ ] **Step 4:** Run → PASS. Commit `feat(ruido): foundation, data and global interactions`.

### Task 4: RUIDO home page

**Files:** Create `src/pages/ruido/index.astro`, `src/examples/ruido/components/{Hero,Ticker,Countdown,DropRail,Manifesto,Lookbook,Workshop,Newsletter}.astro` + matching scripts in `scripts/`; Test `tests/e2e/ruido-home.spec.ts`

**Interfaces:** Consumes `products`, `url`, `prefersReducedMotion`, `canHover`. `Countdown` target: next Friday 18:00 Europe/Madrid, computed client-side.

- [ ] **Step 1:** Spec: all 8 sections present (by `data-section` attr); newsletter submit with a valid email shows confirmation text without network request; no horizontal page overflow at 375 px.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Build sections per spec "Artefactos" 1–4, 7 and "Páginas → Portada". Hero `wdth` axis driven by scroll progress (Motion `scroll()`); ticker speed scales with Lenis velocity and flips direction; DropRail is sticky horizontal scroll (vertical scroll on mobile ≤ 768 px); manifesto reveals word by word.
- [ ] **Step 4:** Run → PASS; Claude visual review at 375/1440 + reduced motion.
- [ ] **Step 5:** Commit `feat(ruido): campaign home`.

### Task 5: WebGL image distortion

**Files:** Create `src/examples/ruido/scripts/distort.ts`, `components/DistortImage.astro`

**Interfaces:** `<DistortImage src alt class? />` renders a plain `<img>` always; `distort.ts` upgrades it with an OGL canvas on `canHover() && !prefersReducedMotion()` and a successful WebGL context; noise displacement + subtle RGB split driven by pointer velocity; lazily initialised via IntersectionObserver; canvas destroyed on `astro:before-swap`.

- [ ] **Step 1:** Implement; use in DropRail and shop cards.
- [ ] **Step 2:** Verify: Playwright with `--disable-webgl` arg shows images; normal run shows `canvas` on hover; no console errors.
- [ ] **Step 3:** Commit `feat(ruido): WebGL hover distortion`.

### Task 6: Cart store + drawer

**Files:** Create `src/examples/ruido/lib/cart.ts`, `components/CartDrawer.astro`, `scripts/cart-ui.ts`; Test `tests/unit/cart.test.ts`

**Interfaces:**
- `interface CartLine { slug: string; size: Size; color: string; qty: number }`
- `addItem(lines, line): CartLine[]` (merges same slug+size+color), `removeItem(lines, index)`, `setQty(lines, index, qty)` (qty ≤ 0 removes, max 9),
  `subtotal(lines, products): number`, `shipping(sub: number): number` (0 if sub ≥ 120 or sub = 0, else 4.95), `loadCart(): CartLine[]`, `saveCart(lines): void` (key `ruido-cart-v1`, try/catch, falls back to in-memory), dispatches `window` event `ruido:cart`.

- [ ] **Step 1:** `cart.test.ts`: merge on duplicate; qty clamp 9; setQty 0 removes; shipping(119.99)=4.95, shipping(120)=0, shipping(0)=0; `loadCart` returns `[]` when `localStorage.getItem` throws.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement pure functions. **Step 4:** Run → PASS.
- [ ] **Step 5:** Drawer UI: slides from right, focus trap, Esc closes, animated count in header, free-shipping progress bar, "Finalizar compra" → `url('ruido/checkout/')`.
- [ ] **Step 6:** Commit `feat(ruido): cart`.

### Task 7: Shop + product pages

**Files:** Create `src/pages/ruido/tienda.astro`, `src/pages/ruido/producto/[slug].astro`, `src/examples/ruido/lib/filter.ts`, `components/{ProductCard,Filters,Gallery,SizePicker,SizeGuide}.astro`, `scripts/{shop,product}.ts`; Test `tests/unit/filter.test.ts`, `tests/e2e/ruido-shop.spec.ts`

**Interfaces:**
- `filterProducts(products, { category?: Category; size?: Size; color?: string }): Product[]` (size filter excludes sold-out sizes); `sortProducts(products, 'nuevo'|'precio-asc'|'precio-desc'): Product[]`.
- Product card image has `transition:name={`ruido-img-${slug}`}`; same name on the product hero image.

- [ ] **Step 1:** `filter.test.ts`: category filter; size filter excludes products where that size is sold out; price sorts both ways stable.
- [ ] **Step 2:** `ruido-shop.spec.ts`: filtering "sudaderas" shows only sudaderas; product page "Añadir" disabled until size chosen; sold-out size buttons disabled; adding updates header count to 1 and persists after reload.
- [ ] **Step 3:** Run → FAIL. **Step 4:** Implement per spec (FLIP reorder with Motion, dense/wide toggle, draggable gallery, size guide panel, "Completa el look" = 3 products from other categories). **Step 5:** Run → PASS; Claude visual review.
- [ ] **Step 6:** Commit `feat(ruido): shop and product pages`.

### Task 8: Mock checkout

**Files:** Create `src/pages/ruido/checkout.astro`, `scripts/checkout.ts`; Test extend `ruido-shop.spec.ts`

- [ ] **Step 1:** Test: with 1 item, filling form + submit shows order number matching `/^RD-\d{6}$/`, cart becomes empty; empty cart shows link back to tienda. No network request on submit.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement (form with native validation, banner "Demostración: no se realiza ningún cobro", confirmation animation). **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `feat(ruido): mock checkout`.

### Task 9: Hardening & final verification (Claude)

- [ ] `tests/e2e/links.spec.ts`: crawl every `a[href]` and `img[src]` from `/portfolio-web-design/` within the site → all 200.
- [ ] Reduced-motion run of all e2e specs (`use: { reducedMotion: 'reduce' }` project) → PASS, and no element with computed opacity 0 in viewport after load.
- [ ] Full-page screenshots of every page at 375 and 1440; design review against anti-goals; fix via Codex.
- [ ] `npm test && npm run build && npm run e2e` → all PASS. Commit, push.
- [ ] Ask user to merge to `main` and set Pages source to GitHub Actions.
