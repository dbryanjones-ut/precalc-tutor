import { MetadataRoute } from 'next';
import { getAppUrl } from '@/lib/env';

/**
 * Robots.txt generation
 *
 * This generates the robots.txt file dynamically.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = getAppUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/_next/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
