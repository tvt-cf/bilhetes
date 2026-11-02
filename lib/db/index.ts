import "server-only";
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import { drizzle as drizzleLite } from "drizzle-orm/pglite";
import postgres from "postgres";
import * as schema from "./schema";

// Em produção usa DATABASE_URL (Neon, Supabase ou qualquer Postgres).
// Sem DATABASE_URL, roda um Postgres embutido (PGlite) em .data/ para desenvolvimento local.
type Db = ReturnType<typeof drizzlePg<typeof schema>>;

const globalForDb = globalThis as unknown as { bilhetesDb?: Promise<Db> };

async function connect(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const client = postgres(url, { prepare: false, max: 5 });
    await client.unsafe(schema.bootstrapSql);
    return drizzlePg(client, { schema });
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const { mkdirSync } = await import("node:fs");
  mkdirSync("./.data/pglite", { recursive: true });
  const client = new PGlite("./.data/pglite");
  await client.exec(schema.bootstrapSql);
  return drizzleLite(client, { schema }) as unknown as Db;
}

export function getDb(): Promise<Db> {
  globalForDb.bilhetesDb ??= connect();
  return globalForDb.bilhetesDb;
}

export { schema };
