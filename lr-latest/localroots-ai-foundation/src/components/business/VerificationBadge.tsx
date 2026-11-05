import { BadgeCheck, Clock, XCircle, type LucideIcon } from 'lucide-react';
import type { VerificationStatus } from '@/types';

/**
 * Only 'verified' gets the positive badge. Everything else is shown neutrally,
 * so nothing implies a listing is verified when it is not.
 */
const STATES: Record<VerificationStatus, { label: string; className: string; icon: LucideIcon }> = {
  verified: { label: 'Verified', className: 'bg-green-100 text-green-800', icon: BadgeCheck },
  pending: { label: 'Verification pending', className: 'bg-amber-100 text-amber-800', icon: Clock },
  rejected: { label: 'Not approved', className: 'bg-red-100 text-red-700', icon: XCircle },
  unverified: { label: 'Not verified', className: 'bg-gray-100 text-gray-600', icon: Clock },
};

export default function VerificationBadge({ status }: { status: VerificationStatus }) {
  const { label, className, icon: Icon } = STATES[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}>
      <Icon size={12} aria-hidden="true" />
      {label}
    </span>
  );
}
