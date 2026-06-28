import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blogCollection = defineCollection({
    loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
    schema: z.object({
        title: z.string(),
        description: z.string(),
        category: z.string().default('General'),
        pubDate: z.date(),
        heroImage: z.string().optional(),
    }),
});

export const collections = {
    'blog': blogCollection,
};
