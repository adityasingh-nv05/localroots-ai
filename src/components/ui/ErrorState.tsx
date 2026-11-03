import { AlertTriangle } from 'lucide-react';

interface ErrorStateProps {
  title: string;
  message: string;
  onRetry?: () => void;
}

export default function ErrorState({ title, message, onRetry }: ErrorStateProps) {
  return (
    <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center">
      <AlertTriangle size={36} className="mx-auto mb-4 text-red-500" aria-hidden="true" />
      <h2 className="text-lg font-semibold text-red-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-red-700">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 rounded-lg bg-red-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-800"
        >
          Try again
        </button>
      )}
    </div>
  );
}
