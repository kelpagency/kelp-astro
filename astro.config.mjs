// https://astro.build/config
import { defineConfig } from "astro/config";
// import prefetch from "@astrojs/prefetch";
import sitemap from "@astrojs/sitemap";
import compress from "astro-compress";
import { astroImageTools } from "astro-imagetools";

// https://astro.build/config
export default defineConfig({
	site: "https://www.kelp.agency/",
	integrations: [
		// prefetch(),
		sitemap(),
		astroImageTools,
		compress({
			css: true,
			html: false,
			js: true,
			img: false,
			svg: false
		})
	]
});
