/**
 * The document shell. Every generated page gets its own title, description,
 * canonical and JSON-LD from its content record — nothing here is site-wide
 * except the chrome.
 */
import { esc, each } from '../lib/html.mjs';
import { site } from '../content/site.mjs';
import { styles } from './styles.mjs';
import { renderSections } from './sections.mjs';
import { graph, organization, website, faqPage, breadcrumbs } from '../lib/jsonld.mjs';
import { waitlistIsland } from './waitlist-island.mjs';

function canonicalFor(path) {
  return path === '/' ? `${site.url}/` : `${site.url}${path}`;
}

function head(page) {
  const canonical = canonicalFor(page.path);
  const ogImage = `${site.url}${site.ogImage}`;
  const title = page.title;

  return `
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="${site.themeColor}" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(page.description)}" />
  <link rel="canonical" href="${esc(canonical)}" />

  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="${esc(site.name)}" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(page.description)}" />
  <meta property="og:url" content="${esc(canonical)}" />
  <meta property="og:image" content="${esc(ogImage)}" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="${esc(site.twitter)}" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(page.description)}" />
  <meta name="twitter:image" content="${esc(ogImage)}" />

  <link rel="icon" href="/logo.svg" type="image/svg+xml" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@400;600;700&display=swap"
    rel="stylesheet"
  />

  <style>${styles}</style>`;
}

/** Collect the JSON-LD nodes this page should carry. */
function structuredData(page) {
  const nodes = [organization(), website()];
  if (page.jsonld) nodes.push(...page.jsonld);

  const faqSection = page.sections.find((s) => s.type === 'faq');
  if (faqSection) nodes.push(faqPage(faqSection.faq));

  if (page.path !== '/') {
    nodes.push(
      breadcrumbs([
        { label: 'Home', href: '/' },
        { label: page.breadcrumb ?? page.navLabel ?? page.title, href: page.path },
      ]),
    );
  }
  return graph(nodes);
}

function header() {
  return `
  <header class="site-header">
    <div class="wrap">
      <a href="/" aria-label="${esc(site.name)} home"><img src="/logo-user-1.svg" alt="${esc(site.name)}" /></a>
      <nav class="site-nav">
        ${each(
          site.nav,
          (item) =>
            `<a class="${item.mobile ? '' : 'nav-secondary'}" href="${esc(item.href)}">${esc(item.label)}</a>`,
        )}
        <a class="btn btn-primary" href="${esc(site.demoPath)}" style="padding:9px 18px;font-size:15px">Try the demo</a>
      </nav>
    </div>
  </header>`;
}

function footer() {
  return `
  <footer class="site-footer">
    <div class="wrap">
      <nav>${each(site.footer, (l) => `<a href="${esc(l.href)}">${esc(l.label)}</a>`)}</nav>
      <p>© ${new Date().getUTCFullYear()} ${esc(site.name)}. ${esc(site.tagline)}.</p>
    </div>
  </footer>`;
}

export function renderPage(page) {
  const needsIsland = page.sections.some((s) => s.type === 'waitlist');

  return `<!doctype html>
<html lang="en">
<head>${head(page)}
  <script type="application/ld+json">${structuredData(page)}</script>
</head>
<body>
${header()}
<main>
${renderSections(page.sections)}
</main>
${footer()}
${needsIsland ? `<script>${waitlistIsland}</script>` : ''}
</body>
</html>
`;
}
