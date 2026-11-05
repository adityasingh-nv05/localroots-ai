'use client';

import { useEffect } from 'react';
import ErrorState from '@/components/ui/ErrorState';

export default function ExploreError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <ErrorState
        title="We couldn't load listings"
        message="Something went wrong while loading businesses. Please try again."
        onRetry={reset}
      />
    </div>
  );
}
