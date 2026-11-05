import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  findDuplicateNames,
  isValidIsoCountryCode,
  isValidPinCode,
  isValidStateCode,
  locationNameKey,
  normalizeLocationName,
  validateCoordinates,
  validateLocationChain,
  validateLocationName,
} from '@/lib/geography/validation';

const EMPTY_CHAIN = { countryId: null, stateId: null, districtId: null, cityId: null, localityId: null };

describe('name normalisation (duplicate prevention)', () => {
  it('collapses whitespace and trims', () => {
    assert.equal(normalizeLocationName('  Mysuru   City  '), 'Mysuru City');
  });

  it('treats differences in case and spacing as the same name', () => {
    assert.equal(locationNameKey('  MYSURU '), locationNameKey('mysuru'));
    assert.equal(locationNameKey('Navi  Mumbai'), locationNameKey('navi mumbai'));
  });

  it('treats canonically equal Unicode as the same name', () => {
    // 'é' as one code point (NFC) and as 'e' plus a combining accent (NFD) must match.
    assert.equal(locationNameKey('Café'), locationNameKey('Cafe\u0301'));
  });

  it('rejects blank and overlong names', () => {
    assert.ok(validateLocationName('   '));
    assert.ok(validateLocationName('x'.repeat(201)));
    assert.equal(validateLocationName('Hubballi'), null);
  });
});

describe('duplicate detection', () => {
  it('finds names that collide after normalisation', () => {
    const dupes = findDuplicateNames(['Bengaluru', 'bengaluru ', 'Mysuru']);
    assert.deepEqual([...dupes.keys()], ['bengaluru']);
    assert.deepEqual(dupes.get('bengaluru'), ['Bengaluru', 'bengaluru ']);
  });

  it('returns nothing when all names are distinct', () => {
    assert.equal(findDuplicateNames(['Udupi', 'Coorg', 'Hampi']).size, 0);
  });
});

describe('PIN codes', () => {
  it('accepts six digits with a non-zero first digit', () => {
    assert.equal(isValidPinCode('560001'), true);
    assert.equal(isValidPinCode('110001'), true);
  });

  it('rejects leading zeros, wrong lengths and letters', () => {
    assert.equal(isValidPinCode('012345'), false);
    assert.equal(isValidPinCode('12345'), false);
    assert.equal(isValidPinCode('1234567'), false);
    assert.equal(isValidPinCode('56000A'), false);
    assert.equal(isValidPinCode(''), false);
  });
});

describe('codes', () => {
  it('requires two uppercase letters for a country code', () => {
    assert.equal(isValidIsoCountryCode('IN'), true);
    assert.equal(isValidIsoCountryCode('in'), false);
    assert.equal(isValidIsoCountryCode('IND'), false);
  });

  it('allows short uppercase alphanumeric state codes only', () => {
    assert.equal(isValidStateCode('KA'), true);
    assert.equal(isValidStateCode('ka'), false);
    assert.equal(isValidStateCode(''), false);
  });
});

describe('coordinates', () => {
  it('accepts a complete valid pair and no coordinates at all', () => {
    assert.deepEqual(validateCoordinates(12.97, 77.59), []);
    assert.deepEqual(validateCoordinates(null, null), []);
  });

  it('rejects latitude without longitude, and the reverse', () => {
    assert.ok(validateCoordinates(12.97, null).length > 0);
    assert.ok(validateCoordinates(null, 77.59).length > 0);
  });

  it('rejects out-of-range and non-finite values', () => {
    assert.ok(validateCoordinates(95, 10).some((e) => /Latitude/.test(e)));
    assert.ok(validateCoordinates(10, 181).some((e) => /Longitude/.test(e)));
    assert.ok(validateCoordinates(Number.NaN, 10).length > 0);
  });
});

describe('location hierarchy', () => {
  it('accepts a complete chain', () => {
    const chain = { countryId: 'c', stateId: 's', districtId: 'd', cityId: 'y', localityId: 'l' };
    assert.deepEqual(validateLocationChain(chain), []);
  });

  it('accepts a partial chain that stops at any level', () => {
    assert.deepEqual(validateLocationChain({ ...EMPTY_CHAIN, countryId: 'c' }), []);
    assert.deepEqual(validateLocationChain({ ...EMPTY_CHAIN, countryId: 'c', stateId: 's' }), []);
  });

  it('rejects a state without a country', () => {
    assert.deepEqual(validateLocationChain({ ...EMPTY_CHAIN, stateId: 's' }), ['A state needs a country.']);
  });

  it('rejects a district without a state', () => {
    assert.deepEqual(validateLocationChain({ ...EMPTY_CHAIN, countryId: 'c', districtId: 'd' }), ['A district needs a state.']);
  });

  it('rejects a city without a district', () => {
    assert.deepEqual(validateLocationChain({ ...EMPTY_CHAIN, countryId: 'c', stateId: 's', cityId: 'y' }), ['A city needs a district.']);
  });

  it('rejects a locality without a city, and reports every broken link', () => {
    const errors = validateLocationChain({ ...EMPTY_CHAIN, localityId: 'l' });
    assert.deepEqual(errors, ['A locality needs a city.']);
    // state has no country, and the locality has no city: two broken links
    assert.equal(validateLocationChain({ countryId: null, stateId: 's', districtId: 'd', cityId: null, localityId: 'l' }).length, 2);
  });
});
