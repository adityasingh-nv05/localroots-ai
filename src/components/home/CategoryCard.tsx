import Link from 'next/link';
import { ArrowRight, Coffee, Gem, Landmark, Palette, Shirt, Wrench, type LucideIcon } from 'lucide-react';
import type { CategoryId } from '@/lib/data/demo';

const ICONS: Record<CategoryId, LucideIcon> = {
  food: Coffee,
  fashion: Shirt,
  handicrafts: Palette,
  accessories: Gem,
  services: Wrench,
  tourism: Landmark,
};

interface CategoryCardProps {
  id: CategoryId;
  label: string;
  blurb: string;
}

export default function CategoryCard({ id, label, blurb }: CategoryCardProps) {
  const Icon = ICONS[id];
  return (
    <Link
      href={`/explore?category=${id}`}
      className="group relative flex h-full flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-green-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-700 transition-colors group-hover:bg-green-700 group-hover:text-white">
        <Icon size={22} aria-hidden="true" />
      </span>
      <div>
        <h3 className="font-semibold text-gray-900">{label}</h3>
        <p className="mt-1 text-sm leading-snug text-gray-500">{blurb}</p>
      </div>
      <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-green-700">
        Browse <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
