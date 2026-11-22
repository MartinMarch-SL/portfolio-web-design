import { expect, test } from '@playwright/test'
import { crawlSite, siteRoot } from './site-crawl'

test('every same-site link and image returns 200', async ({ page, baseURL }) => {
  await crawlSite(page, baseURL!, { checkImages: true })
})

test('the catalogue links to Encargo only from its header menu', async ({ page }) => {
  await page.goto(siteRoot)
  const links = page.locator(`a[href="${siteRoot}encargo/"]`)
  await expect(links).toHaveCount(1)
  await expect(page.getByRole('navigation', { name: 'Menú del catálogo' })
    .getByRole('link', { name: 'Encargo', exact: true })).toHaveAttribute('href', siteRoot + 'encargo/')
})
