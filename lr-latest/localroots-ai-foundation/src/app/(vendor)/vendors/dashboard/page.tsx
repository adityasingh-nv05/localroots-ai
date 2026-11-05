import { Bot, BadgeCheck, Box, CreditCard, MessageSquare, Store } from 'lucide-react';
import AccessNotice from '@/components/dashboard/AccessNotice';
import ModuleCard from '@/components/dashboard/ModuleCard';
import { getCurrentUser } from '@/lib/auth/session';
import { isSupabaseConfigured } from '@/lib/config/env';

export const metadata = { title: 'Vendor Dashboard' };

const MODULES = [
  { icon: Store, title: 'My listings', description: 'Create and edit your business profile, photos and contact details.' },
  { icon: Box, title: 'Products', description: 'Add products with prices and availability.' },
  { icon: BadgeCheck, title: 'Verification', description: 'Request a review. Only admins can approve verification.' },
  { icon: CreditCard, title: 'Subscription', description: 'Plan details. Billing is not connected, so no payments are taken.' },
  { icon: MessageSquare, title: 'Reviews', description: 'Read customer reviews for your business.' },
  { icon: Bot, title: 'AI assistant', description: 'Drafts for descriptions and tags. No AI provider is connected yet.' },
];

export default async function VendorDashboardPage() {
  const [user, configured] = [await getCurrentUser(), isSupabaseConfigured()];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Vendor dashboard</h1>
        <p className="mt-2 text-gray-500">Manage your business presence on LocalRoots AI.</p>
      </header>

      <AccessNotice configured={configured} signedIn={user !== null} area="vendor dashboard" />

      <h2 className="mb-4 mt-10 text-lg font-semibold text-gray-900">Planned features</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {MODULES.map((m) => (
          <ModuleCard key={m.title} icon={m.icon} title={m.title} description={m.description} />
        ))}
      </div>
    </div>
  );
}
