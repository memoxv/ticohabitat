import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

// GET: Returns details of properties based on favorited IDs passed in query parameters, or returns user's favorite IDs if none provided
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const idsParam = searchParams.get('ids');
  
  if (!idsParam) {
    try {
      const session = await getSession();
      if (!session) {
        return NextResponse.json({ ids: [] });
      }
      const favs = await db.favorite.findMany({
        where: { userId: session.userId },
        select: { propertyId: true },
      });
      return NextResponse.json({ ids: favs.map((f) => f.propertyId) });
    } catch (error) {
      return NextResponse.json({ error: 'Failed to fetch user favorites' }, { status: 500 });
    }
  }

  try {
    const ids = idsParam.split(',');
    const items = await db.property.findMany({
      where: {
        id: { in: ids },
        status: 'active',
      },
      include: {
        images: true,
      },
    });

    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
  }
}

// POST: Sincroniza favoritos con la base de datos para usuarios autenticados
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { propertyId } = await req.json() as { propertyId: string };
    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID required' }, { status: 400 });
    }

    const existing = await db.favorite.findUnique({
      where: {
        userId_propertyId: {
          userId: session.userId,
          propertyId,
        },
      },
    });

    if (existing) {
      await db.favorite.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({ favorited: false });
    } else {
      await db.favorite.create({
        data: {
          userId: session.userId,
          propertyId,
        },
      });
      return NextResponse.json({ favorited: true });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
