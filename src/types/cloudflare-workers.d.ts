// Provided by the Workers runtime. Only the binding we read in src/db is typed.
declare module 'cloudflare:workers' {
  export const env: { DB?: D1Database } & Record<string, unknown>;
}

// Minimal shape for drizzle-orm/d1; avoids pulling in @cloudflare/workers-types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type D1Database = any;
