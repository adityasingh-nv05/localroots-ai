import type { CategorySlug } from './category';

/** Products are physical or digital goods. Services are bookable or hired work. */
export const PRODUCT_KINDS = ['product', 'service'] as const;
export type ProductKind = (typeof PRODUCT_KINDS)[number];

/** Mirrors the `products` table. Prices are whole rupees; for services it is a starting price. */
export interface Product {
  id: string;
  business_id: string;
  name: string;
  description: string;
  kind: ProductKind;
  category: CategorySlug | null;
  price_inr: number | null;
  image_url: string | null;
  is_available: boolean;
  created_at: string;
}
