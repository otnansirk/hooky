import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (_db) return _db;

  const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'hooky.db');
  const dir = path.dirname(dbPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');

  // Auto-init tables if not exist for zero-friction local/docker startup
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS endpoints (
      id TEXT PRIMARY KEY,
      created_at INTEGER NOT NULL,
      last_active INTEGER NOT NULL
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

  _db = drizzle(sqlite, { schema });
  return _db;
}

export const db = getDb();
export * from './schema';
