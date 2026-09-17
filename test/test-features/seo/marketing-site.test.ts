/**
 * Phase 1 — static marketing site.
 *
 * These cover the failures that are expensive in production: a page that
 * de-indexes itself, a page that leaks unescaped content, and a validator that
 * quietly stops catching anything.
 */
import { describe, it, expect } from 'vitest';

import { pages } from '../../../scripts/seo/content/pages.mjs';
import { site } from '../../../scripts/seo/content/site.mjs';
import { renderPage } from '../../../scripts/seo/templates/layout.mjs';
import { renderSections } from '../../../scripts/seo/templates/sections.mjs';
import { validate } from '../../../scripts/seo/lib/validate.mjs';
import { esc, prose } from '../../../scripts/seo/lib/html.mjs';

const rendered = pages.map((page) => ({ page, html: renderPage(page) }));

describe('content records', () => {
  it('ships the pages the sitemap and nav assume exist', () => {
    const paths = pages.map((p) => p.path);
    expect(paths).toContain('/');
    expect(paths).toContain('/pricing');
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('passes its own validators', () => {
    expect(validate(rendered)).toEqual([]);
  });
});

describe('rendered pages', () => {
  it.each(rendered)('$page.path has exactly one h1', ({ html }) => {
    expect(html.match(/<h1[\s>]/g) ?? []).toHaveLength(1);
  });

  it.each(rendered)('$page.path canonicalises to itself', ({ page, html }) => {
    const expected = page.path === '/' ? `${site.url}/` : `${site.url}${page.path}`;
    expect(html).toContain(`<link rel="canonical" href="${expected}" />`);
  });

  it.each(rendered)('$page.path carries parseable JSON-LD', ({ html }) => {
    const block = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    expect(block).not.toBeNull();
    const parsed = JSON.parse(block![1]);
    expect(parsed['@context']).toBe('https://schema.org');
    expect(Array.isArray(parsed['@graph'])).toBe(true);
  });

  it('serves real content without executing JavaScript', () => {
    const home = rendered.find((r) => r.page.path === '/')!.html;
    // No bundle, no framework, no loading state — just the document.
    expect(home).not.toContain('<div id="root">');
    expect(home).not.toMatch(/<script[^>]+src=/);
    expect(home).toContain('Run dispatch without ten open tabs');
  });

  it('keeps the waitlist form usable without the island script', () => {
    const home = rendered.find((r) => r.page.path === '/')!.html;
    expect(home).toContain('method="post"');
    expect(home).toContain('action="/api/waitlist"');
    expect(home).toContain('name="email"');
  });
});

describe('escaping', () => {
  it('escapes authored content rather than trusting it', () => {
    expect(esc('<script>alert(1)</script>')).not.toContain('<script>');
    expect(prose('**bold** and <img onerror=x>')).toBe(
      '<strong>bold</strong> and &lt;img onerror=x&gt;',
    );
  });

  it('escapes content that reaches a section renderer', () => {
    const html = renderSections([
      { type: 'prose', heading: '<script>x</script>', body: ['<b>hi</b>'] },
    ]);
    expect(html).not.toContain('<script>x</script>');
    expect(html).not.toContain('<b>hi</b>');
  });

  it('refuses an unknown section type instead of emitting nothing', () => {
    expect(() => renderSections([{ type: 'nope' }])).toThrow(/Unknown section type/);
  });
});

describe('validators actually catch things', () => {
  const page = (overrides: Record<string, unknown> = {}) => ({
    path: '/x',
    title: 'A title',
    description: 'A description that is comfortably long enough to pass the minimum length rule.',
    sections: [],
    ...overrides,
  });
  const html = (body: string) =>
    `<link rel="canonical" href="${site.url}/x" /><script type="application/ld+json">{}</script><h1>h</h1>${body}`;
  const filler = ' word'.repeat(200);

  it('rejects a canonical pointing somewhere else', () => {
    const problems = validate([
      { page: page(), html: `<link rel="canonical" href="${site.url}/" /><h1>h</h1>${filler}` },
    ]);
    expect(problems.join(' ')).toMatch(/canonical/);
  });

  it('rejects duplicate titles across pages', () => {
    const problems = validate([
      { page: page({ path: '/a' }), html: html(filler) },
      { page: page({ path: '/b' }), html: html(filler) },
    ]);
    expect(problems.join(' ')).toMatch(/duplicates/);
  });

  it('rejects a thin page', () => {
    expect(validate([{ page: page(), html: html(' short') }]).join(' ')).toMatch(/only \d+ words/);
  });

  it('rejects template leakage', () => {
    expect(validate([{ page: page(), html: html(`undefined${filler}`) }]).join(' ')).toMatch(
      /"undefined"/,
    );
  });

  it('rejects more than one h1', () => {
    const problems = validate([{ page: page(), html: `${html(filler)}<h1>second</h1>` }]);
    expect(problems.join(' ')).toMatch(/2 h1 elements/);
  });
});
