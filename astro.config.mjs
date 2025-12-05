// https://astro.build/config
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
	site: 'https://www.kelp.agency',
	compressHTML: false,
	integrations: [sitemap()],
	prefetch: true,
	image: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'admin.kelp.agency',
				pathname: '/**'
			},
			{
				protocol: 'https',
				hostname: 'www.kelp.agency',
				pathname: '/**'
			},
			{
				protocol: 'https',
				hostname: 'kelp.agency',
				pathname: '/**'
			}
		]
	}
});
