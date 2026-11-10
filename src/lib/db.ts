import "server-only";
import { join } from "node:path";
import { Pool, type QueryResultRow } from "pg";

const globalForDb = globalThis as unknown as { tidePool?: Pool };
function getPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not configured.");
  const url = new URL(connectionString);
  url.searchParams.set("sslmode", "verify-full");
  url.searchParams.set("sslrootcert", join(process.cwd(), "certs/supabase-ca.crt"));
  if (!globalForDb.tidePool) {
    globalForDb.tidePool = new Pool({
      connectionString: url.toString(),
      max: 3,
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 20_000,
    });
  }
  return globalForDb.tidePool;
}
// Keep SQL on the server; pass user input through parameters ($1, $2, ...).
export async function query<T extends QueryResultRow>(sql: string, values: unknown[] = []) {
  return getPool().query<T>(sql, values);
}
