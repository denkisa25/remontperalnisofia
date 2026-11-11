import { site } from '../data/site';
import { allAreas } from '../data/raioni';

/**
 * LocalBusiness as a SERVICE-AREA business: no street address, areaServed from
 * the zone data. Deliberately no `priceRange` / `offers`: the only figures on
 * the site are placeholders and must never reach structured data.
 */
export function localBusiness(image?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${site.url}/#business`,
    name: site.name,
    url: `${site.url}/`,
    description: `${site.tagline}. Само перални и сушилни.`,
    telephone: '+359886473988',
    email: site.email,
    foundingDate: String(site.since),
    ...(image ? { image } : {}),
    areaServed: [
      { '@type': 'City', name: 'София' },
      ...allAreas.map((name) => ({ '@type': 'Place', name })),
    ],
    knowsAbout: ['ремонт на перални', 'ремонт на сушилни'],
  };
}

export function service(opts: { name: string; description: string; url: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: opts.name,
    description: opts.description,
    url: opts.url,
    serviceType: opts.name,
    provider: { '@id': `${site.url}/#business` },
    areaServed: { '@type': 'City', name: 'София' },
  };
}

export function faqPage(faq: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export function breadcrumbs(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: `${site.url}${it.path}`,
    })),
  };
}

/** JSON for an inline <script>: `<` escaped so content can never close the tag. */
export function ld(obj: unknown) {
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}
