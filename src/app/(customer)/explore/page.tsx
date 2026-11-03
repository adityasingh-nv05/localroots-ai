import { Search } from 'lucide-react';

export const metadata = { title: 'Explore' };

export default function ExplorePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Explore Local Businesses</h1>
        <p className="mt-2 text-gray-500">Find artisans, shops, food vendors and more across Karnataka.</p>
      </div>
      <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-16 text-center">
        <Search size={40} className="mx-auto mb-4 text-gray-300" />
        <p className="text-sm text-gray-400">Listing grid — foundation is ready.</p>
      </div>
    </div>
  );
}
