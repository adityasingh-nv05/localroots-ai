import Link from 'next/link';
import type { Category, KarnatakaLocation } from '@/types';

export interface ExploreFilterValues {
  q: string;
  category: string;
  location: string;
  sort: string;
}

interface ExploreFiltersProps {
  values: ExploreFilterValues;
  categories: Category[];
  locations: readonly KarnatakaLocation[];
}

const SELECT_CLASS =
  'rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200';

/** Plain GET form, so filters work without JavaScript and are shareable as URLs. */
export default function ExploreFilters({ values, categories, locations }: ExploreFiltersProps) {
  const hasFilters = Boolean(values.q || values.category || values.location || values.sort !== 'popular');

  return (
    <form
      action="/explore"
      method="get"
      className="grid gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_1fr_auto]"
    >
      <label className="sr-only" htmlFor="q">Search by name, product, category or place</label>
      <input
        id="q"
        name="q"
        type="search"
        defaultValue={values.q}
        placeholder="Name, product, category or place"
        className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 md:col-span-2 xl:col-span-1"
      />

      <label className="sr-only" htmlFor="category">Category</label>
      <select id="category" name="category" defaultValue={values.category} className={SELECT_CLASS}>
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.slug} value={c.slug}>{c.name}</option>
        ))}
      </select>

      <label className="sr-only" htmlFor="location">Location</label>
      <select id="location" name="location" defaultValue={values.location} className={SELECT_CLASS}>
        <option value="">All of Karnataka</option>
        {locations.map((loc) => (
          <option key={loc.slug} value={loc.slug}>{loc.name}</option>
        ))}
      </select>

      <label className="sr-only" htmlFor="sort">Sort by</label>
      <select id="sort" name="sort" defaultValue={values.sort} className={SELECT_CLASS}>
        <option value="popular">Most popular</option>
        <option value="rating">Highest rated</option>
      </select>

      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 rounded-lg bg-green-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-800"
        >
          Apply
        </button>
        {hasFilters && (
          <Link
            href="/explore"
            className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Reset
          </Link>
        )}
      </div>
    </form>
  );
}
