import { expect, type Page } from '@playwright/test'

export const siteRoot = '/portfolio-web-design/'

export async function crawlSite(page: Page, baseURL: string, options: { inspect?: () => Promise<void>; checkImages?: boolean }) {
  const origin = new URL(baseURL).origin
  const start = new URL(siteRoot, origin).href
  const links = new Map([[start, start]])
  const images = new Map<string, string>()

  function add(targets: Map<string, string>, values: string[], from: string, base: string) {
    for (const value of values) {
      const target = new URL(value, base)
      if (target.origin !== origin || !['http:', 'https:'].includes(target.protocol)) continue
      target.hash = ''
      if (!targets.has(target.href)) targets.set(target.href, from)
    }
  }

  for (const [url, from] of links) {
    // Check the original response so redirects cannot conceal missing or noncanonical paths.
    const response = await page.request.get(url, { maxRedirects: 0, failOnStatusCode: false })
    expect(response.status(), `${from} links to ${url}`).toBe(200)
    const isHtml = response.headers()['content-type']?.includes('text/html')
    await response.dispose()
    if (!isHtml) continue

    await page.goto(url, { waitUntil: 'load' })
    await options.inspect?.()
    const references = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href]'), element => element.getAttribute('href')!)
      const sources = Array.from(document.querySelectorAll('img[src], source[src]'), element => element.getAttribute('src')!)
      for (const element of document.querySelectorAll('img[srcset], source[srcset]')) {
        const srcset = element.getAttribute('srcset')!
        // Commas inside URL tokens belong to the URL. Trailing commas end a candidate.
        let remaining = srcset
        while (remaining) {
          const match = /^[,\t\n\f\r ]*([^\t\n\f\r ]+)/.exec(remaining)
          if (!match) break
          const url = match[1].replace(/,+$/, '')
          if (url) sources.push(url)
          remaining = remaining.slice(match[0].length)
          if (url === match[1]) {
            remaining = remaining.replace(/^(?:[^,(]|\([^)]*\))*(?:,|$)/, '')
          }
        }
      }
      return { links, sources, base: document.baseURI }
    })

    add(links, references.links, url, references.base)
    if (options.checkImages) add(images, references.sources, url, references.base)
  }

  for (const [url, from] of images) {
    if (links.has(url)) continue
    const response = await page.request.get(url, { maxRedirects: 0, failOnStatusCode: false })
    expect(response.status(), `${from} references ${url}`).toBe(200)
    await response.dispose()
  }
}
