import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { rowToBusiness, rowToProduct, rowToReview } from '@/lib/supabase/mappers';
import { DataError } from '@/lib/services/data-error';
import type { BusinessRow, ProductRow, ReviewRow } from '@/types/database';

const businessRow: BusinessRow = {
  id: '11111111-1111-1111-1111-111111111111',
  slug: 'test-business',
  owner_id: null,
  name: 'Test Business',
  description: 'A test row.',
  category_slug: 'food',
  tags: ['tag'],
  state: 'Karnataka',
  district: 'Mysuru',
  city: 'Mysuru',
  address: 'Test address',
  pincode: null,
  latitude: 12.3,
  longitude: 76.6,
  images: [],
  website_url: null,
  instagram_handle: null,
  facebook_url: null,
  youtube_url: null,
  contact_phone: null,
  contact_email: null,
  verification_status: 'unverified',
  is_active: true,
  rating_average: 4.5,
  rating_count: 10,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

describe('rowToBusiness', () => {
  it('renames category_slug to category', () => {
    const b = rowToBusiness(businessRow);
    assert.equal(b.category, 'food');
    assert.equal('category_slug' in b, false);
  });

  it('keeps coordinates and numbers', () => {
    const b = rowToBusiness(businessRow);
    assert.equal(b.latitude, 12.3);
    assert.equal(b.rating_average, 4.5);
    assert.equal(b.rating_count, 10);
  });

  it('defaults missing arrays to empty', () => {
    const b = rowToBusiness({ ...businessRow, tags: null as unknown as string[], images: null as unknown as string[] });
    assert.deepEqual(b.tags, []);
    assert.deepEqual(b.images, []);
  });

  it('rejects a category the app does not know', () => {
    assert.throws(() => rowToBusiness({ ...businessRow, category_slug: 'mystery' }), DataError);
  });
});

describe('rowToProduct', () => {
  const productRow: ProductRow = {
    id: 'p1',
    business_id: 'b1',
    name: 'Item',
    description: '',
    kind: 'service',
    category_slug: null,
    price_inr: 500,
    image_url: null,
    is_available: true,
    created_at: '2026-01-01T00:00:00Z',
  };

  it('keeps the kind and makes category nullable', () => {
    const p = rowToProduct(productRow);
    assert.equal(p.kind, 'service');
    assert.equal(p.category, null);
  });

  it('treats an unexpected kind as a product', () => {
    assert.equal(rowToProduct({ ...productRow, kind: 'other' as ProductRow['kind'] }).kind, 'product');
  });
});

describe('rowToReview', () => {
  const reviewRow: ReviewRow = {
    id: 'r1',
    business_id: 'b1',
    user_id: 'u1',
    rating: 4.6 as number,
    comment: 'Good',
    created_at: '2026-01-01T00:00:00Z',
  };

  it('uses the reviewer name when known', () => {
    assert.equal(rowToReview(reviewRow, { u1: 'Asha' }).user_name, 'Asha');
  });

  it('falls back to Customer when the name is unknown', () => {
    assert.equal(rowToReview(reviewRow, {}).user_name, 'Customer');
  });

  it('keeps ratings within 1 to 5', () => {
    assert.equal(rowToReview({ ...reviewRow, rating: 0 }, {}).rating, 1);
    assert.equal(rowToReview({ ...reviewRow, rating: 9 }, {}).rating, 5);
    assert.equal(rowToReview(reviewRow, {}).rating, 5);
  });
});
