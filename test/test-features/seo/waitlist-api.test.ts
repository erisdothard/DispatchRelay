/**
 * Waitlist endpoint. The behaviour that matters is what it refuses: bad
 * addresses, wrong methods, and — importantly — reporting success when there
 * is nowhere to store the address.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import handler from '../../../apps/web/api/waitlist';

const WEBHOOK = 'https://example.test/hook';

function post(body: unknown, headers: Record<string, string> = {}) {
  return new Request('https://dispatchrelay.co/api/waitlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

describe('POST /api/waitlist', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env.WAITLIST_WEBHOOK_URL = WEBHOOK;
    globalThis.fetch = vi.fn(async () => new Response('{}', { status: 200 })) as never;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    delete process.env.WAITLIST_WEBHOOK_URL;
    vi.restoreAllMocks();
  });

  it('accepts a valid address and forwards it once', async () => {
    const res = await handler(post({ email: 'Driver@Example.com' }));
    expect(res.status).toBe(200);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);

    const [url, init] = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe(WEBHOOK);
    expect(JSON.parse(init.body).email).toBe('driver@example.com');
  });

  it.each([
    ['empty', ''],
    ['no at sign', 'nope'],
    ['no domain dot', 'a@b'],
    ['spaces', 'a b@c.com'],
    ['too long', `${'a'.repeat(250)}@example.com`],
  ])('rejects %s without calling the webhook', async (_label, email) => {
    const res = await handler(post({ email }));
    expect(res.status).toBe(400);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('rejects a non-POST request', async () => {
    const res = await handler(new Request('https://dispatchrelay.co/api/waitlist'));
    expect(res.status).toBe(405);
  });

  it('refuses rather than pretending when no webhook is configured', async () => {
    delete process.env.WAITLIST_WEBHOOK_URL;
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = await handler(post({ email: 'a@b.com' }));
    expect(res.status).toBe(503);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('surfaces a webhook failure instead of swallowing it', async () => {
    globalThis.fetch = vi.fn(async () => new Response('no', { status: 500 })) as never;
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = await handler(post({ email: 'a@b.com' }));
    expect(res.status).toBe(502);
    expect((await res.json()).error).toMatch(/did not go through/);
  });

  it('survives the webhook being unreachable', async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new Error('network down');
    }) as never;
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = await handler(post({ email: 'a@b.com' }));
    expect(res.status).toBe(502);
  });

  it('accepts a plain form post and redirects back to the form', async () => {
    const body = new URLSearchParams({ email: 'a@b.com' });
    const res = await handler(
      new Request('https://dispatchrelay.co/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'text/html',
          Referer: 'https://dispatchrelay.co/for/carriers#waitlist',
        },
        body,
      }),
    );
    expect(res.status).toBe(303);
    expect(res.headers.get('location')).toBe('https://dispatchrelay.co/for/carriers#waitlist');
  });
});
