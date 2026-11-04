import type { CategorySlug } from './category';
import type { VerificationStatus } from './verification';

/** Mirrors the `businesses` table. The database column `category_slug` is exposed here as `category` (see supabase/mappers.ts). */
export interface Business {
  id: string;
  slug: string;
  owner_id: string | null;
  name: string;
  description: string;
  category: CategorySlug;
  tags: string[];

  // Location
  state: string;
  district: string;
  city: string;
  address: string;
  pincode: string | null;
  latitude: number | null;
  longitude: number | null;

  // Media and links
  images: string[];
  website_url: string | null;
  instagram_handle: string | null;
  facebook_url: string | null;
  youtube_url: string | null;

  // Contact
  contact_phone: string | null;
  contact_email: string | null;

  // Trust and quality
  verification_status: VerificationStatus;
  is_active: boolean;
  rating_average: number;
  rating_count: number;

  created_at: string;
  updated_at: string;
}

/** Fields a vendor may submit. Verification and rating fields are excluded on purpose. */
export type BusinessDraft = Pick<
  Business,
  | 'slug'
  | 'name'
  | 'description'
  | 'category'
  | 'tags'
  | 'state'
  | 'district'
  | 'city'
  | 'address'
  | 'pincode'
  | 'latitude'
  | 'longitude'
  | 'images'
  | 'website_url'
  | 'instagram_handle'
  | 'facebook_url'
  | 'youtube_url'
  | 'contact_phone'
  | 'contact_email'
>;

/** 'popular' = most reviews first; 'rating' = highest average first. */
export const BUSINESS_SORTS = ['popular', 'rating'] as const;
export type BusinessSort = (typeof BUSINESS_SORTS)[number];

export function isBusinessSort(value: string): value is BusinessSort {
  return (BUSINESS_SORTS as readonly string[]).includes(value);
}

export interface BusinessFilters {
  /** Free text: matches name, description, tags, category, city, district, products and services. */
  query?: string;
  category?: CategorySlug;
  /** Karnataka location slug from data/locations.ts, e.g. 'mysuru'. */
  location?: string;
  state?: string;
  district?: string;
  city?: string;
  verifiedOnly?: boolean;
  minRating?: number;
  sort?: BusinessSort;
}
