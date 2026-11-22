import { expect, test } from '@playwright/test'
import { crawlSite } from './site-crawl'

test('reduced motion keeps first-viewport content visible on every page', async ({ page, baseURL, reducedMotion }) => {
  test.skip(reducedMotion !== 'reduce', 'Requires the reduced-motion project')
  async function inspect() {
    const concealed = await page.evaluate(() => {
      const failures: string[] = []
      for (const element of document.body.querySelectorAll('*')) {
        if (!element.checkVisibility() || element.closest('dialog:not([open]), [hidden]')) continue
        const style = getComputedStyle(element)
        if (style.visibility !== 'visible') continue
        const rect = element.getBoundingClientRect()
        if (!rect.width || !rect.height || rect.right <= 0 || rect.bottom <= 0 ||
            rect.left >= innerWidth || rect.top >= innerHeight) continue

        const inset = style.clipPath.match(/^inset\(([^)]+)\)$/)
        let fullyClipped = false
        if (inset) {
          const [top, right = top, bottom = top, left = right] = inset[1].split(' round ')[0].split(/\s+/)
          const fraction = (value: string, size: number) => value.endsWith('%')
            ? parseFloat(value) / 100
            : parseFloat(value) / size
          fullyClipped = fraction(top, rect.height) + fraction(bottom, rect.height) >= 1 ||
            fraction(left, rect.width) + fraction(right, rect.width) >= 1
        }
        if (Number(style.opacity) === 0 || fullyClipped) {
          failures.push(`${element.tagName.toLowerCase()}${element.id ? '#' + element.id : ''} ${element.getAttribute('class') ?? ''}: opacity=${style.opacity}, clip-path=${style.clipPath}`)
        }
      }
      return failures
    })
    expect(concealed, page.url()).toEqual([])
  }
  await crawlSite(page, baseURL!, { inspect })
})

test('arrow navigation fades the front project into view', async ({ page, reducedMotion }) => {
  test.skip(reducedMotion !== 'reduce', 'Requires the reduced-motion project')
  await page.goto('/portfolio-web-design/')
  await expect(page.locator('[data-carousel]')).toHaveAttribute('data-ready', '')
  const first = page.getByRole('link', { name: 'RUIDO', exact: true })
  const next = page.getByRole('link', { name: 'Bar Caribe', exact: true })
  await first.focus()
  await page.keyboard.press('ArrowRight')
  await expect(next).toBeFocused()
  const current = page.locator('[data-project][data-current]')
  await expect(current).toHaveCSS('transition-property', 'opacity')
  await expect(current).toHaveCSS('opacity', '1')
  await expect(page.locator('[data-project]').first()).toHaveCSS('opacity', '0')
  await expect(page.locator('[data-name]')).toHaveText('Bar Caribe')
})
