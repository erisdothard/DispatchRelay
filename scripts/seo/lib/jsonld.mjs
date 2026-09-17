/**
 * JSON-LD builders. Each returns a plain object; the layout serialises them.
 * Only facts that exist in the content records are emitted — no invented
 * ratings, prices, or review counts.
 */
import { site } from '../content/site.mjs';

export function organization() {
  return {
    '@type': 'Organization',
    '@id': `${site.url}/#organization`,
    name: site.name,
    url: `${site.url}/`,
    logo: `${site.url}/logo.svg`,
    description: site.tagline,
  };
}

export function website() {
  return {
    '@type': 'WebSite',
    '@id': `${site.url}/#website`,
    name: site.name,
    url: `${site.url}/`,
    publisher: { '@id': `${site.url}/#organization` },
  };
}

export function softwareApplication() {
  return {
    '@type': 'SoftwareApplication',
    name: site.name,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web browser',
    url: `${site.url}/`,
    description: site.tagline,
    publisher: { '@id': `${site.url}/#organization` },
  };
}

export function faqPage(faq) {
  return {
    '@type': 'FAQPage',
    mainEntity: faq.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}

export function breadcrumbs(trail) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map(({ label, href }, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: label,
      item: `${site.url}${href}`,
    })),
  };
}

/** Wrap the page's nodes in a single @graph document. */
export function graph(nodes) {
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes }, null, 2);
}
