import { Skeleton } from '@/components/ui/Skeleton';

export default function BusinessLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8" role="status" aria-label="Loading business">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-6 h-4 w-24" />
      <Skeleton className="mt-3 h-10 w-2/3" />
      <Skeleton className="mt-4 h-4 w-1/2" />
      <Skeleton className="mt-8 h-72 w-full rounded-2xl" />
      <Skeleton className="mt-10 h-32 w-full rounded-2xl" />
    </div>
  );
}
