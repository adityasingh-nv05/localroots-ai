/**
 * Supabase server client
 * Used in Server Components and Route Handlers
 * Requires SUPABASE_SERVICE_ROLE_KEY (never exposed to the browser)
 */

import { createClient } from '@supabase/supabase-js';

export function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
