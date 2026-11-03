import Link from 'next/link';
import { categoryName, type DemoProduct } from '@/lib/data/demo';
import { TONE_BG } from '@/components/ui/tones';
import DemoBadge from '@/components/ui/DemoBadge';

export default function ProductCard({ product }: { product: DemoProduct }) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className={`relative flex h-40 items-center justify-center ${TONE_BG[product.tone]}`} aria-hidden="true">
        <span className="absolute left-4 top-4">
          <DemoBadge />
        </span>
        <span className="text-5xl drop-shadow-sm transition-transform duration-300 group-hover:scale-110">
          {product.category === 'food' ? '🌶️' : product.category === 'fashion' ? '🧵' : product.category === 'accessories' ? '👜' : '🪔'}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
          {categoryName(product.category)}
        </p>
        <h3 className="mt-1 font-semibold leading-snug text-gray-900">
          <Link
            href={`/explore?q=${encodeURIComponent(product.name)}`}
            className="after:absolute after:inset-0 focus-visible:outline-none"
          >
            {product.name}
          </Link>
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          by {product.maker} · {product.city}
        </p>
        <p className="mt-auto pt-4 text-lg font-bold text-gray-900">
          ₹{product.price.toLocaleString('en-IN')}
        </p>
      </div>
    </article>
  );
}
