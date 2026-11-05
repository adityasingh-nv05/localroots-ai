import { Info } from 'lucide-react';
import { currentDataSource } from '@/lib/config/env';

/** Shown only when the page is using built-in sample data (development without Supabase). */
export default function DataSourceNotice() {
  if (currentDataSource() !== 'sample') return null;
  return (
    <div role="status" className="mb-6 flex gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
      <Info size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
      <p>
        Showing built-in <strong>sample data</strong> for development. Supabase is not configured, so these listings are fictional.
      </p>
    </div>
  );
}
