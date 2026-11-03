import Link from 'next/link';
import { Leaf } from 'lucide-react';

// Only routes that exist or on-page anchors are listed, so no link leads to a 404.
const FOOTER_LINKS = {
  Discover: [
    { href: '/explore', label: 'Explore Businesses' },
    { href: '/#categories', label: 'Categories' },
    { href: '/#experiences', label: 'Cultural Experiences' },
    { href: '/#search', label: 'Search' },
  ],
  'For Businesses': [
    { href: '/vendors', label: 'List Your Business' },
    { href: '/#for-businesses', label: 'Why join' },
    { href: '/auth/register', label: 'Create an account' },
  ],
  Account: [
    { href: '/auth/login', label: 'Login' },
    { href: '/auth/register', label: 'Sign Up' },
    { href: '/about', label: 'About Us' },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <Link href="/" className="flex items-center gap-2" aria-label="LocalRoots AI home">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-700 text-white">
                <Leaf size={16} strokeWidth={2.5} aria-hidden="true" />
              </span>
              <span className="text-lg font-bold text-green-800">
                LocalRoots<span className="text-amber-600"> AI</span>
              </span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-gray-500">
              Karnataka-first platform connecting customers with local businesses, artisans and
              cultural destinations across India.
            </p>
          </div>

          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section}>
              <h3 className="mb-3 text-sm font-semibold text-gray-900">{section}</h3>
              <ul className="space-y-2">
                {links.map(({ href, label }) => (
                  <li key={`${section}-${label}`}>
                    <Link
                      href={href}
                      className="text-sm text-gray-500 transition-colors hover:text-green-700"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center gap-2 border-t border-gray-200 pt-6 text-center text-xs text-gray-400">
          <p>
            © {new Date().getFullYear()} LocalRoots AI. Made with ❤️ for Karnataka &amp; India.
          </p>
          <p>Sample listings on this site are demo data and are not verified businesses.</p>
        </div>
      </div>
    </footer>
  );
}
