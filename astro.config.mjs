import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://extreweb.es',
  integrations: [
    react(),
    // /admin es noindex: no debe estar en el sitemap (Search Console avisa)
    sitemap({ filter: (page) => !page.includes('/admin') }),
  ],
});