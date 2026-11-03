// ─── Core Domain Types ───────────────────────────────────────────────────────

export type UserRole = 'customer' | 'vendor' | 'admin';

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
  created_at: string;
}

// ─── Business / Listing Types ─────────────────────────────────────────────────

export type BusinessCategory =
  | 'food_beverage'
  | 'artisan_craft'
  | 'retail_shop'
  | 'cultural_tourism'
  | 'agriculture'
  | 'services'
  | 'homestay';

export interface Location {
  address: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
}

export interface BusinessListing {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  category: BusinessCategory;
  tags: string[];
  location: Location;
  images: string[];
  contact_phone?: string;
  contact_email?: string;
  website_url?: string;
  instagram_handle?: string;
  is_verified: boolean;
  is_active: boolean;
  rating_avg: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  listing_id: string;
  user_id: string;
  user_name: string;
  rating: number; // 1-5
  comment: string;
  created_at: string;
}

// ─── Search & Filter Types ────────────────────────────────────────────────────

export interface SearchFilters {
  query?: string;
  category?: BusinessCategory;
  district?: string;
  city?: string;
  is_verified?: boolean;
  min_rating?: number;
}

export interface PaginationMeta {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// ─── API Response Wrapper ─────────────────────────────────────────────────────

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };
