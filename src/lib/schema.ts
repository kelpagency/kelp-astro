const siteUrl = 'https://www.kelp.agency';
const organizationId = `${siteUrl}/#organization`;

const titleFromSlug = (value: string) =>
  value
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

export const buildBreadcrumbSchema = (pathname: string, currentTitle: string) => {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';
  if (normalizedPath === '/') return null;

  const segments = normalizedPath.split('/').filter(Boolean);
  const items = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: siteUrl,
    },
  ];

  segments.forEach((segment, index) => {
    const href = `${siteUrl}/${segments.slice(0, index + 1).join('/')}/`;
    const isLast = index === segments.length - 1;
    items.push({
      '@type': 'ListItem',
      position: index + 2,
      name: isLast ? currentTitle.replace(/<[^>]+>/g, '').trim() : titleFromSlug(segment),
      item: href,
    });
  });

  return {
    '@type': 'BreadcrumbList',
    itemListElement: items,
  };
};

export const buildCollectionPageSchema = (name: string, description: string, itemListElement?: Record<string, unknown>[]) => ({
  '@type': 'CollectionPage',
  name,
  description,
  isPartOf: {
    '@id': `${siteUrl}/#website`,
  },
  ...(itemListElement?.length
    ? {
        mainEntity: {
          '@type': 'ItemList',
          itemListElement,
        },
      }
    : {}),
});

export const buildServiceSchema = ({
  name,
  description,
  url,
  areaServed = 'Florida',
}: {
  name: string;
  description: string;
  url: string;
  areaServed?: string;
}) => ({
  '@type': 'Service',
  name,
  description,
  url,
  provider: {
    '@id': organizationId,
  },
  areaServed: {
    '@type': 'State',
    name: areaServed,
  },
  serviceType: name,
});

export const buildPersonSchema = ({
  name,
  description,
  jobTitle,
  url,
  image,
}: {
  name: string;
  description: string;
  jobTitle: string;
  url: string;
  image?: string;
}) => ({
  '@type': 'Person',
  name,
  description,
  jobTitle,
  url,
  ...(image ? { image } : {}),
  worksFor: {
    '@id': organizationId,
  },
});

export const buildFaqSchema = (questions: Array<{ question: string; answer: string }>) => ({
  '@type': 'FAQPage',
  mainEntity: questions.map((entry) => ({
    '@type': 'Question',
    name: entry.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: entry.answer,
    },
  })),
});

export const buildItemList = (items: Array<{ name: string; url: string; description?: string }>) =>
  items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    url: item.url.startsWith('http') ? item.url : new URL(item.url, siteUrl).href,
    name: item.name,
    ...(item.description ? { description: item.description } : {}),
  }));
