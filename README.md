# Kelp's Website

Built with [Astro](https://docs.astro.build).

## Website checker

`/website-checker/` is a standalone Astro landing page based on the prototype,
linked from Resources. The form asks for the URL first, then name and email.
Reports live at `/website-checker/report/?id=<UUID>`.

The synchronous Netlify function securely proxies requests to WordPress on
Pressable. WordPress stores leads and reports and runs the crawler through its
scheduled WP-CLI worker. This supports our **Starter Legacy** Netlify plan,
which does not support Background Functions. No crawler runs inside a Netlify
request, and the page itself is served by Astro.

The existing WordPress implementation needs company validation removed and its
Pressable worker scheduled before scans can run. A ready-to-paste prompt and
configuration are in [the WordPress handoff](docs/website-checker-wordpress.md).

Configure these Netlify **Functions-scope** environment variables:

- `WEBSITE_CHECKER_API_URL=https://admin.kelp.agency/wp-json/kelp/v1/audits`
- `WEBSITE_CHECKER_API_TOKEN=<same WordPress shared secret, at least 32 characters>`

The WordPress crawler handles bounded public-page scans, DNS/redirect safety,
robots rules, progress, leases, quotas, and retention. Its current analysis is
objective and deterministic; OpenAI interpretation is not enabled. The landing
page describes AI search readiness as a website check, rather than claiming
that scans use generative AI.

Enable Netlify form detection and deploy to register the static `website-checker`
form. It captures URL, name, email, audit ID, and report URL with a honeypot.
Starter Legacy form and synchronous function allowances still apply; check
Usage & billing for the account's current usage. Without the API URL the page
offers a manual review request. HubSpot is not connected. Plain `astro dev`
previews the page but does not run Netlify Functions or process Netlify Forms.
Use `npx netlify dev` for functions, then open the Netlify proxy URL on port
8888 (not Astro's port 4321).
Add `WEBSITE_CHECKER_API_URL` and `WEBSITE_CHECKER_API_TOKEN` to the root `.env`
file, and restart Netlify Dev after changing them. The token must match
Pressable's `KELP_WEBSITE_CHECKER_SECRET`. Use a Deploy Preview to verify form
capture.

Run `npm run test:checker` for authenticated proxy, privacy, cookie, and quota
response tests; run `npm run build` for Astro validation. Crawler tests live in
the WordPress repo. The prototype folder remains a reference and is excluded
from Astro type checking.

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```
/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   └── Card.astro
│   ├── layouts/
│   │   └── Layout.astro
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                | Action                                             |
| :--------------------- | :------------------------------------------------- |
| `npm install`          | Installs dependencies                              |
| `npm run dev`          | Starts local dev server at `localhost:3000`        |
| `npm run build`        | Build your production site to `./dist/`            |
| `npm run preview`      | Preview your build locally, before deploying       |
| `npm run astro ...`    | Run CLI commands like `astro add`, `astro preview` |
| `npm run astro --help` | Get help using the Astro CLI                       |
