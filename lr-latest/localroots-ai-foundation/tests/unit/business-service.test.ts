import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getBusinessBySlug,
  getLocationCounts,
  getProductsForBusiness,
  listBusinesses,
  sortBusinesses,
} from '@/lib/services/business-service';
import { SAMPLE_BUSINESSES } from '@/lib/data/sample-data';
import { findKarnatakaLocation } from '@/lib/data/locations';

const slugs = (list: { slug: string }[]) => list.map((b) => b.slug).sort();
const ACTIVE_COUNT = SAMPLE_BUSINESSES.filter((b) => b.is_active).length;

describe('sorting', () => {
  it('defaults to popularity (most ratings first)', async () => {
    const list = await listBusinesses();
    assert.equal(list[0].slug, 'kaveri-filter-kaapi-house');
  });

  it('sorts by rating (highest average first)', async () => {
    const list = await listBusinesses({ sort: 'rating' });
    assert.equal(list[0].slug, 'coorg-coffee-trail-guides');
  });

  it('does not mutate the input array', () => {
    const input = [...SAMPLE_BUSINESSES];
    const before = input.map((b) => b.id).join();
    sortBusinesses(input, 'rating');
    assert.equal(input.map((b) => b.id).join(), before);
  });
});

describe('search', () => {
  it('returns everything when the query is empty', async () => {
    assert.equal((await listBusinesses({ query: '   ' })).length, ACTIVE_COUNT);
  });

  it('matches business name and tags', async () => {
    assert.deepEqual(slugs(await listBusinesses({ query: 'filter coffee' })), ['kaveri-filter-kaapi-house']);
  });

  it('matches by product name', async () => {
    assert.deepEqual(slugs(await listBusinesses({ query: 'brass diya' })), ['hampi-stone-brass-works']);
  });

  it('matches by service name', async () => {
    assert.deepEqual(slugs(await listBusinesses({ query: 'estate walk' })), ['coorg-coffee-trail-guides']);
  });

  it('matches by category label', async () => {
    assert.deepEqual(slugs(await listBusinesses({ query: 'handicrafts' })), ['hampi-stone-brass-works']);
    assert.deepEqual(slugs(await listBusinesses({ query: 'tourism' })), ['coorg-coffee-trail-guides']);
  });

  it('matches by city and district', async () => {
    assert.deepEqual(slugs(await listBusinesses({ query: 'mysuru' })), ['mysuru-silk-weave-studio']);
    assert.deepEqual(slugs(await listBusinesses({ query: 'dharwad' })), ['hubballi-organic-farm-shop']);
  });

  it('requires every word to match', async () => {
    assert.equal((await listBusinesses({ query: 'silk xyzzy' })).length, 0);
  });

  it('returns nothing for an unknown term', async () => {
    assert.equal((await listBusinesses({ query: 'no-such-thing' })).length, 0);
  });
});

describe('location filter', () => {
  it('filters by city-based locations', async () => {
    assert.deepEqual(slugs(await listBusinesses({ location: 'mangaluru' })), ['mangaluru-seafood-kitchen']);
    assert.deepEqual(slugs(await listBusinesses({ location: 'hubballi' })), ['hubballi-organic-farm-shop']);
  });

  it('matches Hampi through its town, Hosapete', async () => {
    assert.deepEqual(slugs(await listBusinesses({ location: 'hampi' })), ['hampi-stone-brass-works']);
  });

  it('matches Coorg through its district, Kodagu', async () => {
    assert.deepEqual(slugs(await listBusinesses({ location: 'coorg' })), ['coorg-coffee-trail-guides']);
  });

  it('returns both Bengaluru listings', async () => {
    assert.equal((await listBusinesses({ location: 'bengaluru' })).length, 2);
  });

  it('ignores an unknown location slug', async () => {
    assert.equal((await listBusinesses({ location: 'atlantis' })).length, ACTIVE_COUNT);
  });

  it('combines with category', async () => {
    const list = await listBusinesses({ location: 'mangaluru', category: 'food' });
    assert.deepEqual(slugs(list), ['mangaluru-seafood-kitchen']);
    assert.equal((await listBusinesses({ location: 'mangaluru', category: 'fashion' })).length, 0);
  });
});

describe('other filters', () => {
  it('verifiedOnly returns nothing because no sample is verified', async () => {
    assert.equal((await listBusinesses({ verifiedOnly: true })).length, 0);
  });

  it('minRating keeps only businesses at or above the threshold', async () => {
    assert.deepEqual(slugs(await listBusinesses({ minRating: 4.7 })), ['coorg-coffee-trail-guides', 'mysuru-silk-weave-studio']);
  });
});

describe('location counts and lookups', () => {
  it('counts listings per Karnataka location', async () => {
    const counts = await getLocationCounts();
    assert.equal(counts.bengaluru, 2);
    assert.equal(counts.mysuru, 1);
    assert.equal(counts.mangaluru, 1);
    assert.equal(counts.udupi, 1);
    assert.equal(counts.coorg, 1);
    assert.equal(counts.hampi, 1);
    assert.equal(counts.hubballi, 1);
  });

  it('finds locations by slug only', () => {
    assert.equal(findKarnatakaLocation('coorg')?.name, 'Coorg');
    assert.equal(findKarnatakaLocation(undefined), undefined);
    assert.equal(findKarnatakaLocation('nowhere'), undefined);
  });

  it('returns null for an unknown business slug', async () => {
    assert.equal(await getBusinessBySlug('does-not-exist'), null);
  });

  it('separates products and services by kind', async () => {
    const items = await getProductsForBusiness('biz-006');
    assert.ok(items.length > 0);
    assert.ok(items.every((p) => p.kind === 'service'));
  });
});
