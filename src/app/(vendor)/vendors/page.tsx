import { Store } from 'lucide-react';

export const metadata = { title: 'For Vendors' };

export default function VendorsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">List Your Business</h1>
      <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-16 text-center">
        <Store size={40} className="mx-auto mb-4 text-gray-300" />
        <p className="text-sm text-gray-400">Vendor onboarding flow coming soon.</p>
      </div>
    </div>
  );
}
