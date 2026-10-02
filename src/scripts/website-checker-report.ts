import type { PublicAuditRecord, CategoryResult, Check, LinkResult } from '../lib/website-checker/types';

const escape = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
function link(url: string, label = url) {
  try {
    const parsed = new URL(url);
    if (!['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password) return escape(label);
    return `<a href="${escape(parsed.href)}" target="_blank" rel="noopener noreferrer">${escape(label)}</a>`;
  } catch { return escape(label); }
}
function checks(items: Check[]) {
  return `<ul class="checker-findings">${items.map((item) => `<li><small>${escape(item.status)}</small><strong>${escape(item.label)}</strong>${escape(item.detail)}${item.evidence?.length ? `<ul>${item.evidence.map((text) => `<li>${escape(text)}</li>`).join('')}</ul>` : ''}</li>`).join('')}</ul>`;
}
function category(item: CategoryResult) {
  return `<details><summary>${escape(item.label)} · ${item.score}/100</summary><p>${escape(item.summary)}</p><p class="checker-small">${item.source === 'ai' ? 'AI interpretation' : 'Objective / heuristic checks'}</p><ul>${item.evidence.map((text) => `<li>${escape(text)}</li>`).join('')}</ul>${checks(item.checks)}</details>`;
}
function links(title: string, items: LinkResult[]) {
  return `<details><summary>${escape(title)} · ${items.length}</summary>${items.length ? `<ul class="checker-findings">${items.map((item) => `<li><strong>${link(item.url)}</strong><small>${escape(item.kind)} · HTTP ${item.status ?? 'Unavailable'}</small>${item.redirects.length ? `<p>${item.redirects.length} redirect hop(s) → ${link(item.finalUrl)}</p>` : ''}${item.error ? `<p>${escape(item.error)}</p>` : ''}<p>Found on:</p><ul>${item.sourceUrls.map((url) => `<li>${link(url)}</li>`).join('')}</ul></li>`).join('')}</ul>` : '<p>No destinations in this group were found in the links checked.</p>'}</details>`;
}

function renderReport(audit: PublicAuditRecord) {
  const analysis = audit.analysis!;
  const crawl = audit.crawl!;
  const pages = crawl.pages.filter((page) => page.status >= 200 && page.status < 400);
  const broken = crawl.links.filter((item) => item.status === 404);
  const redirected = crawl.links.filter((item) => item.redirects.length > 0);
  const review = crawl.links.filter((item) => item.status !== 404 && !item.redirects.length && (item.status === null || item.status >= 400));
  const find = (key: string) => analysis.categories.find((item) => item.key === key)!;
  const technical = find('technicalAccessibility');
  const local = find('locationClarity');
  const schema = find('structuredData');
  const service = find('serviceClarity');
  const ai = analysis.categories.filter((item) => ['businessClarity', 'serviceClarity', 'locationClarity', 'answerReadiness', 'trustAuthority'].includes(item.key));
  const aiScore = Math.round(ai.reduce((sum, item) => sum + item.score, 0) / Math.max(ai.length, 1));
  const ctas = pages.filter((page) => page.signals.hasPrimaryCta).length;
  const forms = pages.filter((page) => page.signals.hasForm).length;
  const contacts = pages.filter((page) => page.signals.emails.length || page.signals.phones.length).length;
  const trust = pages.filter((page) => page.signals.trustTerms.length).length;
  const conversion = Math.min(100, (ctas ? 25 : 0) + (forms || contacts ? 25 : 0) + (service.score >= 66 ? 20 : service.score >= 33 ? 10 : 0) + (trust ? 15 : 0) + (contacts ? 15 : 0));
  const health = Math.max(0, Math.round(100 - (broken.length / Math.max(crawl.links.length, 1)) * 100 - (review.length / Math.max(crawl.links.length, 1)) * 50 - (redirected.length / Math.max(crawl.links.length, 1)) * 20));
  const cards = [
    ['Link health', health, `${broken.length} confirmed 404s · ${redirected.length} redirects · ${review.length} need review`],
    ['AI search', aiScore, analysis.ai.enabled ? 'AI content interpretation with objective checks.' : 'Content clarity based on objective and heuristic checks.'],
    ['Technical SEO', technical.score, technical.summary], ['Local SEO', local.score, local.summary],
    ['Conversion', conversion, `${ctas} pages with calls to action · ${forms} with forms · ${trust} with trust signals`],
    ['Schema', schema.score, schema.summary],
  ];
  const overall = Math.round((health + aiScore + technical.score + local.score + conversion + schema.score) / 6);
  const conversionChecks: Check[] = [
    { id: 'cta', label: 'Clear calls to action', status: ctas ? 'pass' : 'fail', detail: `${ctas} pages contain a booking, contact, quote, call, or purchase link.` },
    { id: 'contact', label: 'Forms or direct contact', status: forms || contacts ? 'pass' : 'fail', detail: `${forms} pages contain forms; ${contacts} contain phone or email details.` },
    { id: 'services', label: 'Service explanation', status: service.score >= 66 ? 'pass' : 'warning', detail: service.summary },
    { id: 'trust', label: 'Trust signals', status: trust ? 'pass' : 'warning', detail: `${trust} pages contain proof or trust language.` },
  ];
  return `<div class="checker-report-header"><div><p class="checker-eyebrow">Your website / The findings</p><h1>${escape(audit.lead.company || new URL(crawl.finalRootUrl).hostname)}</h1><p>${link(crawl.finalRootUrl)}</p><button class="checker-save" data-save-report>Save report as PDF</button></div><div class="checker-overall"><strong class="checker-score">${overall}<small>/100</small></strong><p>Overall readiness</p></div></div>
    <div class="checker-stats">${[[analysis.summary.pagesCrawled, 'Pages crawled'], [analysis.summary.linksChecked, 'Links checked'], [broken.length, 'Confirmed 404s'], [redirected.length, 'Redirects'], [review.length, 'Need review']].map(([value, label]) => `<div><strong>${value}</strong>${label}</div>`).join('')}</div>
    <h2>Our findings.</h2><div class="checker-report-grid">${cards.map(([title, score, detail]) => `<article><h3 class="h5">${title}</h3><strong class="checker-score">${score}</strong><p>${escape(detail)}</p></article>`).join('')}</div>
    <h2 class="h4">Where to focus first</h2>${analysis.recommendations.length ? `<ol>${analysis.recommendations.map((item) => `<li><strong>${escape(item.title)}</strong> <small>(${escape(item.priority)} priority · ${escape(item.source)})</small><p>${escape(item.detail)}</p></li>`).join('')}</ol>` : '<p>No additional recommendations from the pages checked.</p>'}
    <section class="checker-cta"><div><p class="checker-eyebrow">Your next step</p><h2>Let’s turn the findings<br /><em>into a plan.</em></h2><p>We’ll walk through your report together and help you decide what to tackle first.</p></div><div><button class="button button--green" data-share-report>Schedule a meeting with Kelp</button><p class="checker-small">Bring your findings. We’ll help you prioritize the next steps.</p><p data-share-message role="status"></p></div></section>
    <h2 class="h4">The evidence behind the checks</h2>
    ${links('Confirmed 404s', broken)}${links('Redirected links', redirected)}${links('Links needing manual review', review)}
    <details><summary>AI search · ${aiScore}/100</summary><p>${escape(analysis.ai.note)}</p>${ai.map(category).join('')}</details>
    ${category({ ...technical, checks: [...technical.checks, ...[
      ['Page titles', pages.filter((page) => page.title).length], ['Meta descriptions', pages.filter((page) => page.description).length], ['One clear H1', pages.filter((page) => page.h1.length === 1).length],
    ].map(([label, count]) => ({ id: String(label), label: String(label), status: (count === pages.length ? 'pass' : 'warning') as Check['status'], detail: `${count} of ${pages.length} pages.` }))] })}
    ${category(local)}<details><summary>Conversion · ${conversion}/100</summary>${checks(conversionChecks)}</details>${category(schema)}
    <details><summary>Crawl details · ${crawl.pages.length} pages</summary><p>robots.txt: ${crawl.robots.found ? 'found' : 'not found'} · sitemap: ${crawl.sitemap.found ? 'found' : 'not found'} · 50-page limit: ${crawl.limitReached ? 'reached' : 'not reached'}</p><div class="checker-table-wrap"><table><thead><tr><th>Page</th><th>Status</th><th>Title</th><th>Words</th><th>Schema</th></tr></thead><tbody>${crawl.pages.map((page) => `<tr><td>${link(page.url)}</td><td>${page.status}</td><td>${escape(page.title)}</td><td>${page.wordCount}</td><td>${escape(page.schemaTypes.join(', ') || 'None found')}</td></tr>`).join('')}</tbody></table></div>${crawl.errors.length ? `<ul>${crawl.errors.map((error) => `<li>${escape(error)}</li>`).join('')}</ul>` : ''}</details>
    <p class="checker-small">Scores are a starting point based on the public pages we reached. Objective checks and AI interpretation are labeled separately. ${escape(analysis.ai.note)}</p>`;
}

function initReport() {
  const element = document.querySelector<HTMLElement>('[data-checker-report]');
  if (!element || element.dataset.initialized) return;
  const root: HTMLElement = element;
  root.dataset.initialized = 'true';
  const status = root.querySelector<HTMLElement>('[data-report-status]')!;
  const message = root.querySelector<HTMLElement>('[data-report-message]')!;
  const progress = root.querySelector<HTMLProgressElement>('[data-report-progress]')!;
  const results = root.querySelector<HTMLElement>('[data-report-results]')!;
  const id = new URLSearchParams(window.location.search).get('id');
  if (!id || !/^[a-f0-9-]{36}$/i.test(id)) {
    message.textContent = 'This report link is invalid. Start a new check below.';
    progress.hidden = true;
    return;
  }
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout>;
  let errors = 0;
  const started = Date.now();
  document.addEventListener('astro:before-swap', () => { controller.abort(); clearTimeout(timer); }, { once: true });

  async function poll() {
    try {
      const response = await fetch(`/api/website-checker/${id}`, { cache: 'no-store', signal: controller.signal });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 404) { message.textContent = 'This report could not be found. Start a new check below.'; progress.hidden = true; return; }
        throw new Error(data.error || 'Could not load this report.');
      }
      const audit = data as PublicAuditRecord;
      if (audit.id !== id || !['queued', 'crawling', 'analyzing', 'complete', 'failed'].includes(audit.status)
        || typeof audit.progress !== 'number' || !Number.isFinite(audit.progress)) {
        throw new Error('The checker returned an invalid report response. Please reload this page shortly.');
      }
      message.textContent = audit.progressMessage;
      progress.value = Math.max(0, Math.min(100, audit.progress));
      if (audit.status === 'failed') { message.textContent = audit.error || 'The scan stopped before it finished. Please try another website.'; progress.hidden = true; return; }
      if (audit.status === 'complete' && audit.crawl && audit.analysis) {
        results.innerHTML = renderReport(audit);
        status.hidden = true;
        root.querySelector<HTMLButtonElement>('[data-save-report]')!.addEventListener('click', () => {
          const closed = [...root.querySelectorAll('details')].filter((item) => !item.open);
          closed.forEach((item) => { item.open = true; });
          window.addEventListener('afterprint', () => closed.forEach((item) => { item.open = false; }), { once: true });
          window.print();
        });
        root.querySelector<HTMLButtonElement>('[data-share-report]')!.addEventListener('click', async (event) => {
          const button = event.currentTarget as HTMLButtonElement;
          const feedback = root.querySelector<HTMLElement>('[data-share-message]')!;
          button.disabled = true;
          try {
            const response = await fetch(`/api/website-checker/${id}/share`, { method: 'POST', signal: controller.signal });
            if (!response.ok) throw new Error('Your report could not be shared. Please try again.');
            window.location.assign('https://store.kelp.agency/meetings/andrew1417');
          } catch (error) { feedback.textContent = error instanceof Error ? error.message : 'Could not share your report.'; button.disabled = false; }
        });
        return;
      }
      errors = 0;
    } catch (error) {
      if (controller.signal.aborted) return;
      errors += 1;
      message.textContent = error instanceof Error ? error.message : 'Reconnecting to your report…';
      if (errors >= 3) { message.textContent += ' Reload this page to try again.'; progress.hidden = true; return; }
    }
    if (Date.now() - started > 20 * 60 * 1000) { message.textContent = 'This scan is taking longer than expected. Return to this report link later.'; return; }
    timer = setTimeout(poll, 2500);
  }
  void poll();
}
document.addEventListener('astro:page-load', initReport);
initReport();
