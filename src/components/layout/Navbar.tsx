'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Leaf,
  Search,
  MapPin,
  Store,
  Info,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const NAV_LINKS = [
  { href: '/explore', label: 'Explore', icon: Search },
  { href: '/map', label: 'Map View', icon: MapPin },
  { href: '/vendors', label: 'For Vendors', icon: Store },
  { href: '/about', label: 'About', icon: Info },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-amber-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* ── Logo ── */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-700 text-white transition-transform group-hover:scale-105">
            <Leaf size={16} strokeWidth={2.5} />
          </span>
          <span className="text-lg font-bold tracking-tight text-green-800">
            LocalRoots<span className="text-amber-600"> AI</span>
          </span>
        </Link>

        {/* ── Desktop Links ── */}
        <ul className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-green-50 text-green-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-green-700',
                  )}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* ── Desktop CTAs ── */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/auth/login"
            className="text-sm font-medium text-gray-600 hover:text-green-700 transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/auth/register"
            className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-800 transition-colors"
          >
            Get Started
          </Link>
        </div>

        {/* ── Mobile Hamburger ── */}
        <button
          aria-label="Toggle menu"
          onClick={() => setMobileOpen((v) => !v)}
          className="inline-flex items-center justify-center rounded-md p-2 text-gray-600 hover:bg-gray-100 md:hidden"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* ── Mobile Drawer ── */}
      {mobileOpen && (
        <div className="border-t border-gray-100 bg-white px-4 pb-4 md:hidden">
          <ul className="mt-2 space-y-1">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + '/');
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                      active
                        ? 'bg-green-50 text-green-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-green-700',
                    )}
                  >
                    <Icon size={16} />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 flex flex-col gap-2 border-t border-gray-100 pt-4">
            <Link
              href="/auth/login"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Sign in
            </Link>
            <Link
              href="/auth/register"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg bg-green-700 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-green-800"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
