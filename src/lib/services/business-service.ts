/**
 * The data service used by every page.
 *
 * Source selection (see src/lib/config/env.ts):
 *  - Supabase configured: every call reads the database, with row-level security applied.
 *  - Not configured, not production: built-in fictional sample data (development only).
 *  - Not configured, production: throws DataError('unconfigured').
 *
 * Supabase code is imported lazily, so sample-only code paths (and the unit tests) never load it.
 */
import type {
  Business,
  BusinessFilters,
  Category,
  Product,
  Review,
  VerificationRequest,
  VerificationStatus,
} from '@/types';
import { currentDataSource, type DataSource } from '@/lib/config/env';
import { SAMPLE_BUSINESSES, SAMPLE_CATEGORIES, SAMPLE_PRODUCTS, SAMPLE_REVIEWS, SAMPLE_VERIFICATION_REQUESTS } from '@/lib/data/sample-data';
import { KARNATAKA_LOCATIONS } from '@/lib/data/locations';
import { DataError } from './data-error';
import { countByLocation, filterBusinesses, sortBusinesses } from './business-filter';
import {
  rowToBusiness,
  rowToCategory,
  rowToProduct,
  rowToReview,
  rowToVerificationRequest,
} from '@/lib/supabase/mappers';

export { sortBusinesses };

export interface DataSourceInfo {
  source: DataSource;
}

export function getDataSourceInfo(): DataSourceInfo {
  return { source: currentDataSource() };
}

/** Returns the active source, or throws when production has no database configured. */
function activeSource(): 'supabase' | 'sample' {
  const source = currentDataSource();
  if (source === 'unconfigured') {
    throw new DataError(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
      'unconfigured',
    );
  }
  return source;
}

async function loadRepository() {
  return import('@/lib/supabase/repository');
}

async function loadCatalog(): Promise<{ businesses: Business[]; products: Product[] }> {
  if (activeSource() === 'sample') {
    return { businesses: SAMPLE_BUSINESSES.filter((b) => b.is_active), products: SAMPLE_PRODUCTS };
  }
  const repo = await loadRepository();
  const [rows, productRows] = await Promise.all([repo.fetchActiveBusinesses(), repo.fetchProducts()]);
  return {
    businesses: rows.map(rowToBusiness),
    products: productRows.map(rowToProduct),
  };
}

export async function listBusinesses(filters: BusinessFilters = {}): Promise<Business[]> {
  const catalog = await loadCatalog();
  return filterBusinesses(catalog.businesses, catalog.products, filters);
}

export async function getLocationCounts(): Promise<Record<string, number>> {
  const catalog = await loadCatalog();
  const counts = countByLocation(catalog.businesses);
  // Make sure every location chip has a number, even when a location has no listings.
  for (const loc of KARNATAKA_LOCATIONS) counts[loc.slug] ??= 0;
  return counts;
}

export async function getBusinessBySlug(slug: string): Promise<Business | null> {
  if (activeSource() === 'sample') {
    return SAMPLE_BUSINESSES.find((b) => b.slug === slug && b.is_active) ?? null;
  }
  const repo = await loadRepository();
  const row = await repo.fetchBusinessRowBySlug(slug);
  return row ? rowToBusiness(row) : null;
}

export async function getProductsForBusiness(businessId: string): Promise<Product[]> {
  if (activeSource() === 'sample') {
    return SAMPLE_PRODUCTS.filter((p) => p.business_id === businessId);
  }
  const repo = await loadRepository();
  const rows = await repo.fetchProductsForBusiness(businessId);
  return rows.map(rowToProduct);
}

export async function getReviewsForBusiness(businessId: string): Promise<Review[]> {
  if (activeSource() === 'sample') {
    return SAMPLE_REVIEWS.filter((r) => r.business_id === businessId);
  }
  const repo = await loadRepository();
  const rows = await repo.fetchReviewRows(businessId);
  const names = await repo.fetchReviewAuthorNames(rows.map((r) => r.user_id));
  return rows.map((r) => rowToReview(r, names));
}

export async function getCategories(): Promise<Category[]> {
  if (activeSource() === 'sample') return SAMPLE_CATEGORIES;
  const repo = await loadRepository();
  const rows = await repo.fetchCategoryRows();
  return rows.map(rowToCategory);
}

/** Admin queue. Passing a status narrows the list. RLS returns nothing to non-admins. */
export async function listVerificationRequests(
  status?: VerificationStatus,
): Promise<VerificationRequest[]> {
  if (activeSource() === 'sample') {
    return SAMPLE_VERIFICATION_REQUESTS.filter((r) => !status || r.status === status);
  }
  const repo = await loadRepository();
  const rows = await repo.fetchVerificationRows(status);
  return rows.map(rowToVerificationRequest);
}

export function businessPath(slug: string): string {
  return `/business/${slug}`;
}
