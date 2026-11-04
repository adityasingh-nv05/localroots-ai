/**
 * Converts database rows (snake_case, storage shapes) into the app's domain types.
 * The only place that knows about naming differences such as category_slug -> category.
 */
import type {
  Business,
  Category,
  CategorySlug,
  Product,
  ProductKind,
  Review,
  VerificationRequest,
} from '@/types';
import { isCategorySlug } from '@/types';
import { DataError } from '@/lib/services/data-error';
import type {
  BusinessRow,
  CategoryRow,
  ProductRow,
  ReviewRow,
  VerificationRequestRow,
} from '@/types/database';

function toCategory(slug: string): CategorySlug {
  if (!isCategorySlug(slug)) {
    throw new DataError(`Database contains an unknown category "${slug}".`, 'query');
  }
  return slug;
}

function toRating(value: number): Review['rating'] {
  const rounded = Math.min(5, Math.max(1, Math.round(value)));
  return rounded as Review['rating'];
}

export function rowToBusiness(row: BusinessRow): Business {
  return {
    id: row.id,
    slug: row.slug,
    owner_id: row.owner_id,
    name: row.name,
    description: row.description,
    category: toCategory(row.category_slug),
    tags: row.tags ?? [],
    state: row.state,
    district: row.district,
    city: row.city,
    address: row.address,
    pincode: row.pincode,
    latitude: row.latitude,
    longitude: row.longitude,
    images: row.images ?? [],
    website_url: row.website_url,
    instagram_handle: row.instagram_handle,
    facebook_url: row.facebook_url,
    youtube_url: row.youtube_url,
    contact_phone: row.contact_phone,
    contact_email: row.contact_email,
    verification_status: row.verification_status,
    is_active: row.is_active,
    rating_average: Number(row.rating_average),
    rating_count: Number(row.rating_count),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function rowToProduct(row: ProductRow): Product {
  const kind: ProductKind = row.kind === 'service' ? 'service' : 'product';
  return {
    id: row.id,
    business_id: row.business_id,
    name: row.name,
    description: row.description,
    kind,
    category: row.category_slug ? toCategory(row.category_slug) : null,
    price_inr: row.price_inr,
    image_url: row.image_url,
    is_available: row.is_available,
    created_at: row.created_at,
  };
}

/** authorNames maps user id to display name, from the get_review_authors() function. */
export function rowToReview(row: ReviewRow, authorNames: Readonly<Record<string, string>>): Review {
  return {
    id: row.id,
    business_id: row.business_id,
    user_id: row.user_id,
    user_name: authorNames[row.user_id] ?? 'Customer',
    rating: toRating(row.rating),
    comment: row.comment,
    created_at: row.created_at,
  };
}

export function rowToCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    slug: toCategory(row.slug),
    name: row.name,
    description: row.description,
    sort_order: row.sort_order,
  };
}

export function rowToVerificationRequest(row: VerificationRequestRow): VerificationRequest {
  return { ...row };
}
