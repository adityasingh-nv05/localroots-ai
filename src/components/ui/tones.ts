import type { Tone } from '@/lib/data/demo';

// Full class names are kept here so Tailwind can detect them at build time.
export const TONE_BG: Record<Tone, string> = {
  green: 'bg-gradient-to-br from-green-200 via-green-100 to-emerald-50',
  amber: 'bg-gradient-to-br from-amber-200 via-orange-100 to-yellow-50',
  rose: 'bg-gradient-to-br from-rose-200 via-pink-100 to-orange-50',
  sky: 'bg-gradient-to-br from-sky-200 via-cyan-100 to-blue-50',
  stone: 'bg-gradient-to-br from-stone-300 via-stone-200 to-amber-50',
};
