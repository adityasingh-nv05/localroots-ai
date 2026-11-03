import Link from 'next/link';
import { MapPin, Star } from 'lucide-react';
import { categoryName, type DemoBusiness } from '@/lib/data/demo';
import { TONE_BG } from '@/components/ui/tones';
import DemoBadge from '@/components/ui/DemoBadge';
import { formatRating } from '@/lib/utils/format';

export default function BusinessCard({ business }: { business: DemoBusiness }) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className={`relative h-36 ${TONE_BG[business.tone]}`} aria-hidden="true">
        <span className="absolute left-4 top-4">
          <DemoBadge />
        </span>
        <span className="absolute bottom-3 right-4 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-gray-700">
          {categoryName(business.category)}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-gray-900 transition-colors group-hover:text-green-700">
            <Link
              href={`/explore?q=${encodeURIComponent(business.name)}`}
              className="after:absolute after:inset-0 focus-visible:outline-none"
            >
              {business.name}
            </Link>
          </h3>
          <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-amber-600">
            <Star size={14} className="fill-amber-400 text-amber-500" aria-hidden="true" />
            {formatRating(business.rating)}
          </span>
        </div>
        <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
          <MapPin size={12} aria-hidden="true" />
          {business.city}, {business.district}
        </p>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-gray-600">{business.summary}</p>
        <p className="mt-4 text-xs text-gray-400">{business.reviews} sample reviews</p>
      </div>
    </article>
  );
}
