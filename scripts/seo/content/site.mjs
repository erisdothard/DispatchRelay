/**
 * Site-wide facts. Every generated page reads its canonical host, brand names
 * and navigation from here so nothing is hardcoded per template.
 */

export const site = {
  url: 'https://dispatchrelay.co',
  name: 'DispatchRelay',
  tagline: 'Freight dispatch software for small carriers and brokers',
  // Matches the app shell so the site and the product feel like one product.
  themeColor: '#0d0d0d',
  accent: '#e86030',
  ogImage: '/og-image.png',
  twitter: '@dispatchrelay',
  appPath: '/app',
  demoPath: '/demo',
  // `mobile: false` links are hidden below 640px, where the header only has
  // room for the logo, one link and the call to action.
  nav: [
    { label: 'Who it’s for', href: '/#roles', mobile: true },
    { label: 'How it works', href: '/#how', mobile: false },
    { label: 'Live demo', href: '/demo', mobile: false },
  ],
  footer: [
    { label: 'For carriers', href: '/for/carriers' },
    { label: 'For brokers', href: '/for/brokers' },
    { label: 'For shippers', href: '/for/shippers' },
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
    { label: 'Live demo', href: '/demo' },
    { label: 'Open the app', href: '/app' },
  ],
};

/**
 * Stated once, rendered everywhere it is relevant. DispatchRelay is a working
 * demo rather than a product with open accounts, and every page says so
 * rather than implying a signup that does not exist yet.
 */
export const productStatus = {
  short: 'Early access — the full product is in private testing.',
  long: 'DispatchRelay is a working demo today, not an open product. Every screen you see in the demo runs on real application code with sample freight data. Accounts are not open yet; the waitlist is how you get in first.',
};
