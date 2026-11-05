import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveDataSource } from '@/lib/config/env';

describe('resolveDataSource', () => {
  it('uses Supabase whenever it is configured', () => {
    assert.equal(resolveDataSource({ supabaseConfigured: true, nodeEnv: 'production' }), 'supabase');
    assert.equal(resolveDataSource({ supabaseConfigured: true, nodeEnv: 'development' }), 'supabase');
  });

  it('falls back to sample data outside production when unconfigured', () => {
    assert.equal(resolveDataSource({ supabaseConfigured: false, nodeEnv: 'development' }), 'sample');
    assert.equal(resolveDataSource({ supabaseConfigured: false, nodeEnv: undefined }), 'sample');
  });

  it('never serves sample data in production', () => {
    assert.equal(resolveDataSource({ supabaseConfigured: false, nodeEnv: 'production' }), 'unconfigured');
  });
});
