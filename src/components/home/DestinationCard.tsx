import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { Destination } from '@/lib/data/demo';
import { TONE_BG } from '@/components/ui/tones';

export default function DestinationCard({ destination }: { destination: Destination }) {
  const { name, region, tagline, highlights, emoji, tone } = destination;
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className={`flex h-28 items-center justify-center ${TONE_BG[tone]}`} aria-hidden="true">
        <span className="text-5xl transition-transform duration-300 group-hover:scale-110">{emoji}</span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">{region}</p>
        <h3 className="mt-1 text-lg font-bold text-gray-900">
          <Link
            href={`/explore?q=${encodeURIComponent(name)}`}
            className="after:absolute after:inset-0 focus-visible:outline-none"
          >
            {name}
          </Link>
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">{tagline}</p>
        <ul className="mt-4 space-y-1.5 text-xs text-gray-500">
          {highlights.map((h) => (
            <li key={h} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-green-600" aria-hidden="true" />
              {h}
            </li>
          ))}
        </ul>
        <span className="mt-auto inline-flex items-center gap-1 pt-5 text-sm font-medium text-green-700">
          Explore {name} <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </article>
  );
}
