'use client';

import Link from 'next/link';
import type { Business } from '@/types';
import BusinessListingCard from '@/components/business/BusinessListingCard';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import { ListingCardSkeleton } from '@/components/ui/Skeleton';
import { isFavoritesStorageAvailable, useFavorites, useIsHydrated } from '@/lib/favorites/use-favorites';

/**
 * Shows saved businesses. The server sends the full list; this component keeps
 * only the ids saved in this browser. Loading, blocked-storage and empty states are handled here.
 */
export default function FavoritesView({ businesses }: { businesses: Business[] }) {
  const hydrated = useIsHydrated();
  const { ids, count, clear } = useFavorites();

  if (!hydrated) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
        {Array.from({ length: 3 }, (_, i) => (
          <ListingCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!isFavoritesStorageAvailable()) {
    return (
      <ErrorState
        title="Favourites can't be saved here"
        message="This browser is blocking site data, so saved businesses can't be stored. Allow site data for this site and try again."
      />
    );
  }

  const saved = businesses.filter((b) => ids.includes(b.id));

  if (saved.length === 0) {
    return (
      <EmptyState
        title="No favourites yet"
        description="Tap Save on any business to keep it here. Favourites are stored in this browser only."
        action={
          <Link href="/explore" className="rounded-lg bg-green-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-800">
            Explore businesses
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500" aria-live="polite">
          {saved.length} saved {saved.length === 1 ? 'business' : 'businesses'}
          {count > saved.length && <span className="text-gray-400"> ({count - saved.length} no longer listed)</span>}
        </p>
        <button
          type="button"
          onClick={() => {
            if (window.confirm('Remove all saved businesses from this browser?')) clear();
          }}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          Clear all
        </button>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {saved.map((b) => (
          <BusinessListingCard key={b.id} business={b} />
        ))}
      </div>
    </div>
  );
}
