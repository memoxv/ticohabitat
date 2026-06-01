import { db } from './db';
import { checkAndSeedDatabase } from './seed';
import { Prisma } from '@prisma/client';

export interface PropertyFilters {
  type?: 'buy' | 'rent';
  province?: string;
  priceMin?: number;
  priceMax?: number;
  bedrooms?: number;
  bathrooms?: number;
  parkingSpaces?: number;
  petsAllowed?: boolean;
  condominium?: boolean;
  propertyType?: string;
  search?: string;
  sort?: 'recent' | 'price_asc' | 'price_desc' | 'relevant';
  limit?: number;
  page?: number;
  status?: string;
  features?: string;
}

let lastSweepTime = 0;
const SWEEP_THROTTLE_MS = 5 * 60 * 1000; // 5 minutes

export async function runAutoExpirationSweep() {
  if (!process.env.DATABASE_URL) {
    return; // Skip if database is not configured
  }

  const now = Date.now();
  if (now - lastSweepTime < SWEEP_THROTTLE_MS) {
    return; // Skip sweep if run recently to avoid connection and database saturation
  }

  lastSweepTime = now;

  try {
    // Auto-expire featured listings on query
    await db.property.updateMany({
      where: {
        featured: true,
        featuredExpiresAt: {
          lt: new Date(),
        },
      },
      data: {
        featured: false,
        featuredExpiresAt: null,
      },
    });
  } catch (error) {
    console.error('Error auto-expiring featured properties:', error);
  }

  try {
    // Auto-expire user plans
    const expiredUsers = await db.user.findMany({
      where: {
        planType: { not: 'FREE' },
        planExpiresAt: {
          lt: new Date(),
        },
      },
      select: { id: true }
    });

    if (expiredUsers.length > 0) {
      const expiredUserIds = expiredUsers.map((u) => u.id);

      // Find all linked agents belonging to these expired agencies
      const linkedAgents = await db.user.findMany({
        where: { linkedAgencyId: { in: expiredUserIds } },
        select: { id: true }
      });

      const affectedUserIds = [...expiredUserIds, ...linkedAgents.map((a) => a.id)];

      // 1. Deactivate (archive) all active listings for all affected users
      await db.property.updateMany({
        where: {
          userId: { in: affectedUserIds },
          status: 'active',
        },
        data: {
          status: 'archived',
        },
      });

      // 2. Downgrade the expired owners to FREE
      await db.user.updateMany({
        where: {
          id: { in: expiredUserIds },
        },
        data: {
          planType: 'FREE',
          planExpiresAt: null,
          // We keep linked agency configurations but they won't inherit any benefit because the owner plan is FREE!
        },
      });

      console.log(`[Auto-Expiration] Degraded ${expiredUserIds.length} expired subscription plans and archived all their listings.`);
    }
  } catch (error) {
    console.error('Error auto-expiring user plans:', error);
  }
}

export async function getProperties(filters: PropertyFilters) {
  // Ensure database is seeded with mock data if empty
  await checkAndSeedDatabase();
  runAutoExpirationSweep(); // Fire-and-forget: don't block page rendering

  const {
    type,
    province,
    priceMin,
    priceMax,
    bedrooms,
    bathrooms,
    parkingSpaces,
    petsAllowed,
    condominium,
    propertyType,
    search,
    sort = 'recent',
    limit = 12,
    page = 1,
    status = 'active',
    features,
  } = filters;

  const offset = (page - 1) * limit;

  // Build prisma query options
  const where: Prisma.PropertyWhereInput = {
    status,
  };

  if (type) {
    where.type = type;
  }

  if (province && province !== 'all') {
    where.province = {
      equals: province,
    };
  }

  if (propertyType && propertyType !== 'all') {
    where.propertyType = propertyType;
  }

  // Price range filter
  if (priceMin !== undefined || priceMax !== undefined) {
    where.price = {};
    if (priceMin !== undefined) {
      where.price.gte = priceMin;
    }
    if (priceMax !== undefined) {
      where.price.lte = priceMax;
    }
  }

  if (bedrooms !== undefined && bedrooms > 0) {
    where.bedrooms = { gte: bedrooms };
  }

  if (bathrooms !== undefined && bathrooms > 0) {
    where.bathrooms = { gte: bathrooms };
  }

  if (parkingSpaces !== undefined && parkingSpaces > 0) {
    where.parkingSpaces = { gte: parkingSpaces };
  }

  if (petsAllowed) {
    where.petsAllowed = true;
  }

  if (condominium) {
    where.condominium = true;
  }

  if (features) {
    const keys = features.split(',');
    where.AND = [
      ...(Array.isArray(where.AND) ? (where.AND as any[]) : []),
      ...keys.map((key) => ({
        features: { contains: `"${key}"` },
      })),
    ];
  }

  // Simple text search (title / description)
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
      { canton: { contains: search } },
      { district: { contains: search } },
    ];
  }

  // Build sorting
  let orderBy: Prisma.PropertyOrderByWithRelationInput | Prisma.PropertyOrderByWithRelationInput[] = [
    { featured: 'desc' },
    { createdAt: 'desc' }
  ];
  
  if (sort === 'price_asc') {
    orderBy = [
      { featured: 'desc' },
      { price: 'asc' }
    ];
  } else if (sort === 'price_desc') {
    orderBy = [
      { featured: 'desc' },
      { price: 'desc' }
    ];
  } else if (sort === 'relevant') {
    orderBy = [
      { featured: 'desc' },
      { createdAt: 'desc' }
    ];
  }

  const [items, total] = await Promise.all([
    db.property.findMany({
      where,
      include: {
        images: true,
      },
      orderBy,
      take: limit,
      skip: offset,
    }),
    db.property.count({ where }),
  ]);

  return {
    items,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getPropertyBySlug(slug: string) {
  await checkAndSeedDatabase();
  runAutoExpirationSweep(); // Fire-and-forget: don't block page rendering

  return await db.property.findUnique({
    where: { slug },
    include: {
      images: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          planType: true,
          agencyName: true,
          agencyLogo: true,
        },
      },
    },
  });
}

export async function getSimilarProperties(propertyId: string, limit = 3) {
  const property = await db.property.findUnique({
    where: { id: propertyId },
  });

  if (!property) return [];

  return await db.property.findMany({
    where: {
      id: { not: propertyId },
      status: 'active',
      province: property.province,
      type: property.type,
    },
    include: {
      images: true,
    },
    orderBy: {
      featured: 'desc',
    },
    take: limit,
  });
}

export async function getUserProperties(userId: string) {
  await checkAndSeedDatabase();
  runAutoExpirationSweep(); // Fire-and-forget: don't block page rendering

  return await db.property.findMany({
    where: { userId },
    include: {
      images: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function getAdminProperties() {
  await checkAndSeedDatabase();
  runAutoExpirationSweep(); // Fire-and-forget: don't block page rendering

  return await db.property.findMany({
    include: {
      images: true,
      user: {
        select: {
          email: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function getAdminReports() {
  return await db.report.findMany({
    include: {
      property: {
        select: {
          title: true,
          slug: true,
        },
      },
      user: {
        select: {
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export interface DuplicateGroup {
  sharedImageUrls: string[];
  properties: {
    id: string;
    title: string;
    slug: string;
    price: number;
    currency: string;
    province: string;
    status: string;
    contactPhone: string;
    imageUrl?: string;
    userEmail: string;
  }[];
}

export async function getAdminSuspiciousDuplicates(): Promise<DuplicateGroup[]> {
  // Find all image URLs used by more than one property (exact URL match)
  const duplicateUrls: { url: string }[] = await db.$queryRaw`
    SELECT url FROM "PropertyImage"
    GROUP BY url
    HAVING COUNT(DISTINCT "propertyId") > 1
  `;

  if (duplicateUrls.length === 0) return [];

  // Fetch all properties that have any of the duplicate image URLs
  const urlList = duplicateUrls.map((d) => d.url);

  const affectedImages = await db.propertyImage.findMany({
    where: { url: { in: urlList } },
    select: { url: true, propertyId: true },
  });

  // Build a map: url -> set of propertyIds
  const urlToPropertyIds = new Map<string, Set<string>>();
  for (const img of affectedImages) {
    if (!urlToPropertyIds.has(img.url)) {
      urlToPropertyIds.set(img.url, new Set());
    }
    urlToPropertyIds.get(img.url)!.add(img.propertyId);
  }

  // Group properties that share at least one image into clusters
  // Use Union-Find to merge overlapping URL groups
  const propertyToGroup = new Map<string, string>();
  const find = (id: string): string => {
    if (!propertyToGroup.has(id)) propertyToGroup.set(id, id);
    if (propertyToGroup.get(id) !== id) {
      propertyToGroup.set(id, find(propertyToGroup.get(id)!));
    }
    return propertyToGroup.get(id)!;
  };
  const union = (a: string, b: string) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) propertyToGroup.set(ra, rb);
  };

  for (const propIds of urlToPropertyIds.values()) {
    const ids = [...propIds];
    for (let i = 1; i < ids.length; i++) {
      union(ids[0], ids[i]);
    }
  }

  // Collect groups
  const groups = new Map<string, Set<string>>();
  const allPropertyIds = new Set<string>();
  for (const propIds of urlToPropertyIds.values()) {
    for (const id of propIds) {
      allPropertyIds.add(id);
      const root = find(id);
      if (!groups.has(root)) groups.set(root, new Set());
      groups.get(root)!.add(id);
    }
  }

  // Fetch the full property data for all affected properties in one query
  const propertiesData = await db.property.findMany({
    where: { id: { in: [...allPropertyIds] } },
    include: {
      images: { take: 1 },
      user: { select: { email: true } },
    },
  });

  const propertyMap = new Map(propertiesData.map((p) => [p.id, p]));

  // Build the result groups
  const result: DuplicateGroup[] = [];
  for (const [, memberIds] of groups) {
    if (memberIds.size < 2) continue;

    // Find which URLs are shared within this group
    const groupSharedUrls: string[] = [];
    for (const [url, propIds] of urlToPropertyIds) {
      const overlap = [...propIds].filter((id) => memberIds.has(id));
      if (overlap.length > 1) groupSharedUrls.push(url);
    }

    const groupProperties = [...memberIds]
      .map((id) => propertyMap.get(id))
      .filter(Boolean)
      .map((p) => ({
        id: p!.id,
        title: p!.title,
        slug: p!.slug,
        price: p!.price,
        currency: p!.currency,
        province: p!.province,
        status: p!.status,
        contactPhone: p!.contactPhone,
        imageUrl: p!.images?.[0]?.url,
        userEmail: p!.user.email,
      }));

    if (groupProperties.length >= 2) {
      result.push({
        sharedImageUrls: groupSharedUrls,
        properties: groupProperties,
      });
    }
  }

  return result;
}

export async function trackMetric(event: string, propertyId?: string, value?: string) {
  try {
    await db.metric.create({
      data: {
        event,
        propertyId,
        value,
      },
    });
  } catch (e) {
    console.error('Failed to log metric:', e);
  }
}

export async function getDashboardMetrics() {
  const [
    usersCount,
    verifiedPhones,
    totalProperties,
    activeProperties,
    whatsappClicks,
    reportsCount,
  ] = await Promise.all([
    db.user.count(),
    db.phoneVerification.count({ where: { verified: true } }),
    db.property.count(),
    db.property.count({ where: { status: 'active' } }),
    db.metric.count({ where: { event: 'whatsapp_click' } }),
    db.report.count(),
  ]);

  return {
    usersCount,
    verifiedPhones,
    totalProperties,
    activeProperties,
    whatsappClicks,
    reportsCount,
  };
}

/**
 * Count total active featured properties (for carousel pagination).
 */
export async function getFeaturedCountAction(type?: 'buy' | 'rent'): Promise<number> {
  try {
    if (!process.env.DATABASE_URL) return 0;
    await runAutoExpirationSweep();
    return await db.property.count({
      where: {
        featured: true,
        status: 'active',
        ...(type ? { type } : {}),
      },
    });
  } catch (error) {
    console.error('Error counting featured properties:', error);
    return 0;
  }
}

/**
 * Robust & ultra-fast democratized random query to rotate paid active highlights dynamically on main showcases.
 * Returns an initial batch + total count for carousel hydration.
 */
export async function getRandomFeaturedPropertiesAction(type?: 'buy' | 'rent', limit = 3) {
  runAutoExpirationSweep(); // Fire-and-forget: don't block featured query

  try {
    if (!process.env.DATABASE_URL) {
      return { items: [], totalCount: 0 };
    }

    // 1. Fetch only IDs of all currently active featured properties
    const activeFeatured = await db.property.findMany({
      where: {
        featured: true,
        status: 'active',
        ...(type ? { type } : {}),
      },
      select: { id: true },
    });

    if (activeFeatured.length === 0) {
      return { items: [], totalCount: 0 };
    }

    const totalCount = activeFeatured.length;

    // 2. Fisher-Yates shuffle in memory (extremely fast for hundreds of listings)
    const ids = activeFeatured.map((p) => p.id);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    const shuffledIds = ids.slice(0, limit);

    // 3. Query complete details only for the randomly chosen subset
    const properties = await db.property.findMany({
      where: {
        id: { in: shuffledIds },
      },
      include: {
        images: true,
      },
    });

    // Shuffle result order too (DB 'in' doesn't guarantee order)
    for (let i = properties.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [properties[i], properties[j]] = [properties[j], properties[i]];
    }

    // Map to PropertyCardProps shape
    const items = properties.map((p) => ({
      id: p.id,
      type: p.type,
      propertyType: p.propertyType,
      title: p.title,
      slug: p.slug,
      price: p.price,
      currency: p.currency,
      province: p.province,
      canton: p.canton,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      parkingSpaces: p.parkingSpaces,
      petsAllowed: p.petsAllowed,
      featured: p.featured,
      verified: p.verified,
      imageUrl: p.images?.[0]?.url || null,
      contactPhone: p.contactPhone,
    }));

    return { items, totalCount };
  } catch (error) {
    console.error('Error fetching random featured properties:', error);
    return { items: [], totalCount: 0 };
  }
}
