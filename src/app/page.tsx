import Link from 'next/link';
import { Search, ArrowRight, Leaf } from 'lucide-react';

const CATEGORIES = [
  { label: 'Food & Beverage', emoji: '🍛', href: '/explore?category=food_beverage' },
  { label: 'Artisan Crafts', emoji: '🪴', href: '/explore?category=artisan_craft' },
  { label: 'Retail Shops', emoji: '🛍️', href: '/explore?category=retail_shop' },
  { label: 'Cultural Tourism', emoji: '🏛️', href: '/explore?category=cultural_tourism' },
  { label: 'Agriculture', emoji: '🌾', href: '/explore?category=agriculture' },
  { label: 'Homestays', emoji: '🏡', href: '/explore?category=homestay' },
];

const STATS = [
  { value: '500+', label: 'Local Businesses' },
  { value: '30', label: 'Karnataka Districts' },
  { value: '10k+', label: 'Happy Customers' },
  { value: 'AI', label: 'Powered Discovery' },
];

export default function HomePage() {
  return (
    <>
      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-50 via-white to-amber-50 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-1.5 text-sm font-medium text-green-700">
              <Leaf size={14} /> Karnataka-first, India-wide
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Discover the{' '}
              <span className="text-green-700">local roots</span> of{' '}
              <span className="text-amber-600">India</span>
            </h1>
            <p className="mt-6 text-lg text-gray-600 sm:text-xl">
              AI-powered platform connecting you with local businesses, artisans,
              food vendors and cultural destinations — starting from Karnataka.
            </p>

            {/* Search bar */}
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <div className="relative w-full max-w-md">
                <Search
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="search"
                  placeholder="Search businesses, crafts, food…"
                  className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
                />
              </div>
              <Link
                href="/explore"
                className="flex items-center gap-2 rounded-xl bg-green-700 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-800 transition-colors whitespace-nowrap"
              >
                Explore Now <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────────────────────── */}
      <section className="border-y border-gray-100 bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <dl className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {STATS.map(({ value, label }) => (
              <div key={label} className="text-center">
                <dt className="text-3xl font-extrabold text-green-700">{value}</dt>
                <dd className="mt-1 text-sm text-gray-500">{label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── Categories ──────────────────────────────────────────────── */}
      <section className="py-16 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl text-center mb-10">
            Browse by Category
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {CATEGORIES.map(({ label, emoji, href }) => (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-6 text-center shadow-sm hover:border-green-300 hover:shadow-md transition-all group"
              >
                <span className="text-3xl">{emoji}</span>
                <span className="text-xs font-medium text-gray-700 group-hover:text-green-700 transition-colors">
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Vendor CTA ──────────────────────────────────────────────── */}
      <section className="py-16 bg-green-700">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Own a local business?
          </h2>
          <p className="mt-3 text-green-100 sm:text-lg">
            List your shop, craft studio or food stall and reach thousands of
            customers across Karnataka and beyond.
          </p>
          <Link
            href="/vendors"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-green-700 shadow-sm hover:bg-green-50 transition-colors"
          >
            List Your Business <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </>
  );
}
