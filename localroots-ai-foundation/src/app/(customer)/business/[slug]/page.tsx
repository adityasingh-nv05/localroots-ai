import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink, Mail, MapPin, Phone, Star } from 'lucide-react';
import FavoriteButton from '@/components/business/FavoriteButton';
import ImageGallery from '@/components/business/ImageGallery';
import RatingSummary from '@/components/business/RatingSummary';
import VerificationBadge from '@/components/business/VerificationBadge';
import DataSourceNotice from '@/components/ui/DataSourceNotice';
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

  const productItems = products.filter((p) => p.kind === 'product');
  const serviceItems = products.filter((p) => p.kind === 'service');

  // Only links the business has actually provided are shown.
  const links: { label: string; href: string }[] = [];
  if (business.website_url) links.push({ label: 'Website', href: business.website_url });
  if (business.instagram_handle) {
    links.push({ label: 'Instagram', href: `https://instagram.com/${encodeURIComponent(business.instagram_handle)}` });
  }
  if (business.facebook_url) links.push({ label: 'Facebook', href: business.facebook_url });
  if (business.youtube_url) links.push({ label: 'YouTube', href: business.youtube_url });

  const hasCoordinates = business.latitude !== null && business.longitude !== null;
  const mapsHref = hasCoordinates
    ? `https://www.google.com/maps/search/?api=1&query=${business.latitude},${business.longitude}`
    : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <DataSourceNotice />
      <div className="flex items-center justify-between gap-4">
        <Link href="/explore" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-green-700">
          <ArrowLeft size={14} aria-hidden="true" /> Back to explore
        </Link>
        <FavoriteButton businessId={business.id} businessName={business.name} />
      </div>

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
            <span className="font-normal text-gray-400">({business.rating_count} ratings)</span>
          </span>
          <VerificationBadge status={business.verification_status} />
        </div>
      </header>

      <section aria-labelledby="photos-heading" className="mt-8">
        <h2 id="photos-heading" className="sr-only">Photos</h2>
        <ImageGallery images={business.images} name={business.name} />
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

          <section aria-labelledby="products-heading" className="space-y-6">
            <h2 id="products-heading" className="text-xl font-semibold text-gray-900">Products and services</h2>

            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Products</h3>
              {productItems.length === 0 ? (
                <EmptyState title="No products listed yet" description="This business has not added any products." />
              ) : (
                <ul className="divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white">
                  {productItems.map((p) => (
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
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Services</h3>
              {serviceItems.length === 0 ? (
                <EmptyState title="No services listed yet" description="This business has not added any services." />
              ) : (
                <ul className="divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white">
                  {serviceItems.map((s) => (
                    <li key={s.id} className="flex items-start justify-between gap-4 p-4">
                      <div>
                        <p className="font-medium text-gray-900">{s.name}</p>
                        <p className="mt-1 text-sm text-gray-500">{s.description}</p>
                      </div>
                      {s.price_inr !== null && (
                        <p className="shrink-0 text-right text-sm">
                          <span className="block text-xs text-gray-400">from</span>
                          <span className="font-semibold text-gray-900">₹{s.price_inr.toLocaleString('en-IN')}</span>
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section aria-labelledby="reviews-heading" className="space-y-4">
            <h2 id="reviews-heading" className="text-xl font-semibold text-gray-900">Reviews and ratings</h2>
            {reviews.length === 0 ? (
              <EmptyState title="No reviews yet" description="Reviews will appear here once customers post them." />
            ) : (
              <>
                <RatingSummary reviews={reviews} />
                <ul className="space-y-4">
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
              </>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section aria-labelledby="contact-heading" className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 id="contact-heading" className="font-semibold text-gray-900">Contact</h2>
            <ul className="mt-4 space-y-3 text-sm text-gray-600">
              <li className="flex gap-2"><MapPin size={16} className="mt-0.5 shrink-0 text-gray-400" aria-hidden="true" />{business.address}</li>
              {business.contact_phone && (
                <li className="flex gap-2"><Phone size={16} className="mt-0.5 shrink-0 text-gray-400" aria-hidden="true" />{business.contact_phone}</li>
              )}
              {business.contact_email && (
                <li className="flex gap-2"><Mail size={16} className="mt-0.5 shrink-0 text-gray-400" aria-hidden="true" />{business.contact_email}</li>
              )}
            </ul>
            {!business.contact_phone && !business.contact_email && (
              <p className="mt-4 text-xs text-gray-400">No phone or email has been added.</p>
            )}

            {links.length > 0 && (
              <>
                <h3 className="mt-6 text-sm font-semibold text-gray-900">Website and social</h3>
                <ul className="mt-3 space-y-2 text-sm">
                  {links.map((link) => (
                    <li key={link.label}>
                      <a href={link.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-green-700 hover:underline">
                        {link.label} <ExternalLink size={12} aria-hidden="true" />
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          <section aria-labelledby="location-heading" className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 id="location-heading" className="font-semibold text-gray-900">Location</h2>
            <p className="mt-3 text-sm text-gray-600">{business.city}, {business.district}, {business.state}</p>
            {hasCoordinates ? (
              <>
                <p className="mt-2 text-xs text-gray-400">
                  {business.latitude?.toFixed(4)}, {business.longitude?.toFixed(4)}
                </p>
                <a href={mapsHref ?? undefined} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-green-700 hover:underline">
                  Open in Google Maps <ExternalLink size={12} aria-hidden="true" />
                </a>
              </>
            ) : (
              <p className="mt-2 text-sm text-gray-500">Coordinates not added yet.</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
