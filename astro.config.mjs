// https://astro.build/config
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://www.kelp.agency",
  compressHTML: true,
  integrations: [sitemap()],
  prefetch: true,
  vite: {
    optimizeDeps: {
      include: ["rough-notation"],
    },
  },
  markdown: {
    syntaxHighlight: false,
  },
  image: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "admin.kelp.agency",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.kelp.agency",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "kelp.agency",
        pathname: "/**",
      },
    ],
  },
});
