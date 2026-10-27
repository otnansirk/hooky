import { NextRequest, NextResponse } from 'next/server';
import { getDb, endpoints } from '@/db';
import { eq } from 'drizzle-orm';
import { parseResponseSettings, toResponseSettings } from '@/lib/response-settings';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const db = await getDb();
    const endpointList = await db.select().from(endpoints).where(eq(endpoints.id, id)).limit(1);

    if (endpointList.length === 0) {
      return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
    }

    return NextResponse.json({ settings: toResponseSettings(endpointList[0]) });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const settings = parseResponseSettings(payload);
  if (typeof settings === 'string') {
    return NextResponse.json({ error: settings }, { status: 400 });
  }

  try {
    const db = await getDb();
    const updated = await db
      .update(endpoints)
      .set({
        responseStatus: settings.status,
        responseContentType: settings.contentType,
        responseHeaders: JSON.stringify(settings.headers),
        responseBody: settings.body,
      })
      .where(eq(endpoints.id, id))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
    }

    return NextResponse.json({ settings: toResponseSettings(updated[0]) });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
