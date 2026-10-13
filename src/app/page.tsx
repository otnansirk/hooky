import { redirect } from 'next/navigation';
import { getDb, endpoints } from '@/db';
import { nanoid } from 'nanoid';

export default async function HomePage() {
  const id = nanoid(10);
  const now = new Date();

  try {
    const db = await getDb();
    await db.insert(endpoints).values({
      id,
      createdAt: now,
      lastActive: now,
    });
  } catch (e) {
    console.error('Error auto-creating endpoint:', e);
  }

  redirect(`/${id}`);
}
