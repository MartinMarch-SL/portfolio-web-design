import { test } from '@playwright/test'
import { crawlSite } from './site-crawl'

test('every same-site link and image returns 200', async ({ page, baseURL }) => {
  await crawlSite(page, baseURL!, { checkImages: true })
})
