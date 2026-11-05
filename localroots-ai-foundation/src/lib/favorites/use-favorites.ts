'use client';

import { useCallback, useSyncExternalStore } from 'react';
import {
  FAVORITES_STORAGE_KEY,
  parseFavorites,
  serializeFavorites,
  toggleFavorite,
} from './favorites-storage';

const EMPTY: string[] = [];
const listeners = new Set<() => void>();

// Cache the parsed list by its raw string so React gets a stable snapshot between renders.
let cachedRaw: string | null | undefined;
let cachedIds: string[] = EMPTY;

function readRaw(): string | null {
  return window.localStorage.getItem(FAVORITES_STORAGE_KEY);
}

function getSnapshot(): string[] {
  let raw: string | null;
  try {
    raw = readRaw();
  } catch {
    return EMPTY; // storage blocked (private mode, disabled cookies)
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedIds = parseFavorites(raw);
  }
  return cachedIds;
}

function getServerSnapshot(): string[] {
  return EMPTY;
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === FAVORITES_STORAGE_KEY) callback();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener('storage', onStorage);
  };
}

function notify() {
  listeners.forEach((listener) => listener());
}

/** Returns false if the browser refused to save (quota or blocked storage). */
function writeIds(ids: string[]): boolean {
  try {
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, serializeFavorites(ids));
    notify();
    return true;
  } catch {
    return false;
  }
}

/** True when the browser allows reading and writing favourites. */
export function isFavoritesStorageAvailable(): boolean {
  try {
    readRaw();
    return true;
  } catch {
    return false;
  }
}

export function useFavorites() {
  const ids = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const isFavorite = useCallback((id: string) => ids.includes(id), [ids]);

  const toggle = useCallback((id: string): boolean => writeIds(toggleFavorite(getSnapshot(), id)), []);

  const clear = useCallback((): boolean => writeIds([]), []);

  return { ids, count: ids.length, isFavorite, toggle, clear };
}

const noopSubscribe = () => () => {};

/** False during server render and hydration, true afterwards. Use to avoid showing stale empty states. */
export function useIsHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
