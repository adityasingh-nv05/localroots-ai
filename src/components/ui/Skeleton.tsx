/** Animated placeholder block used while data loads. */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-gray-200 ${className}`} aria-hidden="true" />;
}

export function ListingCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-5" role="status" aria-label="Loading listing">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="mt-4 h-5 w-2/3" />
      <Skeleton className="mt-3 h-3 w-1/2" />
      <Skeleton className="mt-4 h-3 w-full" />
      <Skeleton className="mt-2 h-3 w-5/6" />
      <Skeleton className="mt-6 h-5 w-24 rounded-full" />
    </div>
  );
}
