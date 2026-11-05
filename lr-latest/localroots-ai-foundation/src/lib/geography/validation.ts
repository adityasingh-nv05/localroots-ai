/**
 * Pure rules for geography data. They mirror the database constraints in migration 0004,
 * so the app can explain problems before a save, and tests can cover them without a database.
 * The database remains the final authority.
 */
import type { LocationChain } from '@/types/geography';

export const ISO_COUNTRY_PATTERN = /^[A-Z]{2}$/;
export const STATE_CODE_PATTERN = /^[A-Z0-9]{1,10}$/;
export const PIN_CODE_PATTERN = /^[1-9][0-9]{5}$/;

/** Trims, collapses inner whitespace and normalises Unicode, so visually equal names compare equal. */
export function normalizeLocationName(value: string): string {
  return value.normalize('NFC').replace(/\s+/g, ' ').trim();
}

/** Key used to detect duplicate names: normalised and case-insensitive. */
export function locationNameKey(value: string): string {
  return normalizeLocationName(value).toLowerCase();
}

/** Returns an error message, or null when the name is acceptable. */
export function validateLocationName(value: string): string | null {
  const normalized = normalizeLocationName(value);
  if (normalized.length === 0) return 'Name is required.';
  if (normalized.length > 200) return 'Name must be 200 characters or fewer.';
  return null;
}

export function isValidIsoCountryCode(value: string): boolean {
  return ISO_COUNTRY_PATTERN.test(value);
}

export function isValidStateCode(value: string): boolean {
  return STATE_CODE_PATTERN.test(value);
}

export function isValidPinCode(value: string): boolean {
  return PIN_CODE_PATTERN.test(value);
}

/** Latitude and longitude must both be present or both absent, and inside valid ranges. */
export function validateCoordinates(latitude: number | null, longitude: number | null): string[] {
  const errors: string[] = [];
  if ((latitude === null) !== (longitude === null)) {
    errors.push('Latitude and longitude must be given together.');
  }
  if (latitude !== null && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) {
    errors.push('Latitude must be between -90 and 90.');
  }
  if (longitude !== null && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)) {
    errors.push('Longitude must be between -180 and 180.');
  }
  return errors;
}

/**
 * A level can only be set when its parent is set.
 * Example: a locality without a city is an invalid hierarchy.
 */
export function validateLocationChain(chain: LocationChain): string[] {
  const errors: string[] = [];
  if (chain.stateId && !chain.countryId) errors.push('A state needs a country.');
  if (chain.districtId && !chain.stateId) errors.push('A district needs a state.');
  if (chain.cityId && !chain.districtId) errors.push('A city needs a district.');
  if (chain.localityId && !chain.cityId) errors.push('A locality needs a city.');
  return errors;
}

/** Groups names that collide after normalisation. Returns each colliding key with the names that share it. */
export function findDuplicateNames(names: readonly string[]): Map<string, string[]> {
  const groups = new Map<string, string[]>();
  for (const name of names) {
    const key = locationNameKey(name);
    groups.set(key, [...(groups.get(key) ?? []), name]);
  }
  for (const [key, members] of groups) {
    if (members.length < 2) groups.delete(key);
  }
  return groups;
}
