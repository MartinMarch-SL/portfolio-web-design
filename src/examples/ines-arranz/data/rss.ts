import rss from '@astrojs/rss'
import type { APIContext } from 'astro'
import { url } from '../../../lib/url'
import { getPosts } from './posts'

export async function GET({ site }: APIContext) {
  return rss({
    title: 'Inés Arranz · Psicología',
    description: 'Ideas y preguntas para entender un poco mejor lo que sentimos.',
    site: new URL(url('ines-arranz/blog/'), site),
    customData: '<language>es</language>',
    items: (await getPosts()).map(post => ({
      title: post.data.title,
      description: post.data.excerpt,
      pubDate: post.data.date,
      link: url(`ines-arranz/blog/${post.id}/`),
      categories: [post.data.category],
    })),
  })
}
