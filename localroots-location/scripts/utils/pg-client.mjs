import pg from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Creates a pooled PostgreSQL client using the connection string supplied via
 * the environment variables `POSTGRES_URL` and `POSTGRES_PASSWORD`.
 *
 * The Supabase Dashboard → Connect page provides a URL of the form:
 *   postgres://postgres:<PASSWORD>@<PROJECT>.supabase.co:5432/postgres
 * We expect that URL (including password) to be stored in `POSTGRES_URL`.
 * Only this URL is ever used – no `SUPABASE_ANON_KEY` or `SUPABASE_SERVICE_ROLE_KEY`
 * is loaded into this script.
 */
export async function createPgClient() {
  const connectionString = process.env.POSTGRES_URL;
  if (!connectionString) {
    throw new Error('POSTGRES_URL environment variable is missing');
  }
  const pool = new pg.Pool({ connectionString });
  // Verify we can connect immediately.
  const client = await pool.connect();
  client.release();
  return pool;
}
