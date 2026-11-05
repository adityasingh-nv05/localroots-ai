import { Lock } from 'lucide-react';

interface AccessNoticeProps {
  configured: boolean;
  signedIn: boolean;
  area: string;
}

/** Explains honestly why a protected area is locked. Never implies data is live. */
export default function AccessNotice({ configured, signedIn, area }: AccessNoticeProps) {
  let title = 'Sign-in required';
  let message = `Authentication is not connected yet, so the ${area} cannot show your data.`;

  if (!configured) {
    title = 'Backend not configured';
    message = 'Add your Supabase keys to .env.local (see .env.example). This area stays locked until then.';
  } else if (!signedIn) {
    message = `You are not signed in. Sign-in is not connected yet, so the ${area} stays locked.`;
  }

  return (
    <div role="status" className="flex gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <Lock size={20} className="mt-0.5 shrink-0 text-amber-700" aria-hidden="true" />
      <div>
        <h2 className="font-semibold text-amber-900">{title}</h2>
        <p className="mt-1 text-sm text-amber-800">{message}</p>
      </div>
    </div>
  );
}
