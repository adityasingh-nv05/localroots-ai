'use client';

import { useEffect } from 'react';
import ErrorState from '@/components/ui/ErrorState';

export default function BusinessError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <ErrorState
        title="This profile couldn't load"
        message="Something went wrong while loading the business. Please try again."
        onRetry={reset}
      />
    </div>
  );
}
