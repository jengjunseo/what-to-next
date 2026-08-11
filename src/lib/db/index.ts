import "server-only";

import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/lib/db/schema";

type Database = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  sqlClient?: ReturnType<typeof postgres>;
  database?: Database;
};

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function getDb(): Database {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL이 설정되지 않았습니다.");
  }

  if (!globalForDb.sqlClient) {
    globalForDb.sqlClient = postgres(databaseUrl, {
      max: 3,
      prepare: false,
      idle_timeout: 20,
      connect_timeout: 10,
    });
  }

  if (!globalForDb.database) {
    globalForDb.database = drizzle(globalForDb.sqlClient, { schema });
  }

  return globalForDb.database;
}
