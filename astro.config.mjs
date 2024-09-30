// https://astro.build/config
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { astroImageTools } from 'astro-imagetools';

// https://astro.build/config
export default defineConfig({
	site: 'https://www.kelp.agency',
	compressHTML: false,
	integrations: [sitemap(), astroImageTools],
	prefetch: true
});
