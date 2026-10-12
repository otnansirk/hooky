import { redirect } from 'next/navigation';
import { db, endpoints } from '@/db';
import { nanoid } from 'nanoid';

export default function HomePage() {
  const id = nanoid(10);
  const now = new Date();

  try {
    db.insert(endpoints)
      .values({
        id,
        createdAt: now,
        lastActive: now,
      })
      .run();
  } catch (e) {
    console.error('Error auto-creating endpoint:', e);
  }

  redirect(`/${id}`);
}
