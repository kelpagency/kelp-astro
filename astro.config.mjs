// https://astro.build/config
import { defineConfig } from "astro/config";
import prefetch from "@astrojs/prefetch";
import sitemap from "@astrojs/sitemap";
import compress from "astro-compress";

// https://astro.build/config
export default defineConfig({
  site: "https://kelpagency.netlify.app/",
  integrations: [prefetch(), sitemap(), compress()]
});