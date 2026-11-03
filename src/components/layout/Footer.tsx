import Link from 'next/link';
import { Leaf, Github, Twitter, Instagram } from 'lucide-react';

const FOOTER_LINKS = {
  Discover: [
    { href: '/explore', label: 'Explore Businesses' },
    { href: '/map', label: 'Map View' },
    { href: '/categories', label: 'Categories' },
    { href: '/districts', label: 'Districts' },
  ],
  Vendors: [
    { href: '/vendors', label: 'List Your Business' },
    { href: '/vendors/pricing', label: 'Pricing' },
    { href: '/vendors/dashboard', label: 'Vendor Dashboard' },
  ],
  Company: [
    { href: '/about', label: 'About Us' },
    { href: '/blog', label: 'Blog' },
    { href: '/contact', label: 'Contact' },
    { href: '/privacy', label: 'Privacy Policy' },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-700 text-white">
                <Leaf size={16} strokeWidth={2.5} />
              </span>
              <span className="text-lg font-bold text-green-800">
                LocalRoots<span className="text-amber-600"> AI</span>
              </span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed">
              Karnataka-first platform connecting customers with local
              businesses, artisans, and cultural destinations across India.
            </p>
            <div className="flex gap-3 pt-1">
              {[
                { icon: Github, href: 'https://github.com' },
                { icon: Twitter, href: 'https://twitter.com' },
                { icon: Instagram, href: 'https://instagram.com' },
              ].map(({ icon: Icon, href }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-green-700 transition-colors"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section}>
              <h3 className="mb-3 text-sm font-semibold text-gray-900">{section}</h3>
              <ul className="space-y-2">
                {links.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-sm text-gray-500 hover:text-green-700 transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-gray-200 pt-6 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} LocalRoots AI. Made with ❤️ for Karnataka & India.
        </div>
      </div>
    </footer>
  );
}
