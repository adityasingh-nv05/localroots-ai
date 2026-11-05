import type { ReactNode } from 'react';
import { Leaf, type LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: LucideIcon;
}

export default function EmptyState({ title, description, action, icon: Icon = Leaf }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 px-6 py-14 text-center">
      <Icon size={40} className="mx-auto mb-4 text-gray-300" aria-hidden="true" />
      <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      {description && <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
