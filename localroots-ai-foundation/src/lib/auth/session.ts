import type { User } from '@/types';

/**
 * PLACEHOLDER. Supabase Auth is not connected yet, so this always returns null.
 * Protected pages treat null as "not signed in". Replace this body with a real
 * session lookup (see docs/NEXT_STEPS.md) once auth is tested end to end.
 */
export async function getCurrentUser(): Promise<User | null> {
  return null;
}
