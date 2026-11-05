import { Star } from 'lucide-react';
import type { Review } from '@/types';
import { summariseRatings } from '@/lib/utils/ratings';

export default function RatingSummary({ reviews }: { reviews: readonly Review[] }) {
  const summary = summariseRatings(reviews);
  if (summary.count === 0) return null;

  return (
    <div className="grid gap-6 rounded-2xl border border-gray-200 bg-white p-6 sm:grid-cols-[auto_1fr] sm:items-center">
      <div className="text-center sm:pr-6">
        <p className="text-4xl font-bold text-gray-900">{summary.average.toFixed(1)}</p>
        <p className="mt-1 flex items-center justify-center gap-1 text-amber-500">
          <Star size={14} className="fill-amber-400" aria-hidden="true" />
          <Star size={14} className="fill-amber-400" aria-hidden="true" />
          <Star size={14} className="fill-amber-400" aria-hidden="true" />
          <Star size={14} className="fill-amber-400" aria-hidden="true" />
          <Star size={14} className="fill-amber-400" aria-hidden="true" />
        </p>
        <p className="mt-1 text-xs text-gray-500">{summary.count} {summary.count === 1 ? 'review' : 'reviews'}</p>
      </div>
      <ul className="space-y-2" aria-label="Rating breakdown">
        {summary.bars.map((bar) => (
          <li key={bar.stars} className="flex items-center gap-3 text-xs text-gray-600">
            <span className="w-8 shrink-0">{bar.stars} star</span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
              <span className="block h-full rounded-full bg-amber-400" style={{ width: `${bar.percent}%` }} />
            </span>
            <span className="w-8 shrink-0 text-right text-gray-500">{bar.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
