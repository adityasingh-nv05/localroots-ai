/**
 * Supabase browser client. Use in Client Components only.
 * Returns null until NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getSupabasePublicConfig } from '@/lib/config/env';

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (browserClient) return browserClient;
  const config = getSupabasePublicConfig();
  if (!config) return null;
  browserClient = createClient(config.url, config.anonKey);
  return browserClient;
}
