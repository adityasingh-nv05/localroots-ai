/**
 * Pure filtering and sorting shared by the database and sample paths, so both behave the same.
 * No I/O here, which keeps it unit-testable.
 *
 * Text search runs in memory over the listings. That is fine for a few thousand
 * businesses. Larger datasets should move this to Postgres full-text search
 * (see docs/NEXT_STEPS.md).
 */
import type { Business, BusinessFilters, BusinessSort, Product } from '@/types';
import { CATEGORY_LABELS } from '@/lib/data/categories';
import { findKarnatakaLocation, KARNATAKA_LOCATIONS } from '@/lib/data/locations';

const norm = (value: string) => value.trim().toLowerCase();

function sameText(a: string, b: string): boolean {
  return norm(a) === norm(b);
}

/** Popular = more ratings first; rating = higher average first. Ties fall back to the other field. */
export function sortBusinesses(list: readonly Business[], sort: BusinessSort = 'popular'): Business[] {
  return [...list].sort((a, b) => {
    if (sort === 'rating') {
      return b.rating_average - a.rating_average || b.rating_count - a.rating_count;
    }
    return b.rating_count - a.rating_count || b.rating_average - a.rating_average;
  });
}

/** A business belongs to a location when its city or district is listed for that location. */
export function businessMatchesLocation(business: Business, locationSlug: string): boolean {
  const location = findKarnatakaLocation(locationSlug);
  if (!location) return true; // unknown slug: do not filter
  return (
    location.cities.some((city) => sameText(city, business.city)) ||
    location.districts.some((district) => sameText(district, business.district))
  );
}

export function filterBusinesses(
  businesses: readonly Business[],
  products: readonly Product[],
  filters: BusinessFilters = {},
): Business[] {
  const terms = filters.query ? norm(filters.query).split(/\s+/).filter(Boolean) : [];

  const productText = new Map<string, string>();
  for (const p of products) {
    productText.set(p.business_id, `${productText.get(p.business_id) ?? ''} ${p.name} ${p.description}`);
  }

  const matched = businesses.filter((b) => {
    if (!b.is_active) return false;

    if (terms.length > 0) {
      const haystack = norm(
        [
          b.name,
          b.description,
          b.city,
          b.district,
          b.state,
          CATEGORY_LABELS[b.category],
          ...b.tags,
          productText.get(b.id) ?? '',
        ].join(' '),
      );
      if (!terms.every((t) => haystack.includes(t))) return false;
    }
    if (filters.category && b.category !== filters.category) return false;
    if (filters.location && !businessMatchesLocation(b, filters.location)) return false;
    if (filters.state && !sameText(b.state, filters.state)) return false;
    if (filters.district && !sameText(b.district, filters.district)) return false;
    if (filters.city && !sameText(b.city, filters.city)) return false;
    if (filters.verifiedOnly && b.verification_status !== 'verified') return false;
    if (filters.minRating !== undefined && b.rating_average < filters.minRating) return false;
    return true;
  });

  return sortBusinesses(matched, filters.sort ?? 'popular');
}

/** Active listings per Karnataka location, keyed by location slug. */
export function countByLocation(businesses: readonly Business[]): Record<string, number> {
  const active = businesses.filter((b) => b.is_active);
  const counts: Record<string, number> = {};
  for (const loc of KARNATAKA_LOCATIONS) {
    counts[loc.slug] = active.filter((b) => businessMatchesLocation(b, loc.slug)).length;
  }
  return counts;
}
