import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { runAutoExpirationSweep } from '@/lib/properties';

/**
 * GET /api/featured
 * Returns ALL active featured properties for democratic carousel rotation.
 * Optional query param: ?type=buy|rent
 */
export async function GET(request: NextRequest) {
  try {
    await runAutoExpirationSweep();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    const where: any = {
      featured: true,
      status: 'active',
    };

    if (type === 'buy' || type === 'rent') {
      where.type = type;
    }

    const properties = await db.property.findMany({
      where,
      include: {
        images: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform to PropertyCardProps shape for direct client consumption
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

    // Shuffle for democratic rotation
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }

    return NextResponse.json({
      items,
      total: items.length,
    });
  } catch (error) {
    console.error('Error in /api/featured:', error);
    return NextResponse.json({ items: [], total: 0 }, { status: 500 });
  }
}
