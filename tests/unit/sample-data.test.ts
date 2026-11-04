import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { CATEGORY_SLUGS } from '@/types';
import { KARNATAKA_LOCATIONS } from '@/lib/data/locations';
import { SAMPLE_BUSINESSES, SAMPLE_PRODUCTS, SAMPLE_REVIEWS } from '@/lib/data/sample-data';
import { listBusinesses } from '@/lib/services/business-service';

const PUBLIC_DIR = join(process.env.PROJECT_ROOT ?? process.cwd(), 'public');

describe('sample data integrity', () => {
  it('has unique business ids and slugs', () => {
    assert.equal(new Set(SAMPLE_BUSINESSES.map((b) => b.id)).size, SAMPLE_BUSINESSES.length);
    assert.equal(new Set(SAMPLE_BUSINESSES.map((b) => b.slug)).size, SAMPLE_BUSINESSES.length);
  });

  it('uses valid categories and ratings', () => {
    for (const b of SAMPLE_BUSINESSES) {
      assert.ok((CATEGORY_SLUGS as readonly string[]).includes(b.category), `${b.slug} category`);
      assert.ok(b.rating_average >= 0 && b.rating_average <= 5, `${b.slug} rating`);
      assert.ok(b.rating_count >= 0, `${b.slug} count`);
    }
  });

  it('stores coordinates as a pair or not at all', () => {
    for (const b of SAMPLE_BUSINESSES) {
      assert.equal(b.latitude === null, b.longitude === null, `${b.slug} coordinate pair`);
    }
  });

  it('never marks sample businesses as verified', () => {
    assert.ok(SAMPLE_BUSINESSES.every((b) => b.verification_status !== 'verified'));
  });

  it('points every image at a file that exists in /public', () => {
    for (const b of SAMPLE_BUSINESSES) {
      for (const src of b.images) {
        assert.ok(existsSync(join(PUBLIC_DIR, src)), `missing image ${src}`);
      }
    }
  });

  it('links products and reviews to real businesses', () => {
    const ids = new Set(SAMPLE_BUSINESSES.map((b) => b.id));
    assert.ok(SAMPLE_PRODUCTS.every((p) => ids.has(p.business_id)));
    assert.ok(SAMPLE_REVIEWS.every((r) => ids.has(r.business_id) && r.rating >= 1 && r.rating <= 5));
  });

  it('gives every Karnataka location at least one listing', async () => {
    for (const loc of KARNATAKA_LOCATIONS) {
      assert.ok((await listBusinesses({ location: loc.slug })).length > 0, `no listing in ${loc.name}`);
    }
  });
});
