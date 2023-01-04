// https://astro.build/config
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import compress from 'astro-compress';
import { astroImageTools } from 'astro-imagetools';

export default defineConfig({
	site: 'https://www.kelp.agency/',
	integrations: [
		// prefetch(),
		sitemap(),
		astroImageTools,
		compress({
			css: false,
			html: true,
			js: true,
			img: false,
			svg: true
		})
	]
});
