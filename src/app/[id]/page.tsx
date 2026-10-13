import { Dashboard } from '@/components/Dashboard';
import { getDb, endpoints, requests, type WebhookRequest } from '@/db';
import { eq, desc } from 'drizzle-orm';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EndpointDashboardPage({ params }: PageProps) {
  const { id } = await params;
  const db = await getDb();

  const existingList = await db.select().from(endpoints).where(eq(endpoints.id, id)).limit(1);

  if (existingList.length === 0) {
    const now = new Date();
    await db.insert(endpoints).values({
      id,
      createdAt: now,
      lastActive: now,
    });
  }

  const items: WebhookRequest[] = await db
    .select()
    .from(requests)
    .where(eq(requests.endpointId, id))
    .orderBy(desc(requests.createdAt))
    .limit(100);

  const initialRequests = items.map((item) => ({
    ...item,
    headers: JSON.parse(item.headers || '{}'),
    queryParams: JSON.parse(item.queryParams || '{}'),
  }));

  return <Dashboard endpointId={id} initialRequests={initialRequests} />;
}
