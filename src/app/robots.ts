import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://www.ticohabitat.com';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard/',
        '/admin/',
        '/api/',
        '/login',
        '/registro',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
