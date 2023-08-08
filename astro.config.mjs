// https://astro.build/config
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { astroImageTools } from 'astro-imagetools';
import prefetch from '@astrojs/prefetch';
import crittersSlim from 'astro-critters-slim';

// https://astro.build/config
export default defineConfig({
	site: 'https://www.kelp.agency/',
	compressHTML: false,
	integrations: [sitemap(), astroImageTools, prefetch(), crittersSlim()]
});
