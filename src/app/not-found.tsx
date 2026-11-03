import Link from 'next/link';
import { Leaf } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <Leaf size={48} className="mb-4 text-green-600 opacity-50" />
      <h1 className="text-4xl font-extrabold text-gray-900">404</h1>
      <p className="mt-2 text-gray-500">Page not found. Looks like this root doesn&#39;t exist.</p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-green-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-800 transition-colors"
      >
        Back to Home
      </Link>
    </div>
  );
}
