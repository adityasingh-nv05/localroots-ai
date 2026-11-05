/**
 * Database models for the India-wide geography hierarchy (migration 0004).
 *
 *   Country -> State/UT -> District -> City/Town/Village -> Locality
 *   PIN codes link to localities many-to-many, and each belongs to at most one district.
 *
 * Note: src/types/location.ts is the Karnataka sample config for the explore page.
 * It is NOT this model.
 */

export const STATE_KINDS = ['state', 'union_territory'] as const;
export type StateKind = (typeof STATE_KINDS)[number];

export const SETTLEMENT_KINDS = ['metro', 'city', 'town', 'village'] as const;
export type SettlementKind = (typeof SETTLEMENT_KINDS)[number];

/** Fields every geography record shares. */
export interface GeoRecordBase {
  id: string;
  name: string;
  /** Alternative spellings and names, e.g. a former name or a transliteration. */
  aliases: string[];
  /** Only published records (and whose ancestors are published) are visible to the public. */
  is_published: boolean;
  latitude: number | null;
  longitude: number | null;
  /** Authoritative source name, e.g. an official dataset. Null when entered by hand. */
  source: string | null;
  /** Identifier of the record in that source. Unique per source, so re-imports do not duplicate. */
  external_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Country extends GeoRecordBase {
  /** ISO 3166-1 alpha-2 code, two uppercase letters. */
  iso_code: string;
}

export interface State extends GeoRecordBase {
  country_id: string;
  kind: StateKind;
  /** Official short code, only when a reliable source provides it. */
  code: string | null;
}

export interface District extends GeoRecordBase {
  state_id: string;
  code: string | null;
}

export interface City extends GeoRecordBase {
  district_id: string;
  kind: SettlementKind;
}

export interface Locality extends GeoRecordBase {
  city_id: string;
}

export interface Pincode {
  id: string;
  /** Six digits, first digit 1 to 9. */
  code: string;
  /** Null when the PIN is not tied to one district. */
  district_id: string | null;
  office_name: string | null;
  is_published: boolean;
  source: string | null;
  external_id: string | null;
  created_at: string;
  updated_at: string;
}

/** Many-to-many link: a locality can have several PIN codes, and a PIN can serve several localities. */
export interface LocalityPincode {
  locality_id: string;
  pincode_id: string;
}

/**
 * A location chain as the app understands it. Each level requires its parent.
 * Use null for levels that are not known.
 */
export interface LocationChain {
  countryId: string | null;
  stateId: string | null;
  districtId: string | null;
  cityId: string | null;
  localityId: string | null;
}

/** Location links stored on a business (see businesses columns added in 0004). */
export interface BusinessLocationLinks {
  country_id: string | null;
  state_id: string | null;
  district_id: string | null;
  city_id: string | null;
  locality_id: string | null;
  pincode_id: string | null;
}
