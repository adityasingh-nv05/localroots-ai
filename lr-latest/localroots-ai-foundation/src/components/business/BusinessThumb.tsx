import { CATEGORY_LABELS } from '@/lib/data/categories';
import type { CategorySlug } from '@/types';
import { CATEGORY_BG } from './category-style';

interface BusinessThumbProps {
  src: string | undefined;
  alt: string;
  category: CategorySlug;
}

/** Photo when available, otherwise a category-coloured placeholder. */
export default function BusinessThumb({ src, alt, category }: BusinessThumbProps) {
  if (src) {
    return (
      <div className="h-44 overflow-hidden bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element -- URLs will come from Supabase Storage */}
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
    );
  }
  return (
    <div className={`flex h-44 items-center justify-center ${CATEGORY_BG[category]}`} aria-hidden="true">
      <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-gray-700">
        {CATEGORY_LABELS[category]}
      </span>
    </div>
  );
}
