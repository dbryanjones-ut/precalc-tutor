import { MetadataRoute } from 'next';
import { getAppUrl } from '@/lib/env';

/**
 * Sitemap generation for SEO
 *
 * This generates a sitemap.xml file for search engines.
 * Update this file when adding new routes.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getAppUrl();

  const routes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/dashboard`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/lessons`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/practice`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/tools`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/reference`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/settings`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
  ];

  // Add lesson routes dynamically if needed
  // const lessons = await getLessons();
  // lessons.forEach(lesson => {
  //   routes.push({
  //     url: `${baseUrl}/lessons/${lesson.id}`,
  //     lastModified: new Date(lesson.updatedAt),
  //     changeFrequency: 'monthly',
  //     priority: 0.6,
  //   });
  // });

  return routes;
}
