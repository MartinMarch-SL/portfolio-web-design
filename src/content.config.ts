import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'
import { categories } from './examples/ines-arranz/lib/blog'

export const collections = {
  inesPosts: defineCollection({
    loader: glob({ base: './src/examples/ines-arranz/data/posts', pattern: '*.md' }),
    schema: z.object({
      title: z.string(),
      date: z.coerce.date(),
      category: z.enum(categories),
      excerpt: z.string(),
      cover: z.string(),
      featured: z.boolean(),
    }),
  }),
}
