import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_FAVORITES,
  parseFavorites,
  serializeFavorites,
  toggleFavorite,
} from '@/lib/favorites/favorites-storage';

describe('parseFavorites', () => {
  it('returns an empty list for missing or malformed data', () => {
    assert.deepEqual(parseFavorites(null), []);
    assert.deepEqual(parseFavorites(''), []);
    assert.deepEqual(parseFavorites('{not json'), []);
    assert.deepEqual(parseFavorites('{"a":1}'), []);
  });

  it('drops non-string, empty and overlong entries and removes duplicates', () => {
    const raw = JSON.stringify(['biz-001', 42, '', null, 'biz-001', 'biz-002', 'x'.repeat(101)]);
    assert.deepEqual(parseFavorites(raw), ['biz-001', 'biz-002']);
  });
});

describe('toggleFavorite', () => {
  it('adds a missing id and removes an existing one', () => {
    assert.deepEqual(toggleFavorite(['a'], 'b'), ['a', 'b']);
    assert.deepEqual(toggleFavorite(['a', 'b'], 'a'), ['b']);
  });

  it('does not mutate the input list', () => {
    const input = ['a'];
    toggleFavorite(input, 'b');
    assert.deepEqual(input, ['a']);
  });

  it('keeps only the newest favourites when the limit is exceeded', () => {
    const full = Array.from({ length: MAX_FAVORITES }, (_, i) => `biz-${i}`);
    const next = toggleFavorite(full, 'biz-new');
    assert.equal(next.length, MAX_FAVORITES);
    assert.equal(next[next.length - 1], 'biz-new');
    assert.equal(next[0], 'biz-1');
  });
});

describe('serialize and parse round trip', () => {
  it('reads back what was written', () => {
    const ids = ['biz-001', 'biz-005'];
    assert.deepEqual(parseFavorites(serializeFavorites(ids)), ids);
  });
});
