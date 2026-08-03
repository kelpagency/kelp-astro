// https://astro.build/config
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://www.kelp.agency",
  compressHTML: true,
  integrations: [sitemap()],
  prefetch: true,
  markdown: {
    syntaxHighlight: false,
  },
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "connect-src 'self' https://admin.kelp.agency https://ingesteer.services-prod.nsvcs.net https://static.hsappstatic.net",
        "font-src 'self' https:",
        "frame-src 'self' https://store.kelp.agency https://static.hsappstatic.net https://www.youtube.com https://www.youtube-nocookie.com https://codepen.io https://videopress.com https://player.vimeo.com https://vimeo.com",
        "img-src 'self' data: https:",
        "media-src 'self' data: https:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "upgrade-insecure-requests",
      ],
      scriptDirective: {
        resources: ["'self'", "data:", "https://static.hsappstatic.net"],
      },
      styleDirective: {
        resources: ["'self'", "'unsafe-inline'"],
      },
    },
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
