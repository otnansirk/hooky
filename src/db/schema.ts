import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const endpoints = sqliteTable('endpoints', {
  id: text('id').primaryKey(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  lastActive: integer('last_active', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const requests = sqliteTable('requests', {
  id: text('id').primaryKey(),
  endpointId: text('endpoint_id')
    .notNull()
    .references(() => endpoints.id, { onDelete: 'cascade' }),
  method: text('method').notNull(),
  headers: text('headers').notNull(),
  queryParams: text('query_params').notNull(),
  body: text('body'),
  ip: text('ip'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type Endpoint = typeof endpoints.$inferSelect;
export type NewEndpoint = typeof endpoints.$inferInsert;

export type WebhookRequest = typeof requests.$inferSelect;
export type NewWebhookRequest = typeof requests.$inferInsert;
