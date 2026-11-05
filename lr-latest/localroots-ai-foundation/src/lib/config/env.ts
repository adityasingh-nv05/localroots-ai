/**
 * Environment configuration. Values are read at runtime; nothing is hard-coded.
 *
 *   NEXT_PUBLIC_SUPABASE_URL       Public. Your project URL. Safe in the browser.
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY  Public. Anon/publishable key. Safe in the browser;
 *                                  row-level security decides what it may access.
 *   SUPABASE_SERVICE_ROLE_KEY      SECRET. Bypasses security. Never read by the app
 *                                  yet and never prefixed with NEXT_PUBLIC_.
 *
 * Next.js inlines NEXT_PUBLIC_* values at build time, so restart the dev server
 * after changing them.
 */

export interface SupabasePublicConfig {
  url: string;
  anonKey: string;
}

/** Returns null (never throws) when the public Supabase settings are missing. */
export function getSupabasePublicConfig(): SupabasePublicConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export function isSupabaseConfigured(): boolean {
  return getSupabasePublicConfig() !== null;
}

/**
 * Where listing data comes from:
 *  - 'supabase'      : the database (when configured). Always used in production.
 *  - 'sample'        : built-in fictional data. Only when NOT in production and
 *                      Supabase is not configured. Never reached in production.
 *  - 'unconfigured'  : production without Supabase. Pages show an error.
 */
export type DataSource = 'supabase' | 'sample' | 'unconfigured';

export function resolveDataSource(input: {
  supabaseConfigured: boolean;
  nodeEnv: string | undefined;
}): DataSource {
  if (input.supabaseConfigured) return 'supabase';
  if (input.nodeEnv !== 'production') return 'sample';
  return 'unconfigured';
}

export function currentDataSource(): DataSource {
  return resolveDataSource({
    supabaseConfigured: isSupabaseConfigured(),
    nodeEnv: process.env.NODE_ENV,
  });
}
