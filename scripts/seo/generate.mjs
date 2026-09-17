#!/usr/bin/env node
/**
 * Emits the marketing site as static HTML into the Vite build output.
 *
 * Runs AFTER `vite build` and never inside it (R-8): a failure here must not
 * be able to corrupt dist/assets or block an app deploy.
 *
 * The one structural change it makes is moving the SPA entry aside:
 *
 *   dist/index.html  (SPA)  ->  dist/app.html
 *   dist/index.html          =  generated marketing homepage
 *
 * `vercel.json` rewrites every non-marketing path to /app.html, so app deep
 * links keep working while `/` serves a real, crawlable page.
 */
import { mkdir, readFile, writeFile, rename, access } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { pages } from './content/pages.mjs';
import { site } from './content/site.mjs';
import { renderPage } from './templates/layout.mjs';
import { validate } from './lib/validate.mjs';

const here = dirname(fileURLToPath(import.meta.url));
// Overridable so tests can drive the generator against a scratch directory.
const distDir = process.env.SEO_DIST_DIR
  ? resolve(process.env.SEO_DIST_DIR)
  : resolve(here, '../../apps/web/dist');

const SPA_ENTRY = 'app.html';

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Move the SPA's index.html aside so `/` is free for the marketing homepage.
 *
 * Vite does not reliably empty `dist` between builds, so a rebuild leaves the
 * previous run's `app.html` next to a freshly built `index.html`. Keeping the
 * old one would serve an app shell referencing asset hashes that no longer
 * exist, so a fresh SPA entry always wins.
 */
async function relocateSpaEntry() {
  const indexPath = join(distDir, 'index.html');
  const appPath = join(distDir, SPA_ENTRY);

  const indexHtml = (await exists(indexPath)) ? await readFile(indexPath, 'utf8') : null;
  const indexIsSpaEntry = indexHtml?.includes('id="root"') ?? false;

  if (indexIsSpaEntry) {
    const replaced = await exists(appPath);
    await rename(indexPath, appPath);
    return { moved: true, replaced };
  }

  // No fresh shell to move. That is only legitimate if a previous run already
  // put one at app.html and this index.html is the marketing page.
  if (await exists(appPath)) return { moved: false, reason: `${SPA_ENTRY} already current` };

  throw new Error(
    indexHtml === null
      ? 'No dist/index.html — run the Vite build first.'
      : 'dist/index.html is not the SPA entry and dist/app.html is missing — build output looks wrong.',
  );
}

/** `/pricing` -> `dist/pricing/index.html`; `/` -> `dist/index.html`. */
function outputPathFor(routePath) {
  return routePath === '/'
    ? join(distDir, 'index.html')
    : join(distDir, routePath.replace(/^\//, ''), 'index.html');
}

function renderSitemap(routes) {
  const urls = routes
    .map((routePath) => {
      const loc = routePath === '/' ? `${site.url}/` : `${site.url}${routePath}`;
      const priority = routePath === '/' ? '1.0' : '0.8';
      return `  <url>\n    <loc>${loc}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

async function main() {
  const rendered = pages.map((page) => ({ page, html: renderPage(page) }));

  // Validate before anything is written — a bad page should never reach dist.
  const problems = validate(rendered);
  if (problems.length) {
    console.error('\nMarketing build failed validation:\n');
    for (const problem of problems) console.error(`  ✗ ${problem}`);
    console.error('');
    process.exit(1);
  }

  const relocation = await relocateSpaEntry();

  for (const { page, html } of rendered) {
    const out = outputPathFor(page.path);
    await mkdir(dirname(out), { recursive: true });
    await writeFile(out, html, 'utf8');
  }

  await writeFile(
    join(distDir, 'sitemap.xml'),
    renderSitemap(pages.map((p) => p.path)),
    'utf8',
  );

  const label = relocation.moved
    ? `index.html -> ${SPA_ENTRY}${relocation.replaced ? ' (replaced stale shell)' : ''}`
    : `SPA entry: ${relocation.reason}`;
  console.log(`Marketing site generated (${label})`);
  for (const { page } of rendered) console.log(`  · ${page.path}`);
  console.log(`  · /sitemap.xml`);
}

main().catch((error) => {
  console.error(`\nMarketing build failed: ${error.message}\n`);
  process.exit(1);
});
