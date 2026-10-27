import * as schema from './schema';
import { drizzle as drizzleD1 } from 'drizzle-orm/d1';

// Cache local db instance in Node.js
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _localDb: any = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getDb(): Promise<any> {
  // Cloudflare Workers: read D1 binding from workerd runtime environment
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { env } = (await import('cloudflare:workers')) as any;
    if (env?.DB) {
      return drizzleD1(env.DB, { schema });
    }
  } catch {
    // Falls through to local SQLite outside Cloudflare Workers
  }

  // Local SQLite instance for Node.js development and Docker containers
  if (_localDb) return _localDb;

  const { default: Database } = await import('better-sqlite3');
  const { drizzle: drizzleSqlite } = await import('drizzle-orm/better-sqlite3');
  const path = await import('path');
  const fs = await import('fs');

  const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'hooky.db');
  const dir = path.dirname(dbPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS endpoints (
      id TEXT PRIMARY KEY,
      created_at INTEGER NOT NULL,
      last_active INTEGER NOT NULL,
      response_status INTEGER NOT NULL DEFAULT 200,
      response_content_type TEXT NOT NULL DEFAULT 'application/json',
      response_headers TEXT NOT NULL DEFAULT '{}',
      response_body TEXT
    );

    CREATE TABLE IF NOT EXISTS requests (
      id TEXT PRIMARY KEY,
      endpoint_id TEXT NOT NULL,
      method TEXT NOT NULL,
      headers TEXT NOT NULL,
      query_params TEXT NOT NULL,
      body TEXT,
      ip TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (endpoint_id) REFERENCES endpoints(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_requests_endpoint_id ON requests(endpoint_id);
    CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests(created_at);
  `);

  // Add response settings columns to databases created before they existed
  const endpointColumns = new Set(
    (sqlite.prepare('PRAGMA table_info(endpoints)').all() as { name: string }[]).map((c) => c.name)
  );
  const responseColumns: [string, string][] = [
    ['response_status', 'INTEGER NOT NULL DEFAULT 200'],
    ['response_content_type', "TEXT NOT NULL DEFAULT 'application/json'"],
    ['response_headers', "TEXT NOT NULL DEFAULT '{}'"],
    ['response_body', 'TEXT'],
  ];
  for (const [name, definition] of responseColumns) {
    if (!endpointColumns.has(name)) {
      sqlite.exec(`ALTER TABLE endpoints ADD COLUMN ${name} ${definition}`);
    }
  }

  _localDb = drizzleSqlite(sqlite, { schema });
  return _localDb;
}

export * from './schema';
