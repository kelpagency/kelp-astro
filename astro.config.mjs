// https://astro.build/config
import { defineConfig } from "astro/config";
import prefetch from "@astrojs/prefetch";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
	site: "https://kelpagency.netlify.app/",
	integrations: [prefetch(), sitemap()]
});
