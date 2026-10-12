import { Dashboard } from '@/components/Dashboard';
import { db, endpoints, requests } from '@/db';
import { eq, desc } from 'drizzle-orm';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EndpointDashboardPage({ params }: PageProps) {
  const { id } = await params;

  // Auto-create or fetch endpoint
  let endpoint = db.select().from(endpoints).where(eq(endpoints.id, id)).get();

  if (!endpoint) {
    const now = new Date();
    db.insert(endpoints)
      .values({
        id,
        createdAt: now,
        lastActive: now,
      })
      .run();
  }

  const items = db
    .select()
    .from(requests)
    .where(eq(requests.endpointId, id))
    .orderBy(desc(requests.createdAt))
    .limit(100)
    .all();

  const initialRequests = items.map((item) => ({
    ...item,
    headers: JSON.parse(item.headers || '{}'),
    queryParams: JSON.parse(item.queryParams || '{}'),
  }));

  return <Dashboard endpointId={id} initialRequests={initialRequests} />;
}
