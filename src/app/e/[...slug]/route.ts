import { NextRequest, NextResponse } from 'next/server';
import { getDb, endpoints, requests } from '@/db';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { broadcastNewRequest } from '@/lib/events';

async function handleWebhook(
  req: NextRequest,
  context: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await context.params;
  const endpointId = slug?.[0];

  if (!endpointId) {
    return NextResponse.json({ error: 'Endpoint ID is required' }, { status: 400 });
  }

  const now = new Date();
  const db = await getDb();

  // Upsert or ensure endpoint exists
  const existingList = await db
    .select()
    .from(endpoints)
    .where(eq(endpoints.id, endpointId))
    .limit(1);

  if (existingList.length === 0) {
    await db.insert(endpoints).values({
      id: endpointId,
      createdAt: now,
      lastActive: now,
    });
  } else {
    await db.update(endpoints).set({ lastActive: now }).where(eq(endpoints.id, endpointId));
  }

  const headersObj: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    headersObj[key] = value;
  });

  const queryParamsObj: Record<string, string> = {};
  req.nextUrl.searchParams.forEach((value, key) => {
    queryParamsObj[key] = value;
  });

  let bodyText = '';
  try {
    bodyText = await req.text();
  } catch {
    bodyText = '';
  }

  const forwarded = req.headers.get('x-forwarded-for');
  let rawIp = forwarded
    ? forwarded.split(',')[0].trim()
    : req.headers.get('x-real-ip') || '127.0.0.1';

  // Strip IPv4-mapped IPv6 prefix (e.g. ::ffff:127.0.0.1 -> 127.0.0.1)
  if (rawIp.startsWith('::ffff:')) {
    rawIp = rawIp.substring(7);
  } else if (rawIp === '::1') {
    rawIp = '127.0.0.1';
  }
  const ip = rawIp;

  const requestId = nanoid(12);

  const newRequest = {
    id: requestId,
    endpointId,
    method: req.method.toUpperCase(),
    headers: JSON.stringify(headersObj),
    queryParams: JSON.stringify(queryParamsObj),
    body: bodyText,
    ip,
    createdAt: now,
  };

  await db.insert(requests).values(newRequest);

  const formattedForBroadcast = {
    ...newRequest,
    headers: headersObj,
    queryParams: queryParamsObj,
  };

  broadcastNewRequest(endpointId, formattedForBroadcast);

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD',
    'Access-Control-Allow-Headers': '*',
  };

  return NextResponse.json(
    {
      success: true,
      message: 'Request captured by Hooky',
      requestId,
    },
    {
      status: 200,
      headers: corsHeaders,
    }
  );
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string[] }> }) {
  return handleWebhook(req, ctx);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ slug: string[] }> }) {
  return handleWebhook(req, ctx);
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ slug: string[] }> }) {
  return handleWebhook(req, ctx);
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ slug: string[] }> }) {
  return handleWebhook(req, ctx);
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ slug: string[] }> }) {
  return handleWebhook(req, ctx);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD',
      'Access-Control-Allow-Headers': '*',
    },
  });
}

export async function HEAD(req: NextRequest, ctx: { params: Promise<{ slug: string[] }> }) {
  return handleWebhook(req, ctx);
}
