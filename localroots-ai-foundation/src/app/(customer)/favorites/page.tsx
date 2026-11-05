import FavoritesView from '@/components/favorites/FavoritesView';
import { listBusinesses } from '@/lib/services/business-service';

export const metadata = { title: 'Saved businesses' };

export default async function FavoritesPage() {
  const businesses = await listBusinesses();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Saved businesses</h1>
        <p className="mt-2 text-gray-500">Your favourites are kept in this browser only.</p>
      </header>
      <FavoritesView businesses={businesses} />
    </div>
  );
}
