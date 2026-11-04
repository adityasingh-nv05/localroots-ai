import Link from 'next/link';
import { MapPin, Star } from 'lucide-react';
import type { Business } from '@/types';
import { CATEGORY_LABELS } from '@/lib/data/categories';
import { businessPath } from '@/lib/services/business-service';
import { formatRating } from '@/lib/utils/format';
import VerificationBadge from './VerificationBadge';
import BusinessThumb from './BusinessThumb';
import FavoriteButton from './FavoriteButton';

export default function BusinessListingCard({ business }: { business: Business }) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="relative">
        <BusinessThumb
          src={business.images[0]}
          alt={`${business.name} photo`}
          category={business.category}
        />
        <div className="absolute right-3 top-3">
          <FavoriteButton businessId={business.id} businessName={business.name} />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
            {CATEGORY_LABELS[business.category]}
          </p>
          <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-amber-600">
            <Star size={14} className="fill-amber-400 text-amber-500" aria-hidden="true" />
            {formatRating(business.rating_average)}
            <span className="font-normal text-gray-400">({business.rating_count})</span>
          </span>
        </div>

        <h3 className="mt-2 font-semibold text-gray-900 transition-colors group-hover:text-green-700">
          <Link href={businessPath(business.slug)} className="after:absolute after:inset-0 focus-visible:outline-none">
            {business.name}
          </Link>
        </h3>

        <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
          <MapPin size={12} aria-hidden="true" />
          {business.city}, {business.district}
        </p>

        <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-gray-600">{business.description}</p>

        <div className="mt-4">
          <VerificationBadge status={business.verification_status} />
        </div>
      </div>
    </article>
  );
}
