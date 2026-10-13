import { NextRequest, NextResponse } from 'next/server';
import { getDb, endpoints, requests, type WebhookRequest } from '@/db';
import { eq, desc } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const db = await getDb();
    const endpointList = await db
      .select()
      .from(endpoints)
      .where(eq(endpoints.id, id))
      .limit(1);

    if (endpointList.length === 0) {
      return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
    }

    const items: WebhookRequest[] = await db
      .select()
      .from(requests)
      .where(eq(requests.endpointId, id))
      .orderBy(desc(requests.createdAt))
      .limit(100);

    const formatted = items.map((item) => ({
      ...item,
      headers: JSON.parse(item.headers || '{}'),
      queryParams: JSON.parse(item.queryParams || '{}'),
    }));

    return NextResponse.json({
      endpoint: endpointList[0],
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
    const db = await getDb();
    await db.delete(requests).where(eq(requests.endpointId, id));

    return NextResponse.json({ success: true, message: 'All requests deleted' });
  } catch (error) {
    console.error('Error deleting requests:', error);
    return NextResponse.json({ error: 'Failed to delete requests' }, { status: 500 });
  }
}
