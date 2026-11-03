/**
 * Environment helpers. Values are read at runtime and never hard-coded.
 * NEXT_PUBLIC_* values are safe for the browser. SUPABASE_SERVICE_ROLE_KEY must
 * only be read in server-only code (see src/lib/supabase/server.ts).
 */

export interface SupabasePublicConfig {
  url: string;
  anonKey: string;
}

/** Returns null (instead of throwing) when the public Supabase settings are missing. */
export function getSupabasePublicConfig(): SupabasePublicConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export function isSupabaseConfigured(): boolean {
  return getSupabasePublicConfig() !== null;
}
