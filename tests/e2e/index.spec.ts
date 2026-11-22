import { expect, test } from '@playwright/test'

const base = '/portfolio-web-design/'
const examples = [
  ['RUIDO', 'ruido'],
  ['Bar Caribe', 'bar-caribe'],
  ['Inés Arranz', 'ines-arranz'],
  ['Marès', 'mares'],
  ['Simón Lera', 'simon-lera'],
  ['Lía Ferro', 'lia-ferro'],
]

test.beforeEach(async ({ page }) => {
  await page.goto(base)
  await expect(page.locator('[data-carousel]')).toHaveAttribute('data-ready', '')
})

test('filtra por tipo de web', async ({ page }) => {
  const projects = page.getByRole('list', { name: 'Proyectos' })
  const filters = page.getByRole('group', { name: 'Tipo de web' })
  await expect(projects.getByRole('link')).toHaveCount(6)
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
  await filters.getByRole('button', { name: 'Todas 6' }).click()
  await expect(projects.getByRole('link')).toHaveCount(6)
})

test('permite recorrer el carrusel con el teclado y abrir la web', async ({ page }) => {
  const first = page.getByRole('link', { name: 'RUIDO', exact: true })
  await first.focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('link', { name: 'Bar Caribe', exact: true })).toBeFocused()
  await page.keyboard.press('ArrowLeft')
  await expect(first).toBeFocused()
  await page.keyboard.press('ArrowLeft')
  await expect(page.locator('[data-name]')).toHaveText('Lía Ferro')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(base + 'lia-ferro/')
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

test('una pantalla lateral pasa al frente y abre su ejemplo', async ({ page, baseURL, reducedMotion }) => {
  test.skip(reducedMotion === 'reduce', 'Las pantallas laterales están fuera de escena')
  await page.setViewportSize({ width: 1440, height: 900 })
  await expect(page.locator('[data-current] .screen-preview')).toHaveJSProperty('currentSrc', new URL(base + 'showcase/img/screens/ruido-desktop.webp', baseURL).href)
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

test('el catálogo móvil deja ver todos los filtros y ajusta el carrusel a la pantalla frontal', async ({ page, baseURL, reducedMotion }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.evaluate(() => document.fonts.ready)
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0)

  const filters = page.getByRole('group', { name: 'Tipo de web' })
  const lastFilter = filters.getByRole('button').last()
  await filters.evaluate(row => { row.scrollLeft = row.scrollWidth })
  await expect(lastFilter).toBeInViewport({ ratio: 1 })
  expect(await filters.evaluate(row => {
    const lastTab = row.lastElementChild!.getBoundingClientRect()
    return row.getBoundingClientRect().right - lastTab.right
  })).toBeGreaterThanOrEqual(0)

  const header = (await page.getByRole('banner').boundingBox())!
  const title = page.getByRole('heading', { level: 1 })
  const titleBox = (await title.boundingBox())!
  const titleLineHeight = await title.evaluate(element => {
    const style = getComputedStyle(element)
    return parseFloat(style.lineHeight) / parseFloat(style.fontSize)
  })
  const tabs = (await filters.boundingBox())!
  const stage = (await page.locator('[data-stage]').boundingBox())!
  const card = await page.locator('[data-current] .screen').evaluate(face => face.getBoundingClientRect().toJSON())
  const name = (await page.locator('[data-name]').boundingBox())!
  const footer = (await page.locator('footer').boundingBox())!
  expect(card.width).toBeGreaterThanOrEqual(390 * .86)
  expect(card.width).toBeLessThanOrEqual(390 * .88)
  expect(card.height).toBeCloseTo(844 * .52, 0)
  expect(card.left).toBeGreaterThan(0)
  expect(card.right).toBeLessThan(390)
  expect(Math.abs(card.x + card.width / 2 - 390 / 2)).toBeLessThanOrEqual(4)
  const preview = page.locator('[data-current] .screen-preview')
  await expect(preview).toHaveJSProperty('currentSrc', new URL(base + 'showcase/img/screens/ruido-mobile.webp', baseURL).href)
  await expect(preview).toHaveCSS('object-fit', 'cover')
  await expect(preview).toHaveCSS('object-position', '50% 0%')
  const logo = (await page.getByRole('link', { name: 'Catálogo de proyectos' }).boundingBox())!
  const nav = (await page.getByRole('navigation', { name: 'Menú del catálogo' }).boundingBox())!
  expect(logo.x).toBeCloseTo(header.x, 0)
  expect(nav.x + nav.width).toBeCloseTo(header.x + header.width, 0)
  expect(titleLineHeight).toBeCloseTo(.91, 2)
  expect(titleBox.y - (header.y + header.height)).toBeCloseTo(20, 0)
  expect(tabs.y - (titleBox.y + titleBox.height)).toBeCloseTo(16, 0)
  expect(stage.y - (tabs.y + tabs.height)).toBeCloseTo(12, 0)
  expect(card.y + card.height / 2).toBeCloseTo(stage.y + stage.height / 2, 0)
  const nameGap = name.y - (card.y + card.height)
  expect(nameGap).toBeGreaterThanOrEqual(16)
  expect(nameGap).toBeLessThanOrEqual(24)
  expect(footer.y - (name.y + name.height)).toBeCloseTo(24, 0)
  expect(footer.y + footer.height).toBeLessThanOrEqual(844)

  if (reducedMotion !== 'reduce') {
    const [leftPeek, rightPeek] = await page.evaluate(({ left, right, top, height }) => {
      const y = top + height / 2
      const hasSideCard = (x: number) => Boolean(
        document.elementFromPoint(x, y)?.closest('[data-project]:not([data-current]) .screen'),
      )
      return Array.from({ length: innerWidth }, (_, x) => x + .5).reduce(([leftPeek, rightPeek], x) => [
        leftPeek + Number(x < left && hasSideCard(x)),
        rightPeek + Number(x > right && hasSideCard(x)),
      ], [0, 0])
    }, card)
    expect(leftPeek).toBeGreaterThan(0)
    expect(rightPeek).toBeGreaterThan(0)
    expect(Math.abs(leftPeek - rightPeek)).toBeLessThanOrEqual(1)
  }
})

test('el carrusel móvil mantiene separadas las seis pantallas al girar', async ({ page, reducedMotion }) => {
  test.skip(reducedMotion === 'reduce', 'El carrusel no gira con movimiento reducido')
  const stage = page.locator('[data-stage]')
  const touch = await page.context().newCDPSession(page)
  await stage.locator('[data-current] a').focus()

  async function checkRing() {
    const result = await stage.evaluate(async element => {
      const cards = [...element.querySelectorAll<HTMLElement>('[data-project]')]
      const screens = cards[0].parentElement!
      const step = 2 * Math.PI / cards.length
      let clearance = Infinity
      let spacingError = 0
      let frames = 0
      do {
        await new Promise(requestAnimationFrame)
        const transforms = cards.map(card => new DOMMatrixReadOnly(getComputedStyle(card).transform))
        const widest = Math.max(...cards.map(card => parseFloat(getComputedStyle(card).width)))
        const minimum = widest / (2 * Math.tan(step / 2))
        for (const [index, matrix] of transforms.entries()) {
          const next = transforms[(index + 1) % transforms.length]
          // The ring moves each card by R × (cos(angle) − 1) in depth.
          if (matrix.m11 < .9) clearance = Math.min(clearance, matrix.m43 / (matrix.m11 - 1) - minimum)
          const cosine = matrix.m11 * next.m11 + matrix.m13 * next.m13
          spacingError = Math.max(spacingError, Math.abs(cosine - Math.cos(step)))
        }
        frames++
      } while (screens.getAnimations().some(animation => animation.playState === 'running'))

      const front = element.querySelector('[data-current]')!
      const card = front.getBoundingClientRect()
      const bounds = element.getBoundingClientRect()
      const y = card.top + card.height / 2
      const hits = Array.from({ length: bounds.width }, (_, x) => x + .5 + bounds.left)
        .map(x => document.elementFromPoint(x, y)?.closest('[data-project]'))
      const index = cards.indexOf(front as HTMLElement)
      const left = cards[(index + cards.length - 1) % cards.length]
      const right = cards[(index + 1) % cards.length]
      return {
        clearance, spacingError, frames,
        centerError: Math.abs((card.left + card.right - bounds.left - bounds.right) / 2),
        inset: Math.min(card.left - bounds.left, bounds.right - card.right, card.top - bounds.top, bounds.bottom - card.bottom),
        frontOccluded: hits.slice(Math.ceil(card.left - bounds.left), Math.floor(card.right - bounds.left)).filter(hit => hit !== front).length,
        leftPeek: hits.filter((hit, x) => x + .5 + bounds.left < card.left && hit === left).length,
        rightPeek: hits.filter((hit, x) => x + .5 + bounds.left > card.right && hit === right).length,
      }
    })
    expect(result.clearance).toBeGreaterThan(3)
    expect(result.spacingError).toBeLessThan(.001)
    expect(result.centerError).toBeLessThan(1)
    expect(result.inset).toBeGreaterThan(0)
    expect(result.frontOccluded).toBeLessThanOrEqual(2)
    expect(result.leftPeek).toBeGreaterThan(0)
    expect(result.rightPeek).toBeGreaterThan(0)
    expect(Math.abs(result.leftPeek - result.rightPeek)).toBeLessThanOrEqual(1)
    return result.frames
  }

  for (const width of [390, 375]) {
    await page.setViewportSize({ width, height: 844 })
    await stage.scrollIntoViewIfNeeded()
    await checkRing()
    for (const [index, [name]] of examples.slice(1).entries()) {
      if (index % 2 === 0) await page.keyboard.press('ArrowRight')
      else {
        const box = (await stage.boundingBox())!
        const y = Math.round(box.y + box.height / 2)
        await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 250, y }] })
        await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 140, y }] })
        await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
      }
      await expect(page.locator('[data-name]')).toHaveText(name)
      expect(await checkRing()).toBeGreaterThan(1)
    }
    await page.keyboard.press('ArrowRight')
    await expect(page.locator('[data-name]')).toHaveText('RUIDO')
    await checkRing()
    await page.keyboard.press('ArrowLeft')
    await expect(page.locator('[data-name]')).toHaveText('Lía Ferro')
    expect(await checkRing()).toBeGreaterThan(1)
    await page.keyboard.press('ArrowRight')
    await expect(page.locator('[data-name]')).toHaveText('RUIDO')
    await checkRing()
  }
})
