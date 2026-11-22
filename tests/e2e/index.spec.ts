import { expect, test } from '@playwright/test'

const base = '/portfolio-web-design/'
const examples = [
  ['RUIDO', 'ruido'],
  ['Bar Caribe', 'bar-caribe'],
  ['Inés Arranz', 'ines-arranz'],
  ['Marès', 'mares'],
  ['Simón Lera', 'simon-lera'],
  ['Lía Ferro', 'lia-ferro'],
  ['UD Los Almendros', 'los-almendros'],
]

test.beforeEach(async ({ page }) => {
  await page.goto(base)
  await expect(page.locator('[data-carousel]')).toHaveAttribute('data-ready', '')
})

test('filtra por tipo de web', async ({ page }) => {
  const projects = page.getByRole('list', { name: 'Proyectos' })
  const filters = page.getByRole('group', { name: 'Tipo de web' })
  await expect(projects.getByRole('link')).toHaveCount(7)
  await filters.getByRole('button', { name: 'Reservas y citas 2' }).click()
  await expect(projects.getByRole('link')).toHaveCount(2)
  await expect(projects.getByRole('link', { name: 'Inés Arranz' })).toBeAttached()
  await expect(projects.getByRole('link', { name: 'Lía Ferro' })).toBeAttached()
  await expect(page.locator('[data-details]')).toHaveText('Reservas y citas · Psicología')
  await filters.getByRole('button', { name: 'Hostelería 1' }).click()
  await expect(projects.getByRole('link')).toHaveCount(1)
  const onlyProject = projects.getByRole('link', { name: 'Bar Caribe' })
  await onlyProject.focus()
  await page.keyboard.press('ArrowRight')
  await expect(onlyProject).toBeFocused()
  await expect(page.locator('[data-name]')).toHaveText('Bar Caribe')
  await filters.getByRole('button', { name: 'Clubes y asociaciones 1' }).click()
  await expect(projects.getByRole('link')).toHaveCount(1)
  await expect(projects.getByRole('link', { name: 'UD Los Almendros' })).toBeAttached()
  await filters.getByRole('button', { name: 'Todas 7' }).click()
  await expect(projects.getByRole('link')).toHaveCount(7)
})

test('permite recorrer el carrusel con el teclado y abrir la web', async ({ page }) => {
  const first = page.getByRole('link', { name: 'RUIDO', exact: true })
  await first.focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('link', { name: 'Bar Caribe', exact: true })).toBeFocused()
  await page.keyboard.press('ArrowLeft')
  await expect(first).toBeFocused()
  await page.keyboard.press('ArrowLeft')
  await expect(page.locator('[data-name]')).toHaveText('UD Los Almendros')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(base + 'los-almendros/')
})

test('cada enlace abre el ejemplo de la pantalla frontal', async ({ page }) => {
  for (const [name, slug] of examples) {
    await page.getByRole('link', { name, exact: true }).focus()
    await expect(page.locator('[data-name]')).toHaveText(name)
    await expect(page.locator('[data-current] a')).toHaveAttribute('href', base + slug + '/')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(base + slug + '/')
    await page.goto(base)
  }
})

test('una pantalla lateral pasa al frente y abre su ejemplo', async ({ page, reducedMotion }) => {
  test.skip(reducedMotion === 'reduce', 'Las pantallas laterales están fuera de escena')
  await page.setViewportSize({ width: 1440, height: 900 })
  const side = page.getByRole('link', { name: 'Bar Caribe', exact: true })
  const box = (await side.boundingBox())!
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
  await expect(page.locator('[data-name]')).toHaveText('Bar Caribe')
  await side.click()
  await expect(page).toHaveURL(base + 'bar-caribe/')
})

test('el catálogo cabe en 375 px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0)
})

test('el catálogo móvil deja ver todos los filtros y tiene un pie compacto', async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.evaluate(() => document.fonts.ready)
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0)

  const filters = page.getByRole('group', { name: 'Tipo de web' })
  const lastFilter = filters.getByRole('button').last()
  expect(await filters.evaluate(row => row.scrollWidth)).toBeGreaterThan(await filters.evaluate(row => row.clientWidth))
  await expect(filters).toHaveCSS('mask-image', /linear-gradient/)
  await filters.evaluate(row => { row.scrollLeft = row.scrollWidth })
  await expect(lastFilter).toBeInViewport({ ratio: 1 })
  expect(await filters.evaluate(row => {
    const lastTab = row.lastElementChild!.getBoundingClientRect()
    return row.getBoundingClientRect().right - lastTab.right
  })).toBeGreaterThanOrEqual(0)

  const preview = page.locator('[data-current] .screen-desktop')
  await expect(preview).toHaveJSProperty('currentSrc', new URL(base + 'showcase/img/screens/ruido-desktop.webp', baseURL).href)
  await expect(preview).toHaveCSS('object-fit', 'fill')

  const header = (await page.getByRole('banner').boundingBox())!
  const logo = (await page.getByRole('link', { name: 'Catálogo de proyectos' }).boundingBox())!
  const nav = (await page.getByRole('navigation', { name: 'Menú del catálogo' }).boundingBox())!
  expect(logo.x).toBeCloseTo(header.x, 0)
  expect(nav.x + nav.width).toBeCloseTo(header.x + header.width, 0)

  const main = (await page.getByRole('main').boundingBox())!
  const footer = (await page.getByRole('contentinfo').boundingBox())!
  expect(footer.y).toBeCloseTo(main.y + main.height, 0)
  expect(footer.height).toBeLessThan(35)
  expect(footer.y + footer.height).toBeLessThanOrEqual(844)
})
