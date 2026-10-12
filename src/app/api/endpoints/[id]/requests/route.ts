import { NextRequest, NextResponse } from 'next/server';
import { db, endpoints, requests } from '@/db';
import { eq, desc } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const endpoint = db
      .select()
      .from(endpoints)
      .where(eq(endpoints.id, id))
      .get();

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
    }

    const items = db
      .select()
      .from(requests)
      .where(eq(requests.endpointId, id))
      .orderBy(desc(requests.createdAt))
      .limit(100)
      .all();

    const formatted = items.map((item) => ({
      ...item,
      headers: JSON.parse(item.headers || '{}'),
      queryParams: JSON.parse(item.queryParams || '{}'),
    }));

    return NextResponse.json({
      endpoint,
      requests: formatted,
    });
  } catch (error) {
    console.error('Error fetching requests:', error);
    return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    db.delete(requests)
      .where(eq(requests.endpointId, id))
      .run();

    return NextResponse.json({ success: true, message: 'All requests deleted' });
  } catch (error) {
    console.error('Error deleting requests:', error);
    return NextResponse.json({ error: 'Failed to delete requests' }, { status: 500 });
  }
}
