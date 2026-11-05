import type { CategorySlug } from '@/types';

/** Gradient used when a business has no photo. Full class names so Tailwind detects them. */
export const CATEGORY_BG: Record<CategorySlug, string> = {
  food: 'bg-gradient-to-br from-amber-200 via-orange-100 to-yellow-50',
  fashion: 'bg-gradient-to-br from-rose-200 via-pink-100 to-orange-50',
  handicrafts: 'bg-gradient-to-br from-stone-300 via-stone-200 to-amber-50',
  accessories: 'bg-gradient-to-br from-yellow-200 via-amber-100 to-rose-50',
  services: 'bg-gradient-to-br from-sky-200 via-cyan-100 to-blue-50',
  tourism: 'bg-gradient-to-br from-green-200 via-emerald-100 to-lime-50',
  agriculture: 'bg-gradient-to-br from-lime-200 via-green-100 to-yellow-50',
  homestay: 'bg-gradient-to-br from-teal-200 via-green-100 to-emerald-50',
};
