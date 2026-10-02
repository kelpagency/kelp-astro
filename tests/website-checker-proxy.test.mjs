import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import handler from '../netlify/functions/website-checker.mjs';

const originalFetch = globalThis.fetch;
const originalUrl = process.env.WEBSITE_CHECKER_API_URL;
const originalToken = process.env.WEBSITE_CHECKER_API_TOKEN;
afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalUrl === undefined) delete process.env.WEBSITE_CHECKER_API_URL;
  else process.env.WEBSITE_CHECKER_API_URL = originalUrl;
  if (originalToken === undefined) delete process.env.WEBSITE_CHECKER_API_TOKEN;
  else process.env.WEBSITE_CHECKER_API_TOKEN = originalToken;
});
const configure = () => {
  process.env.WEBSITE_CHECKER_API_URL = 'https://admin.example.com/wp-json/kelp/v1/audits';
  process.env.WEBSITE_CHECKER_API_TOKEN = 'test-only-secret';
};

test('unconfigured checker explicitly offers manual lead capture', async () => {
  delete process.env.WEBSITE_CHECKER_API_URL;
  const response = await handler(new Request('https://kelp.example/api/website-checker'));
  assert.deepEqual(await response.json(), { available: false });
});
test('invalid report routes never reach WordPress', async () => {
  configure();
  globalThis.fetch = () => assert.fail('must not fetch');
  const response = await handler(new Request('https://kelp.example/api/website-checker?route=../../users'));
  assert.equal(response.status, 404);
});
test('cross-origin submissions are rejected', async () => {
  configure();
  globalThis.fetch = () => assert.fail('must not fetch');
  const response = await handler(new Request('https://kelp.example/api/website-checker', { method: 'POST', headers: { origin: 'https://other.example' }, body: '{}' }));
  assert.equal(response.status, 403);
});
test('authenticated proxy strips personal lead fields and isolates checker cookies', async () => {
  configure();
  const id = '550e8400-e29b-41d4-a716-446655440000';
  globalThis.fetch = async (url, options) => {
    assert.equal(String(url), `${process.env.WEBSITE_CHECKER_API_URL}/${id}`);
    assert.equal(options.headers.get('Authorization'), 'Bearer test-only-secret');
    assert.equal(options.headers.get('Cookie'), 'kelp_website_checks=signed-test');
    return Response.json({ id, lead: { company: 'Example', url: 'https://example.com', name: 'Private Name', email: 'private@example.com' } }, {
      headers: { 'Set-Cookie': 'kelp_website_checks=updated; Domain=admin.example.com; Path=/wp-json; HttpOnly; Secure; SameSite=Lax' },
    });
  };
  const response = await handler(new Request(`https://kelp.example/api/website-checker?route=${id}`, { headers: { cookie: 'wordpress_logged_in=private; kelp_website_checks=signed-test' } }));
  assert.deepEqual((await response.json()).lead, { company: 'Example', url: 'https://example.com' });
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.doesNotMatch(response.headers.get('Set-Cookie'), /Domain=|Path=\/wp-json/i);
  assert.match(response.headers.get('Set-Cookie'), /Path=\//);
});
test('upstream usage-limit responses remain actionable', async () => {
  configure();
  globalThis.fetch = async () => Response.json({ error: 'Free checks used.', usage: { used: 3, limit: 3 } }, { status: 429 });
  const response = await handler(new Request('https://kelp.example/api/website-checker', { method: 'POST', headers: { origin: 'https://kelp.example' }, body: '{}' }));
  assert.equal(response.status, 429);
  assert.deepEqual((await response.json()).usage, { used: 3, limit: 3 });
});
test('upstream failures return safe messages', async () => {
  configure();
  globalThis.fetch = async () => { throw new Error('Private upstream error and credential'); };
  const response = await handler(new Request('https://kelp.example/api/website-checker'));
  assert.equal(response.status, 502);
  assert.doesNotMatch(JSON.stringify(await response.json()), /credential|Private upstream/);
});

test('report paths reach the report endpoint without rewrite query parameters', async () => {
  configure();
  const id = '550e8400-e29b-41d4-a716-446655440000';
  globalThis.fetch = async (url, options) => {
    assert.equal(String(url), `${process.env.WEBSITE_CHECKER_API_URL}/${id}`);
    assert.equal(options.method, 'GET');
    return Response.json({ id, status: 'crawling', progress: 20 });
  };
  const response = await handler(new Request(`https://kelp.example/api/website-checker/${id}?route=ignored`));
  assert.deepEqual(await response.json(), { id, status: 'crawling', progress: 20 });
});

test('share paths reach sharing instead of creating a new scan', async () => {
  configure();
  const id = '550e8400-e29b-41d4-a716-446655440000';
  globalThis.fetch = async (url, options) => {
    assert.equal(String(url), `${process.env.WEBSITE_CHECKER_API_URL}/${id}/share`);
    assert.equal(options.method, 'POST');
    return Response.json({ sharedAt: '2026-10-02T12:00:00Z' });
  };
  const response = await handler(new Request(`https://kelp.example/api/website-checker/${id}/share`, {
    method: 'POST', headers: { origin: 'https://kelp.example' },
  }));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).sharedAt, '2026-10-02T12:00:00Z');
});

test('invalid original paths are rejected before forwarding', async () => {
  configure();
  globalThis.fetch = () => assert.fail('must not fetch');
  const response = await handler(new Request('https://kelp.example/api/website-checker/not-a-report'));
  assert.equal(response.status, 404);
});
