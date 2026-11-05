/**
 * Vendor registration, step by step. Call these only after the visitor has signed in.
 *
 *   1. becomeVendor()          upgrades the account from customer to vendor.
 *   2. createVendorBusiness()  creates a business the vendor owns. It starts inactive
 *                              and unverified. An admin must publish and verify it.
 *
 * All permission checks happen in the database. These functions only pass the request on
 * and turn database messages into readable errors.
 *
 * NOT YET CONNECTED to a sign-up screen. Test with a real sign-in before relying on it.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { validateVendorBusinessDraft, type ValidationErrors, type VendorBusinessDraft } from './validation';

export class OnboardingError extends Error {
  readonly fieldErrors: ValidationErrors;

  constructor(message: string, fieldErrors: ValidationErrors = {}) {
    super(message);
    this.name = 'OnboardingError';
    this.fieldErrors = fieldErrors;
  }
}

/** Maps raw database messages to something a person can act on. */
export function friendlyDatabaseMessage(raw: string): string {
  if (/duplicate key|businesses_slug_key/i.test(raw)) return 'That web address is already taken. Choose another.';
  if (/row-level security/i.test(raw)) return 'You do not have permission to do that.';
  if (/Sign in/i.test(raw)) return 'Please sign in first.';
  if (/Only vendor accounts/i.test(raw)) return 'Register as a vendor before creating a business.';
  if (/limited to 10/i.test(raw)) return 'This account has reached the limit of 10 businesses.';
  return 'Something went wrong. Please try again.';
}

export async function becomeVendor(client: SupabaseClient): Promise<void> {
  const { error } = await client.rpc('become_vendor');
  if (error) throw new OnboardingError(friendlyDatabaseMessage(error.message));
}

export async function createVendorBusiness(
  client: SupabaseClient,
  draft: VendorBusinessDraft,
): Promise<string> {
  const checked = validateVendorBusinessDraft(draft);
  if (!checked.ok) {
    throw new OnboardingError('Please correct the highlighted fields.', checked.errors);
  }
  const v = checked.value;
  const { data, error } = await client.rpc('create_vendor_business', {
    p_name: v.name,
    p_slug: v.slug,
    p_description: v.description,
    p_category: v.category,
    p_state: v.state,
    p_district: v.district,
    p_city: v.city,
    p_address: v.address,
  });
  if (error) throw new OnboardingError(friendlyDatabaseMessage(error.message));
  return data as string;
}
