import Link from 'next/link';
import EmptyState from '@/components/ui/EmptyState';

export default function BusinessNotFound() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <EmptyState
        title="Business not found"
        description="This listing may have been removed or the link is incorrect."
        action={
          <Link href="/explore" className="rounded-lg bg-green-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-800">
            Browse listings
          </Link>
        }
      />
    </div>
  );
}
