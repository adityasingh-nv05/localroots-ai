import { Bot, BadgeCheck, CreditCard, ListChecks, Users } from 'lucide-react';
import AccessNotice from '@/components/dashboard/AccessNotice';
import ModuleCard from '@/components/dashboard/ModuleCard';
import { getCurrentUser } from '@/lib/auth/session';
import { isSupabaseConfigured } from '@/lib/config/env';

export const metadata = { title: 'Admin Dashboard' };

const MODULES = [
  { icon: BadgeCheck, title: 'Verification queue', description: 'Review submitted documents and approve or reject verification.' },
  { icon: ListChecks, title: 'Listing moderation', description: 'Hide or correct listings that break the guidelines.' },
  { icon: Users, title: 'Users and roles', description: 'View accounts and assign customer, vendor or admin roles.' },
  { icon: CreditCard, title: 'Subscriptions', description: 'Overview of plans and statuses. Not connected to billing.' },
  { icon: Bot, title: 'AI task log', description: 'Track AI jobs, their status and any errors.' },
];

export default async function AdminDashboardPage() {
  const [user, configured] = [await getCurrentUser(), isSupabaseConfigured()];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin dashboard</h1>
        <p className="mt-2 text-gray-500">Moderation and verification tools. Admin access only.</p>
      </header>

      <AccessNotice configured={configured} signedIn={user !== null} area="admin dashboard" />

      <h2 className="mb-4 mt-10 text-lg font-semibold text-gray-900">Planned features</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {MODULES.map((m) => (
          <ModuleCard key={m.title} icon={m.icon} title={m.title} description={m.description} />
        ))}
      </div>
    </div>
  );
}
