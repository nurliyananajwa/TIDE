import nextEnv from "@next/env";
import pg from "pg";
import { join } from "node:path";
nextEnv.loadEnvConfig(process.cwd());
if (!process.env.DATABASE_URL) {
  console.error("Add DATABASE_URL to .env.local using the Supabase Connect panel.");
  process.exit(1);
}
const url = new URL(process.env.DATABASE_URL);
url.searchParams.set("sslmode", "verify-full");
url.searchParams.set("sslrootcert", join(process.cwd(), "certs/supabase-ca.crt"));
const pool = new pg.Pool({ connectionString: url.toString(), connectionTimeoutMillis: 10000, max: 1 });
try {
  await pool.query("SELECT 1 AS connection_check");
  console.log("TIDE database connection successful.");
} catch {
  console.error("Database connection failed. Check the URI, password, TLS settings, and network access.");
  process.exitCode = 1;
} finally {
  await pool.end();
}
