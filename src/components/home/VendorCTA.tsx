import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function VendorCTA() {
  return (
    <section
      id="for-businesses"
      className="relative scroll-mt-20 overflow-hidden bg-gradient-to-br from-green-700 via-green-700 to-green-800 py-16 sm:py-20"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-amber-400/20 blur-3xl"
      />
      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Own a local business, craft studio or food stall?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base text-green-100 sm:text-lg">
          Register your business and reach customers who are looking for authentic, local
          experiences across Karnataka and beyond.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-green-800 shadow-sm transition-colors hover:bg-green-50"
          >
            Register your business <ArrowRight size={16} />
          </Link>
          <Link
            href="/vendors"
            className="inline-flex items-center gap-2 rounded-xl border border-green-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-600"
          >
            Learn about listing
          </Link>
        </div>
      </div>
    </section>
  );
}
