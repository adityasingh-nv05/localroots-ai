import Link from 'next/link';
import { Leaf } from 'lucide-react';
import SearchBar from './SearchBar';
import RangoliMotif from './RangoliMotif';
import { POPULAR_SEARCHES } from '@/lib/data/demo';

export default function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-green-50 via-white to-amber-50">
      {/* Decorative layer is clipped separately so the search dropdown is not cut off. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <RangoliMotif className="absolute -right-28 -top-28 h-[26rem] w-[26rem] opacity-25 motion-safe:animate-spin-slow sm:opacity-30 lg:-right-20 lg:-top-24 lg:h-[36rem] lg:w-[36rem]" />
        <RangoliMotif className="absolute -bottom-36 -left-36 h-96 w-96 opacity-10 motion-safe:animate-spin-slow-reverse" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <p className="motion-safe:animate-fade-up mx-auto inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/80 px-4 py-1.5 text-sm font-medium text-green-800 shadow-sm backdrop-blur">
            <Leaf size={14} className="text-green-600" aria-hidden="true" />
            Karnataka-first · Built for all of India
          </p>

          <h1 className="motion-safe:animate-fade-up mt-6 text-4xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            Discover the Heart of{' '}
            <span className="bg-gradient-to-r from-green-700 to-amber-600 bg-clip-text text-transparent">
              Local India.
            </span>
          </h1>

          <p className="motion-safe:animate-fade-up mt-6 text-lg text-gray-600 sm:text-xl">
            Find artisans, food makers, heritage guides and small businesses, starting with the
            warmth of Karnataka.
          </p>

          <div id="search" className="motion-safe:animate-fade-up mt-8 scroll-mt-24">
            <SearchBar />
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm">
            <span className="text-gray-500">Popular:</span>
            {POPULAR_SEARCHES.map((term) => (
              <Link
                key={term}
                href={`/explore?q=${encodeURIComponent(term)}`}
                className="rounded-full border border-gray-200 bg-white px-3 py-1 text-gray-700 transition-colors hover:border-green-300 hover:text-green-700"
              >
                {term}
              </Link>
            ))}
          </div>

          <p className="mt-6 text-xs text-gray-400">
            Listings on this page are sample data for demonstration only.
          </p>
        </div>
      </div>
    </section>
  );
}
