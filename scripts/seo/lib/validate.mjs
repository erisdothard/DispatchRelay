/**
 * Build-time checks on the generated pages. Every one of these has a specific
 * failure it prevents from reaching production:
 *
 *  - duplicate titles/descriptions and thin pages look like doorway spam (R-6)
 *  - a wrong canonical de-indexes the page it is on (R-1)
 *  - a missing or duplicated h1 makes the page's subject ambiguous
 *  - template leakage ("undefined", "[object Object]") is always a bug
 */
import { site } from '../content/site.mjs';

const TITLE_MAX = 65;
const DESC_MIN = 50;
const DESC_MAX = 165;
const BODY_MIN_WORDS = 150;

function countMatches(html, pattern) {
  return (html.match(pattern) ?? []).length;
}

/** Strip tags so word counts reflect what a reader actually gets. */
function textOf(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function validate(rendered) {
  const problems = [];
  const seenTitles = new Map();
  const seenDescriptions = new Map();

  for (const { page, html } of rendered) {
    const at = `${page.path}:`;

    if (page.title.length > TITLE_MAX) {
      problems.push(`${at} title is ${page.title.length} chars (max ${TITLE_MAX})`);
    }
    if (page.description.length < DESC_MIN || page.description.length > DESC_MAX) {
      problems.push(
        `${at} description is ${page.description.length} chars (want ${DESC_MIN}–${DESC_MAX})`,
      );
    }

    const titleClash = seenTitles.get(page.title);
    if (titleClash) problems.push(`${at} title duplicates ${titleClash}`);
    seenTitles.set(page.title, page.path);

    const descClash = seenDescriptions.get(page.description);
    if (descClash) problems.push(`${at} description duplicates ${descClash}`);
    seenDescriptions.set(page.description, page.path);

    const h1s = countMatches(html, /<h1[\s>]/g);
    if (h1s !== 1) problems.push(`${at} has ${h1s} h1 elements (want exactly 1)`);

    const expected = page.path === '/' ? `${site.url}/` : `${site.url}${page.path}`;
    if (!html.includes(`<link rel="canonical" href="${expected}" />`)) {
      problems.push(`${at} canonical is missing or does not point at ${expected}`);
    }

    if (!html.includes('application/ld+json')) {
      problems.push(`${at} has no JSON-LD block`);
    }

    const words = textOf(html).split(' ').length;
    if (words < BODY_MIN_WORDS) {
      problems.push(`${at} renders only ${words} words (min ${BODY_MIN_WORDS})`);
    }

    for (const leak of ['undefined', '[object Object]', 'NaN']) {
      if (html.includes(leak)) problems.push(`${at} output contains "${leak}"`);
    }
  }

  return problems;
}
