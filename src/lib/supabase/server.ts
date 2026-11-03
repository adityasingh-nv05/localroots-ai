/**
 * Supabase server client with the SERVICE ROLE key. It bypasses Row Level Security.
 * Only import this from Server Components, Route Handlers and Server Actions.
 * Never import it from a file marked 'use client'.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export function createServerClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
