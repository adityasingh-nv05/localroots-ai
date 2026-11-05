/**
 * Server-side Supabase clients. Server code only: Server Components, Route Handlers
 * and Server Actions. Never import this file from a 'use client' component.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const NO_SESSION = { auth: { persistSession: false, autoRefreshToken: false } } as const;

/**
 * Used by the app for every read. It uses the PUBLIC anon key, so row-level
 * security applies to each query exactly as it does in the browser.
 */
export function createPublicServerClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return createClient(url, anonKey, NO_SESSION);
}

/**
 * SECRET. Bypasses row-level security. NOT used by the app yet.
 * Reserve for trusted admin jobs (for example, importing listings). Never import it
 * from pages or components, and never expose its key to the browser.
 */
export function createServiceRoleClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;
  return createClient(url, serviceRoleKey, NO_SESSION);
}
