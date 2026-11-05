/** Category slugs are the stable identifiers used in URLs, filters and the database. */
export const CATEGORY_SLUGS = [
  'food',
  'fashion',
  'handicrafts',
  'accessories',
  'services',
  'tourism',
  'agriculture',
  'homestay',
] as const;

export type CategorySlug = (typeof CATEGORY_SLUGS)[number];

export interface Category {
  id: string;
  slug: CategorySlug;
  name: string;
  description: string;
  sort_order: number;
}

export function isCategorySlug(value: string): value is CategorySlug {
  return (CATEGORY_SLUGS as readonly string[]).includes(value);
}
