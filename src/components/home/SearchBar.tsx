'use client';

import { useState, type FormEvent, type KeyboardEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, Search, ShoppingBag, Store, type LucideIcon } from 'lucide-react';
import { searchDemo, type SearchResult } from '@/lib/data/demo';

const KIND_ICON: Record<SearchResult['kind'], LucideIcon> = {
  business: Store,
  product: ShoppingBag,
  location: MapPin,
};

export default function SearchBar({ className = '' }: { className?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const results = searchDemo(query);
  const showPanel = open && query.trim().length > 0;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setOpen(false);
    router.push(`/explore?q=${encodeURIComponent(q)}`);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      const target = results[activeIndex];
      setOpen(false);
      router.push(target.href);
    }
  }

  return (
    <div
      className={`relative mx-auto w-full max-w-xl ${className}`}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <form role="search" onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="search"
            aria-label="Search businesses, products and locations"
            placeholder="Search businesses, products, locations…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(-1);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            aria-controls="search-results"
            autoComplete="off"
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm shadow-sm transition focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
          />
        </div>
        <button
          type="submit"
          className="flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-green-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
        >
          Search
        </button>
      </form>

      {showPanel && (
        <div
          id="search-results"
          className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white text-left shadow-xl"
        >
          {results.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {results.map((r, i) => {
                const Icon = KIND_ICON[r.kind];
                return (
                  <li key={`${r.kind}-${r.title}`}>
                    <Link
                      href={r.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-green-50 ${
                        i === activeIndex ? 'bg-green-50' : ''
                      }`}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-700">
                        <Icon size={16} />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-gray-900">
                          {r.title}
                        </span>
                        <span className="block truncate text-xs text-gray-500">{r.subtitle}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="px-4 py-4 text-sm text-gray-500">
              No demo matches. Press Search to look across all listings.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
