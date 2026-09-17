/**
 * Waitlist capture.
 *
 * Runs on the Edge runtime so it needs no Node type packages — the request and
 * response types below are web standards (decision D-3: zero new dependencies).
 *
 * Storage is deliberately not chosen here. The address is forwarded to
 * WAITLIST_WEBHOOK_URL, which can point at a form service, an automation, or a
 * function of your own. Nothing is retained by this endpoint.
 */

export const config = { runtime: 'edge' };

/** Deliberately permissive: the only authority on deliverability is delivery. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_EMAIL_LENGTH = 254;

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

/** Read the address from either a fetch POST or a plain form submission. */
async function readEmail(request: Request): Promise<string | null> {
  const contentType = request.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    const body = (await request.json().catch(() => null)) as { email?: unknown } | null;
    return typeof body?.email === 'string' ? body.email : null;
  }

  const form = await request.formData().catch(() => null);
  const value = form?.get('email');
  return typeof value === 'string' ? value : null;
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed.' }, 405);
  }

  const raw = await readEmail(request);
  const email = raw?.trim().toLowerCase() ?? '';

  if (!email || email.length > MAX_EMAIL_LENGTH || !EMAIL.test(email)) {
    return json({ error: 'That email address does not look right.' }, 400);
  }

  const webhook = process.env.WAITLIST_WEBHOOK_URL;
  if (!webhook) {
    // Fail loudly rather than pretending to have stored the address.
    console.error('WAITLIST_WEBHOOK_URL is not configured; waitlist signup dropped.');
    return json({ error: 'The waitlist is not accepting signups right now.' }, 503);
  }

  const delivered = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      source: 'dispatchrelay.co',
      submittedAt: new Date().toISOString(),
    }),
  }).catch(() => null);

  if (!delivered?.ok) {
    console.error('Waitlist webhook rejected the signup', delivered?.status);
    return json({ error: 'That did not go through. Try again in a moment.' }, 502);
  }

  // A plain form post (no JS) gets sent back to the page it came from.
  if (!(request.headers.get('accept') ?? '').includes('application/json')) {
    const referer = request.headers.get('referer');
    return Response.redirect(referer ? `${referer.split('#')[0]}#waitlist` : '/#waitlist', 303);
  }

  return json({ ok: true }, 200);
}
