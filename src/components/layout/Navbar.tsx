'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Landmark, Leaf, Menu, Palette, Store, X, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV_LINKS: NavItem[] = [
  { href: '/explore', label: 'Explore', icon: Compass },
  { href: '/#categories', label: 'Categories', icon: Palette },
  { href: '/#experiences', label: 'Cultural Experiences', icon: Landmark },
  { href: '/vendors', label: 'For Businesses', icon: Store },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Hash links point at the homepage sections; only real routes can be "active".
  const isActive = (href: string) =>
    !href.includes('#') && (pathname === href || pathname.startsWith(href + '/'));

  return (
    <header className="sticky top-0 z-50 w-full border-b border-amber-100 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75">
      <nav
        aria-label="Main"
        className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
      >
        <Link href="/" className="group flex items-center gap-2" aria-label="LocalRoots AI home">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-700 text-white transition-transform group-hover:scale-105">
            <Leaf size={16} strokeWidth={2.5} aria-hidden="true" />
          </span>
          <span className="text-lg font-bold tracking-tight text-green-800">
            LocalRoots<span className="text-amber-600"> AI</span>
          </span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive(href) ? 'page' : undefined}
                className={cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive(href)
                    ? 'bg-green-50 text-green-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-green-700',
                )}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Desktop CTAs */}
        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/auth/login"
            className="rounded-md px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-green-700"
          >
            Login
          </Link>
          <Link
            href="/auth/register"
            className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-800"
          >
            Sign Up
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          onClick={() => setMobileOpen((v) => !v)}
          className="inline-flex items-center justify-center rounded-md p-2 text-gray-600 transition-colors hover:bg-gray-100 lg:hidden"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div id="mobile-menu" className="border-t border-gray-100 bg-white px-4 pb-5 lg:hidden">
          <ul className="mt-2 space-y-1">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={isActive(href) ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive(href)
                      ? 'bg-green-50 text-green-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-green-700',
                  )}
                >
                  <Icon size={16} aria-hidden="true" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-gray-100 pt-4">
            <Link
              href="/auth/login"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Login
            </Link>
            <Link
              href="/auth/register"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg bg-green-700 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-green-800"
            >
              Sign Up
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
