import type { CategorySlug } from './category';

/** Mirrors the `products` table. Prices are whole rupees. */
export interface Product {
  id: string;
  business_id: string;
  name: string;
  description: string;
  category: CategorySlug | null;
  price_inr: number | null;
  image_url: string | null;
  is_available: boolean;
  created_at: string;
}
