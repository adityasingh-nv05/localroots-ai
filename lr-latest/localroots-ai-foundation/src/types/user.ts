export const USER_ROLES = ['customer', 'vendor', 'admin'] as const;

export type UserRole = (typeof USER_ROLES)[number];

/** Mirrors the `profiles` table. `id` matches the Supabase Auth user id. */
export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
}
