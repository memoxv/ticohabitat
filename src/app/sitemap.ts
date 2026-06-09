import { MetadataRoute } from 'next';
import { db } from '@/lib/db';

export const revalidate = 3600; // Cache sitemap for 1 hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.ticohabitat.com';

  // 1. Static and provincial landing pages
  const staticPages = [
    { url: `${baseUrl}`, lastModified: new Date() },
    { url: `${baseUrl}/comprar`, lastModified: new Date() },
    { url: `${baseUrl}/alquilar`, lastModified: new Date() },
    
    // Provincias Comprar
    { url: `${baseUrl}/comprar/san-jose`, lastModified: new Date() },
    { url: `${baseUrl}/comprar/alajuela`, lastModified: new Date() },
    { url: `${baseUrl}/comprar/heredia`, lastModified: new Date() },
    { url: `${baseUrl}/comprar/cartago`, lastModified: new Date() },
    { url: `${baseUrl}/comprar/guanacaste`, lastModified: new Date() },
    { url: `${baseUrl}/comprar/puntarenas`, lastModified: new Date() },
    { url: `${baseUrl}/comprar/limon`, lastModified: new Date() },

    // Provincias Alquilar
    { url: `${baseUrl}/alquilar/san-jose`, lastModified: new Date() },
    { url: `${baseUrl}/alquilar/alajuela`, lastModified: new Date() },
    { url: `${baseUrl}/alquilar/heredia`, lastModified: new Date() },
    { url: `${baseUrl}/alquilar/cartago`, lastModified: new Date() },
    { url: `${baseUrl}/alquilar/guanacaste`, lastModified: new Date() },
    { url: `${baseUrl}/alquilar/puntarenas`, lastModified: new Date() },
    { url: `${baseUrl}/alquilar/limon`, lastModified: new Date() },
  ];

  // 2. Query all active properties for dynamic slugs
  try {
    const properties = await db.property.findMany({
      where: { status: 'active' },
      select: { slug: true, updatedAt: true },
    });

    const propertyPages = properties.map((prop) => ({
      url: `${baseUrl}/propiedad/${prop.slug}`,
      lastModified: prop.updatedAt,
    }));

    return [...staticPages, ...propertyPages];
  } catch (error) {
    console.error('Failed to generate dynamic sitemap, returning static pages only:', error);
    return staticPages;
  }
}
