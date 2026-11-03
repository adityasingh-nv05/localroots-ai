import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink, Image as ImageIcon, Mail, MapPin, Phone, Star } from 'lucide-react';
import VerificationBadge from '@/components/business/VerificationBadge';
import EmptyState from '@/components/ui/EmptyState';
import { CATEGORY_LABELS } from '@/lib/data/categories';
import {
  getBusinessBySlug,
  getProductsForBusiness,
  getReviewsForBusiness,
} from '@/lib/services/business-service';
import { formatRating } from '@/lib/utils/format';

interface BusinessPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BusinessPageProps): Promise<Metadata> {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);
  if (!business) return { title: 'Business not found' };
  return {
    title: business.name,
    description: business.description.slice(0, 160),
  };
}

export default async function BusinessProfilePage({ params }: BusinessPageProps) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);
  if (!business) notFound();

  const [products, reviews] = await Promise.all([
    getProductsForBusiness(business.id),
    getReviewsForBusiness(business.id),
  ]);

  const websiteLinks: { label: string; href: string }[] = [];
  if (business.website_url) websiteLinks.push({ label: 'Website', href: business.website_url });
  if (business.instagram_handle) {
    websiteLinks.push({
      label: 'Instagram',
      href: `https://instagram.com/${encodeURIComponent(business.instagram_handle)}`,
    });
  }
  if (business.facebook_url) websiteLinks.push({ label: 'Facebook', href: business.facebook_url });
  if (business.youtube_url) websiteLinks.push({ label: 'YouTube', href: business.youtube_url });

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <Link href="/explore" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-green-700">
        <ArrowLeft size={14} aria-hidden="true" /> Back to explore
      </Link>

      <header className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
          {CATEGORY_LABELS[business.category]}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">{business.name}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <MapPin size={14} aria-hidden="true" />
            {business.city}, {business.district}, {business.state}
          </span>
          <span className="flex items-center gap-1 font-semibold text-amber-600">
            <Star size={14} className="fill-amber-400 text-amber-500" aria-hidden="true" />
            {formatRating(business.rating_average)}
            <span className="font-normal text-gray-400">({business.rating_count} reviews)</span>
          </span>
          <VerificationBadge status={business.verification_status} />
        </div>
      </header>

      {/* Photos: plain img is used because image URLs will come from Supabase Storage. */}
      <section aria-labelledby="photos-heading" className="mt-8">
        <h2 id="photos-heading" className="sr-only">Photos</h2>
        {business.images.length === 0 ? (
          <div className="flex h-56 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 text-sm text-gray-400">
            <ImageIcon size={32} className="mb-2 text-gray-300" aria-hidden="true" />
            No photos yet
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            {business.images.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={src} src={src} alt={`${business.name} photo ${i + 1}`} className="h-48 w-full rounded-xl object-cover" />
            ))}
          </div>
        )}
      </section>

      <div className="mt-10 grid gap-10 lg:grid-cols-3">
        <div className="space-y-10 lg:col-span-2">
          <section aria-labelledby="about-heading">
            <h2 id="about-heading" className="text-xl font-semibold text-gray-900">About</h2>
            <p className="mt-3 leading-relaxed text-gray-600">{business.description}</p>
            {business.tags.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2">
                {business.tags.map((tag) => (
                  <li key={tag} className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-800">{tag}</li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="products-heading">
            <h2 id="products-heading" className="text-xl font-semibold text-gray-900">Products</h2>
            {products.length === 0 ? (
              <div className="mt-4">
                <EmptyState title="No products listed yet" description="The business has not added any products." />
              </div>
            ) : (
              <ul className="mt-4 divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white">
                {products.map((p) => (
                  <li key={p.id} className="flex items-start justify-between gap-4 p-4">
                    <div>
                      <p className="font-medium text-gray-900">{p.name}</p>
                      <p className="mt-1 text-sm text-gray-500">{p.description}</p>
                      {!p.is_available && <p className="mt-1 text-xs font-semibold text-red-600">Currently unavailable</p>}
                    </div>
                    {p.price_inr !== null && (
                      <p className="shrink-0 font-semibold text-gray-900">₹{p.price_inr.toLocaleString('en-IN')}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="reviews-heading">
            <h2 id="reviews-heading" className="text-xl font-semibold text-gray-900">Reviews</h2>
            {reviews.length === 0 ? (
              <div className="mt-4">
                <EmptyState title="No reviews yet" description="Reviews will appear here once customers post them." />
              </div>
            ) : (
              <ul className="mt-4 space-y-4">
                {reviews.map((r) => (
                  <li key={r.id} className="rounded-2xl border border-gray-200 bg-white p-5">
                    <p className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-900">{r.user_name}</span>
                      <span className="flex items-center gap-1 text-amber-600">
                        <Star size={12} className="fill-amber-400 text-amber-500" aria-hidden="true" />
                        {r.rating}/5
                      </span>
                    </p>
                    <p className="mt-2 text-sm text-gray-600">{r.comment}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section aria-labelledby="contact-heading" className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 id="contact-heading" className="font-semibold text-gray-900">Contact and links</h2>
            <ul className="mt-4 space-y-3 text-sm text-gray-600">
              <li className="flex gap-2"><MapPin size={16} className="mt-0.5 shrink-0 text-gray-400" aria-hidden="true" />{business.address}</li>
              {business.contact_phone && (
                <li className="flex gap-2"><Phone size={16} className="mt-0.5 shrink-0 text-gray-400" aria-hidden="true" />{business.contact_phone}</li>
              )}
              {business.contact_email && (
                <li className="flex gap-2"><Mail size={16} className="mt-0.5 shrink-0 text-gray-400" aria-hidden="true" />{business.contact_email}</li>
              )}
              {websiteLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-green-700 hover:underline">
                    {link.label} <ExternalLink size={12} aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
            {websiteLinks.length === 0 && !business.contact_phone && !business.contact_email && (
              <p className="mt-4 text-xs text-gray-400">No contact details have been added.</p>
            )}
          </section>

          <section aria-labelledby="map-heading" className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 id="map-heading" className="font-semibold text-gray-900">Location</h2>
            {business.latitude !== null && business.longitude !== null ? (
              <p className="mt-3 text-sm text-gray-600">
                {business.latitude.toFixed(4)}, {business.longitude.toFixed(4)}
              </p>
            ) : (
              <p className="mt-3 text-sm text-gray-500">Coordinates not added yet.</p>
            )}
            <p className="mt-3 text-xs text-gray-400">Interactive map coming soon.</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
