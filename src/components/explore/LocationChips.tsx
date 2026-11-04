import Link from 'next/link';
import { MapPin } from 'lucide-react';
import type { KarnatakaLocation } from '@/types';

interface LocationChipsProps {
  locations: readonly KarnatakaLocation[];
  counts: Record<string, number>;
  activeSlug: string | undefined;
  /** Other filters to keep when a location is chosen, e.g. { q, category, sort }. */
  keep: Record<string, string>;
}

function buildHref(keep: Record<string, string>, location: string | undefined): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(keep)) {
    if (value && key !== 'location') params.set(key, value);
  }
  if (location) params.set('location', location);
  const qs = params.toString();
  return qs ? `/explore?${qs}` : '/explore';
}

/** Karnataka exploration: one chip per sample location with its listing count. */
export default function LocationChips({ locations, counts, activeSlug, keep }: LocationChipsProps) {
  return (
    <nav aria-label="Explore Karnataka locations">
      <ul className="flex gap-3 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-visible">
        <li className="shrink-0">
          <Link
            href={buildHref(keep, undefined)}
            aria-current={activeSlug ? undefined : 'true'}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              !activeSlug ? 'border-green-600 bg-green-700 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-green-300 hover:text-green-700'
            }`}
          >
            All of Karnataka
          </Link>
        </li>
        {locations.map((loc) => {
          const active = loc.slug === activeSlug;
          return (
            <li key={loc.slug} className="shrink-0">
              <Link
                href={buildHref(keep, loc.slug)}
                aria-current={active ? 'true' : undefined}
                title={loc.description}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  active ? 'border-green-600 bg-green-700 text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-green-300 hover:text-green-700'
                }`}
              >
                <MapPin size={14} aria-hidden="true" />
                {loc.name}
                <span className={active ? 'text-green-100' : 'text-gray-400'}>{counts[loc.slug] ?? 0}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
