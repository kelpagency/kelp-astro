# WordPress handoff: Pressable crawler for Starter Legacy

Paste this prompt into the `/Users/stefen/Developer/kelp-wp-theme` session.

## Prompt

Finish wiring the existing Website Checker in `includes/website-checker/` to the
Astro landing page in `/Users/stefen/Developer/kelp-astro`. We are on Netlify
**Starter Legacy**, which does not support Background Functions. Keep the
crawler, analysis, durable queue, leases, private leads, quotas, retention, and
any existing admin view on WordPress/Pressable. Netlify only serves Astro,
provides a synchronous authenticated proxy, and captures Netlify Forms leads.
Do not add Netlify background jobs or expose public crawler/worker endpoints.

Read the existing WordPress checker README, backend, crawler, analysis, and
tests, then these Astro sources:

- `netlify/functions/website-checker.mjs`
- `src/lib/website-checker/types.ts`
- `src/scripts/website-checker.ts`
- `src/scripts/website-checker-report.ts`

The two-step form collects **URL, then name and email**. Company has been
removed. Update validation, storage, public serialization, fixtures, and error
messages so missing company is accepted. Preserve legacy companies when
present. Public lead data must contain URL and optionally company; never name,
email, IP, or worker credentials. The report title falls back to the hostname.

Keep the existing bearer-authenticated plain JSON routes with no-store:

- `GET /wp-json/kelp/v1/audits`: `{ available: true, usage: { used, limit: 3 } }` when storage and worker heartbeat are healthy.
- `POST /wp-json/kelp/v1/audits`: accepts `{ url, name, email }`, validates and atomically saves a queued job plus private lead, returns HTTP 202 `{ id, status: "queued", usage: { used, limit: 3 } }`. Never crawl inside this HTTP request.
- `GET /wp-json/kelp/v1/audits/<UUID>`: `PublicAuditRecord`, matching the Astro types and seven analysis category keys.
- `POST /wp-json/kelp/v1/audits/<UUID>/share`: idempotently stores `sharedAt`. Do not send email or CRM messages.

Keep signed browser cookies, authoritative database/IP/email quotas, safe public
errors, heartbeat readiness, atomic claims, bounded concurrency, retry backoff,
expired-lease recovery, SSRF/DNS pinning, robots handling, and resource bounds.
Trust `X-Kelp-Client-IP` only after authenticating the proxy. No WordPress login
cookie or browser CORS setup is needed.

The PHP checker currently uses objective/deterministic analysis with
`ai.enabled: false`; retain honest report labels. AI search readiness checks do
not require OpenAI. Do not add an OpenAI dependency or billable AI calls unless
separately requested.

### Pressable setup to document and verify on staging

Use Pressable's platform-managed shell/WP-CLI cron, independent of visitor
traffic. The existing commands are `kelp-checker work`, `watch`, `prune`, and
`delete`. The documented dashboard schedules start at hourly. Keep the existing
bounded watcher approach if minute-level scheduling is unavailable:

```sh
# Hourly platform cron; replace /htdocs if this site's WordPress root differs.
wp --path=/htdocs kelp-checker watch --seconds=3550

# Daily retention cron.
wp --path=/htdocs kelp-checker prune --days=90
```

Confirm this bounded watcher works on the actual Pressable staging account,
including overlapping-job protection and heartbeat freshness. If the account
supports minute-level platform scheduling, document using
`wp --path=/htdocs kelp-checker work --max-jobs=1` every minute instead. Do not
substitute visitor-triggered WP-Cron or hold a web request open for the scan.

Set a matching server-only secret of at least 32 characters:

- WordPress: `KELP_WEBSITE_CHECKER_SECRET`, visible to both web PHP and WP-CLI.
- Netlify Functions: `WEBSITE_CHECKER_API_TOKEN` (same secret).
- Netlify Functions: `WEBSITE_CHECKER_API_URL=https://admin.kelp.agency/wp-json/kelp/v1/audits` (use the real host).

Keep staging/production isolated; preserve Authorization through the host/WAF
and bypass caching on these authenticated API routes. Never print secrets.

Add or update tests for missing company and public lead privacy. Run existing
unit and disposable WordPress/MySQL integration tests and the Astro renderer
compatibility test. Verify queued → crawling → analyzing → complete, report
polling, sharing, signed cookie attributes, quota enforcement, worker downtime,
and lease recovery. Netlify Forms capture is verified separately on a deploy
preview, with the audit ID/report URL attached. Update the WordPress README and
provide exact remaining deployment steps; do not deploy automatically.
