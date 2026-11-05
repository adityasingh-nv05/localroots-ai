import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { slugify, validateVendorBusinessDraft, type VendorBusinessDraft } from '@/lib/vendor/validation';
import { friendlyDatabaseMessage } from '@/lib/vendor/onboarding';

const valid: VendorBusinessDraft = {
  name: 'Mysuru Silk Co',
  slug: 'mysuru-silk-co',
  description: 'Handloom silk.',
  category: 'fashion',
  state: 'Karnataka',
  district: 'Mysuru',
  city: 'Mysuru',
  address: '',
};

describe('vendor business validation', () => {
  it('accepts a complete draft and trims text', () => {
    const r = validateVendorBusinessDraft({ ...valid, name: '  Mysuru Silk Co  ' });
    assert.equal(r.ok, true);
    if (r.ok) assert.equal(r.value.name, 'Mysuru Silk Co');
  });

  it('rejects an unknown category', () => {
    const r = validateVendorBusinessDraft({ ...valid, category: 'electronics' });
    assert.equal(r.ok, false);
    if (!r.ok) assert.ok(r.errors.category);
  });

  it('rejects web addresses that the database would also refuse', () => {
    for (const slug of ['Has Caps', 'double--hyphen', '-leading', 'trailing-', 'under_score', '']) {
      const r = validateVendorBusinessDraft({ ...valid, slug });
      assert.equal(r.ok, false, `slug "${slug}" should be rejected`);
    }
  });

  it('requires state, district and city', () => {
    const r = validateVendorBusinessDraft({ ...valid, state: ' ', district: '', city: '' });
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.ok(r.errors.state);
      assert.ok(r.errors.district);
      assert.ok(r.errors.city);
    }
  });

  it('enforces length limits on name, description and address', () => {
    assert.equal(validateVendorBusinessDraft({ ...valid, name: 'A' }).ok, false);
    assert.equal(validateVendorBusinessDraft({ ...valid, name: 'x'.repeat(121) }).ok, false);
    assert.equal(validateVendorBusinessDraft({ ...valid, description: 'x'.repeat(2001) }).ok, false);
    assert.equal(validateVendorBusinessDraft({ ...valid, address: 'x'.repeat(301) }).ok, false);
  });
});

describe('slugify', () => {
  it('builds a valid web address from a name', () => {
    assert.equal(slugify('Mysuru Silk & Co.'), 'mysuru-silk-co');
    assert.equal(slugify('  --Coorg  Coffee--  '), 'coorg-coffee');
    assert.equal(validateVendorBusinessDraft({ ...valid, slug: slugify('Mysuru Silk & Co.') }).ok, true);
  });
});

describe('database messages shown to people', () => {
  it('explains a taken web address', () => {
    assert.match(friendlyDatabaseMessage('duplicate key value violates unique constraint "businesses_slug_key"'), /already taken/);
  });

  it('never shows raw database text for unknown errors', () => {
    const msg = friendlyDatabaseMessage('relation "public.secret_table" does not exist');
    assert.equal(msg.includes('secret_table'), false);
  });
});
