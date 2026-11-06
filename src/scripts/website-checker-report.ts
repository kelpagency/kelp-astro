import { faLink, faRobot, faScrewdriverWrench, faLocationDot, faArrowPointer, faCode, faCheck, faExclamation, faXmark, faInfo, faArrowRight, faArrowUpRightFromSquare, type IconDefinition } from '@fortawesome/free-solid-svg-icons';
import type { PublicAuditRecord, CategoryResult, Check, LinkResult } from '../lib/website-checker/types';

const escape = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
function link(url: string, label = url) {
  try {
    const parsed = new URL(url);
    if (!['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password) return escape(label);
    return `<a href="${escape(parsed.href)}" target="_blank" rel="noopener noreferrer">${escape(label)}</a>`;
  } catch { return escape(label); }
}
function icon(definition: IconDefinition) {
  const [width, height, , , paths] = definition.icon;
  return `<svg viewBox="0 0 ${width} ${height}" aria-hidden="true" focusable="false" fill="currentColor">${(Array.isArray(paths) ? paths : [paths]).map((path) => `<path d="${path}" />`).join('')}</svg>`;
}
function checks(items: Check[]) {
  const symbols = { pass: faCheck, warning: faExclamation, fail: faXmark, info: faInfo };
  return `<ul class="checker-findings">${items.map((item) => `<li><span class="checker-status" data-status="${escape(item.status)}" aria-label="${escape(item.status)}">${icon(symbols[item.status])}</span><div><strong>${escape(item.label)}</strong><p>${escape(item.detail)}</p>${item.evidence?.length ? `<ul>${item.evidence.map((text) => `<li>${escape(text)}</li>`).join('')}</ul>` : ''}</div></li>`).join('')}</ul>`;
}
function scoreTone(score: number) {
  return score >= 80 ? 'good' : score >= 60 ? 'watch' : 'poor';
}
function scoreLabel(score: number) {
  return `<span class="checker-score-label" data-score-tone="${scoreTone(score)}">${score}/100</span>`;
}
function ring(score: number) {
  return `<div class="checker-ring" data-score-tone="${scoreTone(score)}" style="--score:${score}"><div><strong>${score}</strong><small>/100</small></div></div>`;
}
function category(item: CategoryResult) {
  return `<details><summary>${escape(item.label)} · ${scoreLabel(item.score)}</summary><p>${escape(item.summary)}</p><p class="checker-small">${item.source === 'ai' ? 'AI interpretation' : 'Objective / heuristic checks'}</p><h4>Evidence</h4><ul>${item.evidence.map((text) => `<li>${escape(text)}</li>`).join('')}</ul><h4>Measured checks</h4>${checks(item.checks)}</details>`;
}
function links(title: string, items: LinkResult[], tone: string) {
  function row(item: LinkResult) {
    const sources = item.sourceUrls;
    return `<article class="checker-link-row"><span class="checker-http" data-link-tone="${tone}">${item.redirects.length ? `${item.redirects[0].status} → ` : ''}${item.status ?? 'ERR'}</span><div><strong>${link(item.url)}</strong><small>${escape(item.kind)} link</small>${item.redirects.length ? `<p>${item.redirects.length} redirect hop(s) → ${link(item.finalUrl)}</p>` : ''}${item.error ? `<p>${escape(item.error)}</p>` : ''}<p class="checker-small">Found on</p><ul>${sources.slice(0, 3).map((url) => `<li>${link(url)}</li>`).join('')}</ul>${sources.length > 3 ? `<details><summary>See all ${sources.length} source pages</summary><ul>${sources.slice(3).map((url) => `<li>${link(url)}</li>`).join('')}</ul></details>` : ''}</div></article>`;
  }
  return `<section class="checker-link-section"><h3>${escape(title)} <span>${items.length}</span></h3>${items.length ? items.slice(0, 8).map(row).join('') + (items.length > 8 ? `<details><summary>See all ${items.length} links</summary>${items.slice(8).map(row).join('')}</details>` : '') : `<p class="checker-empty">${icon(faCheck)} Nothing in this group needs attention from the URLs checked.</p>`}</section>`;
}
function panel(id: string, title: string, intro: string, score: number, summary: string, items: Check[], facts: string[]) {
  return section(id, `<div class="checker-panel-heading"><div><p class="checker-eyebrow">${escape(title)}</p><h2>${escape(intro)}</h2><p>${escape(summary)}</p></div>${ring(score)}</div><div class="checker-panel-body"><div><h3>What we checked</h3>${checks(items)}</div><aside><h3>At a glance</h3>${facts.map((fact) => `<p>${escape(fact)}</p>`).join('')}</aside></div>`);
}
function section(id: string, content: string) {
  return `<section id="checker-panel-${id}" class="checker-tab-panel" role="tabpanel" aria-labelledby="checker-tab-${id}" tabindex="0" ${id === 'findings' ? '' : 'hidden'}>${content}</section>`;
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
  const jsonLd = pages.filter((page) => page.schemaTypes.length).length;
  const schemaTypes = [...new Set(pages.flatMap((page) => page.schemaTypes))];
  const conversion = Math.min(100, (ctas ? 25 : 0) + (forms || contacts ? 25 : 0) + (service.score >= 66 ? 20 : service.score >= 33 ? 10 : 0) + (trust ? 15 : 0) + (contacts ? 15 : 0));
  const health = Math.max(0, Math.round(100 - (broken.length / Math.max(crawl.links.length, 1)) * 100 - (review.length / Math.max(crawl.links.length, 1)) * 50 - (redirected.length / Math.max(crawl.links.length, 1)) * 20));
  const titles = pages.filter((page) => page.title).length;
  const h1s = pages.filter((page) => page.h1.length === 1).length;
  const conversionSummary = conversion >= 80 ? 'The next step is easy to spot.' : conversion >= 60 ? 'The path is there, but it could be clearer.' : 'Visitors may struggle to know what to do next.';
  const cards = [
    { id: 'links', title: 'Link health', icon: faLink, score: health, summary: broken.length ? `${broken.length} confirmed 404s.` : 'No broken links found.', detail: `${redirected.length} redirects · ${review.length} need review` },
    { id: 'ai', title: 'AI Search', icon: faRobot, score: aiScore, summary: aiScore >= 80 ? 'The business is mostly easy to understand.' : aiScore >= 60 ? 'The basics are there, with some gaps.' : 'Important business details are hard to pin down.', detail: `${find('businessClarity').score} business clarity · ${service.score} service clarity` },
    { id: 'technical', title: 'Technical SEO', icon: faScrewdriverWrench, score: technical.score, summary: technical.summary, detail: `${titles}/${pages.length} titles · ${h1s}/${pages.length} pages with one H1` },
    { id: 'local', title: 'Local SEO', icon: faLocationDot, score: local.score, summary: local.summary, detail: `${contacts} pages with contact details` },
    { id: 'conversion', title: 'Conversion', icon: faArrowPointer, score: conversion, summary: conversionSummary, detail: `${ctas} pages with a clear CTA · ${forms} with a form` },
    { id: 'schema', title: 'Schema', icon: faCode, score: schema.score, summary: schema.summary, detail: `${jsonLd}/${pages.length} pages include JSON-LD` },
  ];
  const overall = Math.round(cards.reduce((sum, card) => sum + card.score, 0) / cards.length);
  const conversionChecks: Check[] = [
    { id: 'cta', label: 'Clear calls to action', status: ctas ? 'pass' : 'fail', detail: `${ctas} pages contain a booking, contact, quote, call, or purchase link.` },
    { id: 'contact', label: 'Forms or direct contact', status: forms || contacts ? 'pass' : 'fail', detail: `${forms} pages contain forms; ${contacts} contain phone or email details.` },
    { id: 'services', label: 'Service explanation', status: service.score >= 66 ? 'pass' : service.score >= 33 ? 'warning' : 'fail', detail: service.summary },
    { id: 'trust', label: 'Trust signals', status: trust ? 'pass' : 'warning', detail: `${trust} pages contain testimonials, reviews, credentials, guarantees, or other trust language.` },
  ];
  const tabs = [['findings', 'Findings'], ['ai', 'AI Search'], ['links', `Link health (${broken.length})`], ['technical', 'Technical SEO'], ['local', 'Local SEO'], ['conversion', 'Conversion'], ['schema', 'Schema'], ['pages', 'Crawl details']];
  return `<div class="checker-report-header"><div><p class="checker-eyebrow">Website audit / ${escape(audit.id.slice(0, 8))}</p><h1>${escape(audit.lead.company || new URL(crawl.finalRootUrl).hostname)}</h1><p>${link(crawl.finalRootUrl)}</p></div><div class="checker-overview">${ring(overall)}<div><p class="checker-eyebrow">Overall readiness</p><strong>${overall >= 80 ? 'Strong foundation' : overall >= 60 ? 'Clear opportunities' : 'Needs attention'}</strong><p>A blended view of all six website checks.</p><details class="checker-score-help"><summary>How is this calculated?</summary><p>The overall score is the average of Link Health, AI Search, Technical SEO, Local SEO, Conversion, and Schema. Green: 80–100; amber: 60–79; red: below 60.</p></details></div></div></div>
    <div class="checker-report-actions"><a class="button checker-save" href="/website-checker/">Check another site <span data-report-usage></span></a><button class="button button--green" data-share-report>Share with Kelp + schedule a meeting ${icon(faArrowUpRightFromSquare)}</button><button class="button checker-save" data-save-report>Save report as PDF</button></div>
    <div class="checker-stats">${[[analysis.summary.pagesCrawled, 'Pages crawled'], [analysis.summary.linksChecked, 'Unique links checked'], [broken.length, 'Confirmed 404s'], [redirected.length, 'Redirected links'], [review.length, 'Need review'], [jsonLd, 'Pages with JSON-LD']].map(([value, label]) => `<div><strong>${value}</strong>${label}</div>`).join('')}</div>
    <nav class="checker-tabs" role="tablist" aria-label="Audit report sections">${tabs.map(([id, label]) => `<button type="button" role="tab" id="checker-tab-${id}" aria-controls="checker-panel-${id}" aria-selected="${id === 'findings'}" tabindex="${id === 'findings' ? 0 : -1}" data-report-tab="${id}">${escape(label)}</button>`).join('')}</nav>
    ${section('findings', `<div class="checker-findings-heading"><div><p class="checker-eyebrow">The full website read</p><h2>Our findings.</h2></div><p>Start with the big picture, then open any checker for the evidence behind its score.</p></div><div class="checker-report-grid">${cards.map((card) => `<button type="button" class="checker-finding-card" data-open-report="${card.id}" data-score-tone="${scoreTone(card.score)}"><span class="checker-finding-icon" aria-hidden="true">${icon(card.icon)}</span><span class="checker-finding-label">${card.title}</span><strong class="checker-score">${card.score}<small>/100</small></strong><strong>${escape(card.summary)}</strong><p>${escape(card.detail)}</p><span class="checker-finding-link">See the full check ${icon(faArrowRight)}</span></button>`).join('')}</div><h3>Where to focus first</h3>${analysis.recommendations.length ? `<ol>${analysis.recommendations.map((item) => `<li><strong>${escape(item.title)}</strong><small>${escape(item.priority)} priority · ${escape(item.source)}</small><p>${escape(item.detail)}</p></li>`).join('')}</ol>` : '<p>No additional recommendations from the pages checked.</p>'}`)}
    ${section('ai', `<p class="checker-eyebrow">Checker 02 / AI Search</p><h2>What machines can confidently understand.</h2><p>Scores surface gaps. Open each category to see the evidence behind it.</p><p class="checker-small">${escape(analysis.ai.note)}</p>${analysis.categories.map(category).join('')}`)}
    ${section('links', `<p class="checker-eyebrow">Checker 01 / Link Health</p><h2>Dead ends & detours.</h2><p>A link is labeled broken only when its destination returns HTTP 404. Redirects and responses needing manual review are shown separately.</p><div class="checker-link-stats">${[[broken.length, 'Broken links', 'Confirmed not-found destinations.'], [redirected.length, 'Redirected links', 'Destinations reached through one or more 3xx hops.'], [review.length, 'Needs review', 'Non-404 errors, timeouts, or blocked requests.']].map(([count, label, detail]) => `<article><h3>${label}</h3><strong>${count}</strong><p>${detail}</p></article>`).join('')}</div>${links('Confirmed 404s', broken, 'broken')}${links('Redirected links', redirected, 'redirect')}${links('Needs manual review', review, 'review')}`)}
    ${panel('technical', 'Checker 03 / Technical SEO', 'Can search engines read the site cleanly?', technical.score, technical.summary, [...technical.checks, ...[
      ['Page titles', titles], ['Meta descriptions', pages.filter((page) => page.description).length], ['One clear H1', h1s],
    ].map(([label, count]) => ({ id: String(label), label: String(label), status: (count === pages.length ? 'pass' : Number(count) / Math.max(pages.length, 1) >= .66 ? 'warning' : 'fail') as Check['status'], detail: `${count} of ${pages.length} crawled pages.` }))], [`${pages.length} pages reviewed`, `${broken.filter((item) => item.kind === 'internal').length} internal 404s`, `${redirected.filter((item) => item.kind === 'internal').length} internal redirects`])}
    ${panel('local', 'Checker 04 / Local SEO', 'Is it clear where you work?', local.score, local.summary, [...local.checks,
      { id: 'contact', label: 'Phone or email', status: contacts ? 'pass' : 'fail', detail: `${contacts} pages include phone or email details.` },
      { id: 'business-schema', label: 'Local business details', status: schemaTypes.some((type) => /LocalBusiness|Organization/i.test(type)) ? 'pass' : 'warning', detail: schemaTypes.some((type) => /LocalBusiness|Organization/i.test(type)) ? 'Organization or LocalBusiness schema was found.' : 'No Organization or LocalBusiness schema was found.' },
    ], [`${pages.filter((page) => page.signals.hasLocationLanguage).length} pages mention a location or service area`, `${pages.filter((page) => page.signals.hasAddress).length} pages include an address`, `${contacts} pages include contact details`])}
    ${panel('conversion', 'Checker 05 / Conversion', 'Does the site make the next step obvious?', conversion, conversionSummary, conversionChecks, [`${ctas} pages with a clear CTA`, `${forms} pages with a form`, `${trust} pages with trust signals`])}
    ${panel('schema', 'Checker 06 / Schema', 'Are the important facts machine-readable?', schema.score, schema.summary, schema.checks, [`${jsonLd} pages include JSON-LD`, schemaTypes.length ? `Types found: ${schemaTypes.join(', ')}` : 'No schema types found', `${pages.filter((page) => page.schemaTypes.includes('Invalid JSON-LD')).length} pages contain invalid JSON-LD`])}
    ${section('pages', `<p class="checker-eyebrow">Shared crawl record</p><h2>One crawl, six useful checks.</h2><p>These are the pages and crawl signals behind your report.</p><div class="checker-link-stats"><article><h3>robots.txt</h3><strong>${crawl.robots.found ? 'Found' : 'Not found'}</strong><p>OAI-SearchBot: ${crawl.robots.oaiSearchBotAllowed ? 'allowed' : 'blocked'}<br>Googlebot: ${crawl.robots.googlebotAllowed ? 'allowed' : 'blocked'}</p></article><article><h3>sitemap.xml</h3><strong>${crawl.sitemap.found ? 'Found' : 'Not found'}</strong><p>${crawl.sitemap.urlsFound} URLs discovered</p></article><article><h3>Crawl limit</h3><strong>${crawl.limitReached ? 'Reached' : 'Not reached'}</strong><p>Maximum 50 pages per check</p></article></div><div class="checker-table-wrap"><table><thead><tr><th>Page</th><th>Status</th><th>Title / H1</th><th>Words</th><th>Schema</th></tr></thead><tbody>${crawl.pages.map((page) => `<tr><td>${link(page.url)}</td><td>${page.status}</td><td>${escape(page.title || page.h1[0] || 'Untitled')}</td><td>${page.wordCount}</td><td>${escape(page.schemaTypes.join(', ') || 'None found')}</td></tr>`).join('')}</tbody></table></div>${crawl.errors.length ? `<details><summary>${crawl.errors.length} non-fatal crawl notes</summary><ul>${crawl.errors.map((error) => `<li>${escape(error)}</li>`).join('')}</ul></details>` : ''}`)}
    <section class="checker-cta"><div><p class="checker-eyebrow">Your next step</p><h2>Let’s turn the findings<br /><em>into a plan.</em></h2><p>Share your report with Kelp and grab a time that works. We’ll help you decide what to tackle first.</p></div><div><button class="button button--green" data-share-report>Share with Kelp + schedule a meeting ${icon(faArrowUpRightFromSquare)}</button><p class="checker-small">Bring your findings. We’ll help you prioritize the next steps.</p></div></section><p data-share-message role="status"></p>
    <p class="checker-small">Think of these scores as a useful starting point based on the public pages we reached. Objective checks and AI interpretation are labeled separately. ${escape(analysis.ai.note)}</p>`;
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
      if (!(response.headers.get('content-type') || '').includes('application/json')) {
        throw new Error(['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)
          ? 'The local checker API is not running. Start npx netlify dev and open the URL it prints (usually port 8888).'
          : 'The checker API returned an unexpected response. Please try again shortly.');
      }
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
      const progressNumber = root.querySelector<HTMLElement>('[data-progress-number]');
      if (progressNumber) progressNumber.textContent = `${Math.round(progress.value)}%`;
      const stages = ['queued', 'crawling', 'analyzing', 'complete'];
      root.querySelectorAll<HTMLElement>('[data-stage]').forEach((stage) => {
        const index = stages.indexOf(stage.dataset.stage!);
        const current = stages.indexOf(audit.status);
        stage.dataset.state = index < current ? 'done' : index === current ? 'active' : 'waiting';
        if (index === current) stage.setAttribute('aria-current', 'step');
        else stage.removeAttribute('aria-current');
      });
      if (audit.status === 'failed') { message.textContent = audit.error || 'The scan stopped before it finished. Please try another website.'; progress.hidden = true; return; }
      if (audit.status === 'complete' && audit.crawl && audit.analysis) {
        results.innerHTML = renderReport(audit);
        status.hidden = true;
        const tabs = [...root.querySelectorAll<HTMLButtonElement>('[data-report-tab]')];
        function selectTab(id: string, focus = false) {
          tabs.forEach((tab) => {
            const active = tab.dataset.reportTab === id;
            tab.setAttribute('aria-selected', String(active));
            tab.tabIndex = active ? 0 : -1;
            if (active && focus) tab.focus();
          });
          root.querySelectorAll<HTMLElement>('[role="tabpanel"]').forEach((panel) => {
            panel.hidden = panel.id !== `checker-panel-${id}`;
          });
        }
        tabs.forEach((tab, index) => {
          tab.addEventListener('click', () => selectTab(tab.dataset.reportTab!));
          tab.addEventListener('keydown', (event) => {
            const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length
              : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length
              : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : -1;
            if (next < 0) return;
            event.preventDefault();
            selectTab(tabs[next].dataset.reportTab!, true);
          });
        });
        root.querySelectorAll<HTMLButtonElement>('[data-open-report]').forEach((button) => {
          button.addEventListener('click', () => {
            selectTab(button.dataset.openReport!, true);
            root.querySelector('.checker-tabs')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
          });
        });
        let closedForPrint: HTMLDetailsElement[] = [];
        const beforePrint = () => {
          closedForPrint = [...root.querySelectorAll('details')].filter((item) => !item.open);
          closedForPrint.forEach((item) => { item.open = true; });
        };
        const afterPrint = () => {
          closedForPrint.forEach((item) => { item.open = false; });
          closedForPrint = [];
        };
        window.addEventListener('beforeprint', beforePrint);
        window.addEventListener('afterprint', afterPrint);
        document.addEventListener('astro:before-swap', () => {
          window.removeEventListener('beforeprint', beforePrint);
          window.removeEventListener('afterprint', afterPrint);
        }, { once: true });
        root.querySelector<HTMLButtonElement>('[data-save-report]')!.addEventListener('click', () => window.print());
        const shareButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-share-report]')];
        shareButtons.forEach((button) => button.addEventListener('click', async () => {
          const feedback = root.querySelector<HTMLElement>('[data-share-message]')!;
          shareButtons.forEach((item) => { item.disabled = true; });
          feedback.textContent = 'Sharing your report with Kelp…';
          try {
            const response = await fetch(`/api/website-checker/${id}/share`, { method: 'POST', signal: controller.signal });
            if (!response.ok) throw new Error('Your report could not be shared. Please try again.');
            window.location.assign('https://store.kelp.agency/meetings/andrew1417');
          } catch (error) {
            feedback.textContent = error instanceof Error ? error.message : 'Could not share your report.';
            shareButtons.forEach((item) => { item.disabled = false; });
          }
        }));
        void fetch('/api/website-checker', { cache: 'no-store', signal: controller.signal })
          .then(async (response) => response.ok ? response.json() : null)
          .then((data) => {
            if (Number.isFinite(data?.usage?.used) && Number.isFinite(data?.usage?.limit)) {
              root.querySelector<HTMLElement>('[data-report-usage]')!.textContent = `· ${data.usage.used}/${data.usage.limit} used`;
            }
          }).catch(() => undefined);
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
