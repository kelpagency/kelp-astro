const api = '/api/website-checker';

function initChecker() {
  const form = document.querySelector<HTMLFormElement>('[data-checker-form]');
  if (!form || form.dataset.initialized) return;
  form.dataset.initialized = 'true';
  const button = form.querySelector<HTMLButtonElement>('[data-scan-button]')!;
  const message = form.querySelector<HTMLElement>('[data-checker-message]')!;
  const usage = form.querySelector<HTMLElement>('[data-checker-usage]')!;
  const booking = form.querySelector<HTMLElement>('[data-checker-booking]')!;
  const urlStep = form.querySelector<HTMLElement>('[data-checker-url-step]')!;
  const leadStep = form.querySelector<HTMLElement>('[data-checker-lead-step]')!;
  const leadRow = leadStep.querySelector<HTMLElement>('.checker-lead-grid')!;
  const urlInput = form.querySelector<HTMLInputElement>('[name="url"]')!;
  const leadInputs = [...leadStep.querySelectorAll<HTMLInputElement>('input')];
  const back = form.querySelector<HTMLButtonElement>('[data-checker-back]')!;
  const stepLabel = form.querySelector<HTMLElement>('[data-checker-step-label]')!;
  const intro = form.querySelector<HTMLElement>('[data-checker-intro]')!;
  const selectedUrl = form.querySelector<HTMLElement>('[data-checker-selected-url]')!;
  let step = 1;
  let available = true;
  let limited = false;
  let submittedAudit: { id: string; url: string } | null = null;

  function showStep(next: number) {
    step = next;
    (step === 1 ? urlStep : leadRow).append(button);
    urlStep.hidden = step !== 1;
    leadStep.hidden = step !== 2;
    leadInputs.forEach((input) => { input.disabled = step !== 2; });
    back.hidden = step !== 2 || submittedAudit !== null;
    stepLabel.hidden = false;
    stepLabel.textContent = `Step ${step} of 2 · ${step === 1 ? 'Your website' : 'Your details'}`;
    intro.textContent = step === 1 ? 'Enter the website you’d like us to check.' : 'Add your details to start your website check.';
    selectedUrl.hidden = step !== 2;
    selectedUrl.textContent = `Website: ${urlInput.value}`;
    button.textContent = step === 1 ? 'Continue' : available ? 'Check my website' : 'Request a website review';
  }

  function websiteUrl() {
    const raw = urlInput.value.trim();
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || !url.hostname.includes('.')) {
      throw new Error('Please enter a public website URL, such as example.com.');
    }
    return url;
  }

  // Native single-page submission stays available when JavaScript is disabled.
  form.noValidate = true;
  showStep(1);
  urlInput.addEventListener('input', () => urlInput.setCustomValidity(''));
  back.addEventListener('click', () => {
    if (button.disabled || submittedAudit) return;
    showStep(1);
    urlInput.focus();
  });

  function showUsage(used: number, limit: number) {
    usage.textContent = `${used}/${limit} free checks used.`;
    limited = used >= limit;
    button.hidden = limited;
    booking.hidden = !limited;
  }

  void fetch(api, { cache: 'no-store' }).then(async (response) => {
    if (!response.ok) return;
    const data = await response.json();
    available = data.available !== false;
    if (!available) {
      showStep(step);
      message.textContent = 'Automated checks are coming soon. Send your website to Kelp for a review.';
    } else if (data.usage) showUsage(data.usage.used, data.usage.limit);
  }).catch(() => undefined);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (limited || button.disabled) return;
    if (step === 1) {
      urlInput.setCustomValidity('');
      if (!urlInput.reportValidity()) return;
      try {
        urlInput.value = websiteUrl().href;
      } catch {
        urlInput.setCustomValidity('Please enter a public website URL, such as example.com.');
        urlInput.reportValidity();
        return;
      }
      showStep(2);
      leadInputs[0].focus();
      return;
    }
    if (!form.reportValidity()) return;
    button.disabled = true;
    back.disabled = true;
    message.textContent = available ? 'Starting your website check…' : 'Sending your request…';
    const values = new FormData(form);
    try {
      const url = websiteUrl();
      values.set('url', url.href);

      if (available && !submittedAudit) {
        const response = await fetch(api, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(Object.fromEntries(['url', 'name', 'email'].map((key) => [key, values.get(key)]))),
        });
        const data = await response.json();
        if (!response.ok) {
          if (response.status === 429 && data.usage) showUsage(data.usage.used, data.usage.limit);
          throw new Error(data.error || 'The scan could not start. Please try again.');
        }
        if (!/^[a-f0-9-]{36}$/i.test(data.id || '')) throw new Error('The checker returned an invalid report ID.');
        submittedAudit = { id: data.id, url: `/website-checker/report/?id=${encodeURIComponent(data.id)}` };
        // Keep retry details consistent with the audit already created.
        [urlInput, ...leadInputs].forEach((input) => { input.readOnly = true; });
        back.hidden = true;
      }

      if (submittedAudit) {
        values.set('audit-id', submittedAudit.id);
        values.set('report-url', new URL(submittedAudit.url, window.location.origin).href);
      }
      const body = new URLSearchParams();
      values.forEach((value, key) => body.set(key, String(value)));
      const capture = await fetch('/website-checker/thanks/', {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString(),
      });
      if (!capture.ok) throw new Error('Your details could not be saved. Please try again.');
      window.location.assign(submittedAudit?.url || '/website-checker/thanks/');
    } catch (error) {
      message.textContent = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      button.disabled = false;
      back.disabled = false;
      // Retain the audit ID after a lead-capture error so retrying does not run a second scan.
    }
  });
}

document.addEventListener('astro:page-load', initChecker);
initChecker();
