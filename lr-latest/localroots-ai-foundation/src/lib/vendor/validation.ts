/**
 * Client-side checks for a vendor's business draft. The database enforces the same rules
 * (see create_vendor_business in migration 0003), so this only gives faster feedback.
 */
import { isCategorySlug, type CategorySlug } from '@/types';

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export interface VendorBusinessDraft {
  name: string;
  slug: string;
  description: string;
  category: string;
  state: string;
  district: string;
  city: string;
  address: string;
}

export type VendorDraftField = keyof VendorBusinessDraft;
export type ValidationErrors = Partial<Record<VendorDraftField, string>>;

export type ValidationResult =
  | { ok: true; value: Omit<VendorBusinessDraft, 'category'> & { category: CategorySlug } }
  | { ok: false; errors: ValidationErrors };

/** Lowercase web address from a name, e.g. "Mysuru Silk & Co." -> "mysuru-silk-co". */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
}

export function validateVendorBusinessDraft(input: VendorBusinessDraft): ValidationResult {
  const errors: ValidationErrors = {};

  const name = input.name.trim();
  if (name.length < 2 || name.length > 120) errors.name = 'Name must be 2 to 120 characters.';

  const slug = input.slug.trim();
  if (slug.length === 0 || slug.length > 80 || !SLUG_PATTERN.test(slug)) {
    errors.slug = 'Use lowercase letters, numbers and single hyphens only (up to 80 characters).';
  }

  const description = input.description.trim();
  if (description.length > 2000) errors.description = 'Description must be 2000 characters or fewer.';

  if (!isCategorySlug(input.category)) errors.category = 'Choose a category.';

  const state = input.state.trim();
  const district = input.district.trim();
  const city = input.city.trim();
  if (!state) errors.state = 'State is required.';
  if (!district) errors.district = 'District is required.';
  if (!city) errors.city = 'City is required.';

  const address = input.address.trim();
  if (address.length > 300) errors.address = 'Address must be 300 characters or fewer.';

  if (Object.keys(errors).length > 0 || !isCategorySlug(input.category)) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: { name, slug, description, category: input.category, state, district, city, address },
  };
}
