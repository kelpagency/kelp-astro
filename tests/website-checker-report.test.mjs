import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const script = ts.transpileModule(readFileSync(new URL('../src/scripts/website-checker-report.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const id = '550e8400-e29b-41d4-a716-446655440000';

async function preview(data, response = Response.json(data)) {
  const message = { textContent: '' };
  let value = 0;
  let assignments = 0;
  const progress = {
    hidden: false,
    set value(next) {
      assert.equal(Number.isFinite(next), true, 'progress must stay finite');
      assignments++;
      value = next;
    },
  };
  const root = {
    dataset: {},
    querySelector: (selector) => ({
      '[data-report-message]': message, '[data-report-progress]': progress,
      '[data-report-status]': {}, '[data-report-results]': {},
    })[selector],
  };
  const timers = [];
  let initialize;
  vm.runInNewContext(script, {
    exports: {}, URLSearchParams, AbortController,
    window: { location: { search: `?id=${id}`, hostname: 'localhost' } },
    document: {
      querySelector: () => root,
      addEventListener: (event, handler) => { if (event === 'astro:page-load') initialize = handler; },
    },
    fetch: async () => response.clone(),
    setTimeout: (handler) => { timers.push(handler); return timers.length; },
    clearTimeout: () => {},
  });
  initialize();
  const settle = () => new Promise((resolve) => setImmediate(resolve));
  await settle();
  // Process two retries. An invalid response must stop after the third attempt.
  for (let attempt = 0; attempt < 2 && timers.length; attempt++) {
    await timers.shift()();
    await settle();
  }
  return { message, progress, timers, value, assignments };
}

test('availability responses cannot set non-finite progress or retry indefinitely', async () => {
  const result = await preview({ available: true, usage: { used: 1, limit: 3 } });
  assert.match(result.message.textContent, /invalid report response/);
  assert.equal(result.assignments, 0);
  assert.equal(result.progress.hidden, true);
  assert.equal(result.timers.length, 0);
});

test('valid report progress is clamped to the progress bar range', async () => {
  const result = await preview({ id, status: 'crawling', progress: 150, progressMessage: 'Checking links' });
  assert.equal(result.value, 100);
  assert.equal(result.message.textContent, 'Checking links');
  assert.equal(result.progress.hidden, false);
});

test('local HTML 404 responses explain how to run the checker API', async () => {
  const result = await preview(null, new Response('<html>Not found</html>', {
    status: 404, headers: { 'Content-Type': 'text/html' },
  }));
  assert.match(result.message.textContent, /npx netlify dev/);
  assert.equal(result.assignments, 0);
  assert.equal(result.progress.hidden, true);
  assert.equal(result.timers.length, 0);
});
