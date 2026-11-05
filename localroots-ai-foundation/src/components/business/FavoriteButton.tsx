'use client';

import { Heart } from 'lucide-react';
import { useFavorites } from '@/lib/favorites/use-favorites';

interface FavoriteButtonProps {
  businessId: string;
  businessName: string;
  className?: string;
}

/** Save or unsave a business in this browser. Safe to place on top of a card link. */
export default function FavoriteButton({ businessId, businessName, className = '' }: FavoriteButtonProps) {
  const { isFavorite, toggle } = useFavorites();
  const saved = isFavorite(businessId);

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `Remove ${businessName} from favourites` : `Save ${businessName} to favourites`}
      onClick={() => toggle(businessId)}
      className={`relative z-10 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm backdrop-blur transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 ${
        saved ? 'bg-rose-500 text-white hover:bg-rose-600' : 'bg-white/90 text-gray-700 hover:bg-white'
      } ${className}`}
    >
      <Heart size={14} className={saved ? 'fill-current' : ''} aria-hidden="true" />
      {saved ? 'Saved' : 'Save'}
    </button>
  );
}
