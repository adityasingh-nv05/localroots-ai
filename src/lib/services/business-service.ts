/**
 * Service layer: the only place pages get business data from.
 * Today these functions read SAMPLE_* arrays. When Supabase is connected, replace
 * the function bodies with queries. Pages and components will not need to change.
 * See docs/ARCHITECTURE.md.
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
import {
  SAMPLE_BUSINESSES,
  SAMPLE_CATEGORIES,
  SAMPLE_PRODUCTS,
  SAMPLE_REVIEWS,
  SAMPLE_VERIFICATION_REQUESTS,
} from '@/lib/data/sample-data';

const norm = (value: string) => value.trim().toLowerCase();

function sameText(a: string, b: string): boolean {
  return norm(a) === norm(b);
}

export async function listBusinesses(filters: BusinessFilters = {}): Promise<Business[]> {
  const terms = filters.query ? norm(filters.query).split(/\s+/).filter(Boolean) : [];

  return SAMPLE_BUSINESSES.filter((b) => {
    if (!b.is_active) return false;

    if (terms.length > 0) {
      const haystack = norm([b.name, b.description, b.city, b.district, b.state, ...b.tags].join(' '));
      if (!terms.every((t) => haystack.includes(t))) return false;
    }
    if (filters.category && b.category !== filters.category) return false;
    if (filters.state && !sameText(b.state, filters.state)) return false;
    if (filters.district && !sameText(b.district, filters.district)) return false;
    if (filters.city && !sameText(b.city, filters.city)) return false;
    if (filters.verifiedOnly && b.verification_status !== 'verified') return false;
    if (filters.minRating !== undefined && b.rating_average < filters.minRating) return false;

    return true;
  }).sort((a, b) => b.rating_average - a.rating_average);
}

export async function getBusinessBySlug(slug: string): Promise<Business | null> {
  return SAMPLE_BUSINESSES.find((b) => b.slug === slug && b.is_active) ?? null;
}

export async function getProductsForBusiness(businessId: string): Promise<Product[]> {
  return SAMPLE_PRODUCTS.filter((p) => p.business_id === businessId);
}

export async function getReviewsForBusiness(businessId: string): Promise<Review[]> {
  return SAMPLE_REVIEWS.filter((r) => r.business_id === businessId);
}

export async function getCategories(): Promise<Category[]> {
  return SAMPLE_CATEGORIES;
}

/** Admin queue. Passing a status narrows the list. */
export async function listVerificationRequests(
  status?: VerificationStatus,
): Promise<VerificationRequest[]> {
  return SAMPLE_VERIFICATION_REQUESTS.filter((r) => !status || r.status === status);
}

export function businessPath(slug: string): string {
  return `/business/${slug}`;
}
