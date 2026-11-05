import Link from 'next/link';
import { Heart } from 'lucide-react';
import BusinessListingCard from '@/components/business/BusinessListingCard';
import ExploreFilters from '@/components/explore/ExploreFilters';
import LocationChips from '@/components/explore/LocationChips';
import DataSourceNotice from '@/components/ui/DataSourceNotice';
import EmptyState from '@/components/ui/EmptyState';
import { KARNATAKA_LOCATIONS, findKarnatakaLocation } from '@/lib/data/locations';
import {
  getCategories,
  getLocationCounts,
  listBusinesses,
} from '@/lib/services/business-service';
import { isBusinessSort, isCategorySlug, type BusinessFilters } from '@/types';

export const metadata = { title: 'Explore' };

type SearchParamValue = string | string[] | undefined;

interface ExplorePageProps {
  searchParams: Promise<Record<string, SearchParamValue>>;
}

/** Query strings can repeat (?q=a&q=b). Use the first value only. */
function firstValue(value: SearchParamValue): string {
  const v = Array.isArray(value) ? value[0] : value;
  return v?.trim() ?? '';
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const params = await searchParams;

  const q = firstValue(params.q);
  const categoryParam = firstValue(params.category);
  const locationParam = firstValue(params.location);
  const sortParam = firstValue(params.sort);

  // Unknown values are ignored rather than causing errors.
  const category = isCategorySlug(categoryParam) ? categoryParam : undefined;
  const location = findKarnatakaLocation(locationParam)?.slug;
  const sort = isBusinessSort(sortParam) ? sortParam : 'popular';

  const filters: BusinessFilters = { query: q || undefined, category, location, sort };

  const [businesses, categories, counts] = await Promise.all([
    listBusinesses(filters),
    getCategories(),
    getLocationCounts(),
  ]);

  const activeLocation = findKarnatakaLocation(location);
  const keep = { q, category: category ?? '', sort };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Explore Local Businesses</h1>
          <p className="mt-2 text-gray-500">Find artisans, shops, food vendors and more across Karnataka.</p>
        </div>
        <Link
          href="/favorites"
          className="inline-flex items-center gap-2 self-start rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:border-rose-200 hover:text-rose-600"
        >
          <Heart size={16} aria-hidden="true" /> Saved businesses
        </Link>
      </header>

      <DataSourceNotice />

      <section aria-labelledby="karnataka-heading" className="mb-8 space-y-3">
        <h2 id="karnataka-heading" className="text-sm font-semibold uppercase tracking-wide text-amber-700">
          Explore Karnataka
        </h2>
        <LocationChips
          locations={KARNATAKA_LOCATIONS}
          counts={counts}
          activeSlug={location}
          keep={keep}
        />
      </section>

      <div className="mb-8">
        <ExploreFilters
          values={{ q, category: category ?? '', location: location ?? '', sort }}
          categories={categories}
          locations={KARNATAKA_LOCATIONS}
        />
      </div>

      <p className="mb-6 text-sm text-gray-500" aria-live="polite">
        {businesses.length} {businesses.length === 1 ? 'listing' : 'listings'}
        {activeLocation && <> in {activeLocation.name}</>}
        {q && <> matching &ldquo;{q}&rdquo;</>}
      </p>

      {businesses.length === 0 ? (
        <EmptyState
          title="No listings match your filters"
          description="Try a different keyword, another location, or reset the filters to see everything."
          action={
            <Link href="/explore" className="rounded-lg bg-green-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-800">
              Reset filters
            </Link>
          }
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {businesses.map((b) => (
            <BusinessListingCard key={b.id} business={b} />
          ))}
        </div>
      )}
    </div>
  );
}
