import type { CategorySlug } from './category';
import type { VerificationStatus } from './verification';

/** Mirrors the `businesses` table. Field names match the database columns. */
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

export interface BusinessFilters {
  query?: string;
  category?: CategorySlug;
  state?: string;
  district?: string;
  city?: string;
  verifiedOnly?: boolean;
  minRating?: number;
}
