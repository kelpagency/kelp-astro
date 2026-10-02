// Keep WordPress credentials on the server and browser requests on the Astro origin.
const json = (data, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });

export default async function handler(request) {
  const incoming = new URL(request.url);
  const route = incoming.searchParams.get('route') || '';
  if (!/^(?:[a-f0-9-]{36}(?:\/share)?)?$/i.test(route)) return json({ error: 'Not found.' }, 404);
  const allowedMethod = route.endsWith('/share') ? ['POST'] : route ? ['GET'] : ['GET', 'POST'];
  if (!allowedMethod.includes(request.method)) return json({ error: 'Method not allowed.' }, 405);

  const base = process.env.WEBSITE_CHECKER_API_URL;
  if (!base) {
    return request.method === 'GET' && !route
      ? json({ available: false })
      : json({ error: 'Automated website checks are not connected yet.' }, 503);
  }
  const token = process.env.WEBSITE_CHECKER_API_TOKEN;
  if (!token) return json({ error: 'The checker connection is not configured.' }, 503);

  if (request.method === 'POST') {
    const origin = request.headers.get('origin');
    if (origin !== incoming.origin) return json({ error: 'Invalid request origin.' }, 403);
  }

  try {
    const target = new URL(`${base.replace(/\/$/, '')}${route ? `/${route}` : ''}`);
    if (target.protocol !== 'https:' && target.hostname !== 'localhost') throw new Error('HTTPS is required.');
    const headers = new Headers({ Accept: 'application/json', Authorization: `Bearer ${token}` });
    // Only the checker cookie is forwarded. Never forward WordPress login cookies.
    const cookie = request.headers.get('cookie')?.split(';').map((item) => item.trim()).find((item) => item.startsWith('kelp_website_checks='));
    if (cookie) headers.set('Cookie', cookie);
    const clientIp = request.headers.get('x-nf-client-connection-ip');
    if (clientIp) headers.set('X-Kelp-Client-IP', clientIp);
    let body;
    if (request.method === 'POST') {
      body = await request.text();
      if (body.length > 8192) return json({ error: 'Request too large.' }, 413);
      headers.set('Content-Type', 'application/json');
    }
    const upstream = await fetch(target, { method: request.method, headers, body, redirect: 'error', signal: AbortSignal.timeout(20000) });
    if (!(upstream.headers.get('content-type') || '').includes('application/json')) throw new Error('Invalid checker response.');
    const data = await upstream.json();
    if (request.method === 'POST' && !route && upstream.status === 202 && !/^[a-f0-9-]{36}$/i.test(data.id || '')) throw new Error('Invalid audit ID.');
    // The report needs company and URL, never the submitter’s email or full name.
    if (data.lead) data.lead = { company: data.lead.company, url: data.lead.url };
    const response = json(data, upstream.status);
    for (const value of upstream.headers.getSetCookie()) {
      if (value.startsWith('kelp_website_checks=')) {
        response.headers.append('Set-Cookie', value.replace(/;\s*Domain=[^;]+/gi, '').replace(/;\s*Path=[^;]+/gi, '') + '; Path=/');
      }
    }
    return response;
  } catch {
    return json({ error: 'The website checker is temporarily unavailable. Please try again shortly.' }, 502);
  }
}
