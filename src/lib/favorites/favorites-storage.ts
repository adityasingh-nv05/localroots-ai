/**
 * Pure helpers for favourites stored in localStorage. No React or browser APIs here,
 * so the logic can be unit-tested. The hook in use-favorites.ts wraps these.
 *
 * Local storage is per browser and per device. When accounts exist, favourites
 * should move to a `favorites` table keyed by user id (see docs/NEXT_STEPS.md).
 */

export const FAVORITES_STORAGE_KEY = 'localroots:favorites:v1';
export const MAX_FAVORITES = 100;
const MAX_ID_LENGTH = 100;

/** Reads and validates stored JSON. Anything malformed becomes an empty list. */
export function parseFavorites(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    const ids = value.filter(
      (item): item is string => typeof item === 'string' && item.length > 0 && item.length <= MAX_ID_LENGTH,
    );
    return Array.from(new Set(ids)).slice(-MAX_FAVORITES);
  } catch {
    return [];
  }
}

export function serializeFavorites(ids: readonly string[]): string {
  return JSON.stringify(ids.slice(-MAX_FAVORITES));
}

/** Adds the id if missing, removes it if present. Newest favourites are kept if the list overflows. */
export function toggleFavorite(ids: readonly string[], id: string): string[] {
  if (ids.includes(id)) return ids.filter((existing) => existing !== id);
  return [...ids, id].slice(-MAX_FAVORITES);
}
