import Link from 'next/link';
import BusinessListingCard from '@/components/business/BusinessListingCard';
import EmptyState from '@/components/ui/EmptyState';
import { getCategories, listBusinesses } from '@/lib/services/business-service';
import { isCategorySlug, type BusinessFilters } from '@/types';

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
  const query = firstValue(params.q);
  const categoryParam = firstValue(params.category);
  const category = isCategorySlug(categoryParam) ? categoryParam : undefined;

  const filters: BusinessFilters = { query: query || undefined, category };
  const [businesses, categories] = await Promise.all([listBusinesses(filters), getCategories()]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Explore Local Businesses</h1>
        <p className="mt-2 text-gray-500">Find artisans, shops, food vendors and more across Karnataka.</p>
      </header>

      <form action="/explore" method="get" className="mb-8 grid gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_220px_auto]">
        <label className="sr-only" htmlFor="q">Search businesses</label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Search by name, product or place"
          className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
        />
        <label className="sr-only" htmlFor="category">Category</label>
        <select
          id="category"
          name="category"
          defaultValue={category ?? ''}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-green-700 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-800"
        >
          Apply
        </button>
      </form>

      <p className="mb-4 text-sm text-gray-500" aria-live="polite">
        {businesses.length} {businesses.length === 1 ? 'listing' : 'listings'} found
        <span className="text-gray-400"> · sample data</span>
      </p>

      {businesses.length === 0 ? (
        <EmptyState
          title="No listings match your search"
          description="Try a different keyword or clear the filters to see everything."
          action={
            <Link href="/explore" className="rounded-lg bg-green-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-800">
              Clear filters
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
