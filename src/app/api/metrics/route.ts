import { NextRequest, NextResponse } from 'next/server';
import { trackMetric } from '@/lib/properties';

export async function POST(req: NextRequest) {
  try {
    const { event, propertyId, value } = await req.json() as {
      event: string;
      propertyId?: string;
      value?: string;
    };

    if (!event) {
      return NextResponse.json({ error: 'Event name is required' }, { status: 400 });
    }

    await trackMetric(event, propertyId, value);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to record metric' }, { status: 500 });
  }
}
