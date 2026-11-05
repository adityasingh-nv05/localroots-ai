/**
 * Account types a visitor may choose at sign-up.
 *
 * 'admin' is deliberately absent. Admin rights are granted only by a trusted server
 * process (scripts/admin-role.mjs, which calls the database function grant_admin).
 * Nothing a visitor sends can produce an admin account.
 */
export const SELF_REGISTRABLE_ROLES = ['customer', 'vendor'] as const;
export type AccountType = (typeof SELF_REGISTRABLE_ROLES)[number];

/** Anything other than 'vendor' becomes 'customer', including 'admin'. */
export function parseAccountType(value: unknown): AccountType {
  return value === 'vendor' ? 'vendor' : 'customer';
}

/**
 * Options for supabase.auth.signUp(). Only the display name is sent as user metadata.
 * The database ignores metadata for roles (handle_new_user always creates a customer),
 * so no role is included here on purpose.
 */
export function buildSignUpOptions(fullName: string): { data: { full_name: string } } {
  return { data: { full_name: fullName.trim() } };
}

/** Vendor registration step two: call after sign-in succeeds (see vendor/onboarding.ts). */
export const VENDOR_ONBOARDING_STEPS = ['become_vendor', 'create_vendor_business'] as const;
