/**
 * Raw Supabase queries. Server-only. Returns database rows; mappers.ts converts them.
 *
 * Every read uses the anon key, so row-level security decides what is visible.
 * Nothing here can bypass RLS. Errors are logged on the server and surfaced to pages
 * as a generic DataError, so internal details are not shown to visitors.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { createPublicServerClient } from './server';
import { DataError } from '@/lib/services/data-error';
import type { VerificationStatus } from '@/types';
import type {
  BusinessRow,
  CategoryRow,
  ProductRow,
  ReviewAuthorRow,
  ReviewRow,
  VerificationRequestRow,
} from '@/types/database';

function getClient(): SupabaseClient {
  const client = createPublicServerClient();
  if (!client) throw new DataError('Supabase is not configured.', 'unconfigured');
  return client;
}

/** Shape of a PostgREST error (message, code, hint, details). */
interface QueryError {
  message: string;
  code?: string;
  hint?: string | null;
  details?: string | null;
}

/**
 * Logs the full Supabase error on the server. In development the reason is also
 * included in the error message, so it appears on the page. Production shows only
 * the generic text, so internal details are never shown to visitors.
 */
function fail(table: string, error: QueryError): never {
  console.error(`[supabase] reading "${table}" failed:`, {
    message: error.message,
    code: error.code,
    hint: error.hint,
    details: error.details,
  });
  const reason = process.env.NODE_ENV !== 'production' ? ` Reason: ${error.message}` : '';
  throw new DataError(`Could not load ${table} right now.${reason}`, 'query');
}

export async function fetchActiveBusinesses(): Promise<BusinessRow[]> {
  const { data, error } = await getClient()
    .from('businesses')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });
  if (error) fail('businesses', error);
  return (data ?? []) as BusinessRow[];
}

export async function fetchBusinessRowBySlug(slug: string): Promise<BusinessRow | null> {
  const { data, error } = await getClient()
    .from('businesses')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();
  if (error) fail('business', error);
  return (data ?? null) as BusinessRow | null;
}

/** RLS only returns products whose business is active. */
export async function fetchProducts(): Promise<ProductRow[]> {
  const { data, error } = await getClient().from('products').select('*').order('name', { ascending: true });
  if (error) fail('products', error);
  return (data ?? []) as ProductRow[];
}

export async function fetchProductsForBusiness(businessId: string): Promise<ProductRow[]> {
  const { data, error } = await getClient()
    .from('products')
    .select('*')
    .eq('business_id', businessId)
    .order('name', { ascending: true });
  if (error) fail('products', error);
  return (data ?? []) as ProductRow[];
}

export async function fetchReviewRows(businessId: string): Promise<ReviewRow[]> {
  const { data, error } = await getClient()
    .from('reviews')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });
  if (error) fail('reviews', error);
  return (data ?? []) as ReviewRow[];
}

/** Display names for reviewers. Profiles are private, so this goes through a restricted function. */
export async function fetchReviewAuthorNames(userIds: string[]): Promise<Record<string, string>> {
  const unique = Array.from(new Set(userIds));
  if (unique.length === 0) return {};
  const { data, error } = await getClient().rpc('get_review_authors', { author_ids: unique });
  if (error) fail('review authors', error);
  const rows = (data ?? []) as ReviewAuthorRow[];
  return Object.fromEntries(rows.map((r) => [r.id, r.display_name]));
}

export async function fetchCategoryRows(): Promise<CategoryRow[]> {
  const { data, error } = await getClient().from('categories').select('*').order('sort_order', { ascending: true });
  if (error) fail('categories', error);
  return (data ?? []) as CategoryRow[];
}

/** Admin-only in practice: RLS returns nothing for other users. */
export async function fetchVerificationRows(status?: VerificationStatus): Promise<VerificationRequestRow[]> {
  let query = getClient().from('verification_requests').select('*').order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) fail('verification requests', error);
  return (data ?? []) as VerificationRequestRow[];
}
