import { MapPin } from 'lucide-react';

export const metadata = { title: 'Map View' };

export default function MapPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="mb-4 text-3xl font-bold text-gray-900">Map View</h1>
      <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-24 text-center">
        <MapPin size={40} className="mx-auto mb-4 text-gray-300" />
        <p className="text-sm text-gray-400">Interactive map coming soon.</p>
      </div>
    </div>
  );
}
