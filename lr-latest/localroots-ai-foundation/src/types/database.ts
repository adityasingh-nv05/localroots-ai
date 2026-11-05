/**
 * Row types: exactly what PostgREST returns for each table in supabase/migrations.
 * Keep these in step with the SQL. The app converts rows to domain types in
 * src/lib/supabase/mappers.ts, so pages never see database naming quirks.
 *
 * Hand-written for now. Replace with generated types (`supabase gen types`) when the
 * Supabase CLI is set up.
 */
import type { ProductKind, VerificationStatus } from './index';

export interface BusinessRow {
  id: string;
  slug: string;
  owner_id: string | null;
  name: string;
  description: string;
  category_slug: string;
  tags: string[];
  state: string;
  district: string;
  city: string;
  address: string;
  pincode: string | null;
  latitude: number | null;
  longitude: number | null;
  country_id?: string | null;
  state_id?: string | null;
  district_id?: string | null;
  city_id?: string | null;
  locality_id?: string | null;
  pincode_id?: string | null;
  images: string[];
  website_url: string | null;
  instagram_handle: string | null;
  facebook_url: string | null;
  youtube_url: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  verification_status: VerificationStatus;
  is_active: boolean;
  rating_average: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProductRow {
  id: string;
  business_id: string;
  name: string;
  description: string;
  kind: ProductKind;
  category_slug: string | null;
  price_inr: number | null;
  image_url: string | null;
  is_available: boolean;
  created_at: string;
}

export interface ReviewRow {
  id: string;
  business_id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface ReviewAuthorRow {
  id: string;
  display_name: string;
}

export interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  sort_order: number;
}

export interface VerificationRequestRow {
  id: string;
  business_id: string;
  submitted_by: string | null;
  status: VerificationStatus;
  document_path: string | null;
  reviewer_notes: string | null;
  reviewed_by: string | null;
  created_at: string;
  reviewed_at: string | null;
}
