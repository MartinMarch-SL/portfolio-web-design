import { expect, test } from '@playwright/test'
import { crawlSite } from './site-crawl'

test('every page fits the mobile viewport', async ({ page, baseURL, isMobile }) => {
  if (!isMobile) await page.setViewportSize({ width: 375, height: 812 })
  async function inspect() {
    await page.evaluate(() => document.fonts.ready)
    const width = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(width, page.url()).toBeLessThanOrEqual(page.viewportSize()!.width)
  }
  await crawlSite(page, baseURL!, { inspect })
})
