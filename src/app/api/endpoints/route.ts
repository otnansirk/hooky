import { NextRequest, NextResponse } from 'next/server';
import { db, endpoints } from '@/db';
import { nanoid } from 'nanoid';

export async function POST(req: NextRequest) {
  try {
    const id = nanoid(10);
    const now = new Date();

    db.insert(endpoints)
      .values({
        id,
        createdAt: now,
        lastActive: now,
      })
      .run();

    const host = req.headers.get('host') || 'localhost:3000';
    const proto = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    const webhookUrl = `${proto}://${host}/e/${id}`;

    return NextResponse.json({
      id,
      webhookUrl,
      createdAt: now.toISOString(),
      lastActive: now.toISOString(),
    });
  } catch (error) {
    console.error('Failed to create endpoint:', error);
    return NextResponse.json({ error: 'Failed to create endpoint' }, { status: 500 });
  }
}
