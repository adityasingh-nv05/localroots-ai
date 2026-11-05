import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildSignUpOptions, parseAccountType, SELF_REGISTRABLE_ROLES } from '@/lib/auth/account-type';

describe('sign-up account types', () => {
  it('only offers customer and vendor', () => {
    assert.deepEqual([...SELF_REGISTRABLE_ROLES], ['customer', 'vendor']);
  });

  it('keeps vendor when chosen', () => {
    assert.equal(parseAccountType('vendor'), 'vendor');
  });

  it('turns admin, unknown values and missing values into customer', () => {
    assert.equal(parseAccountType('admin'), 'customer');
    assert.equal(parseAccountType('ADMIN'), 'customer');
    assert.equal(parseAccountType('superuser'), 'customer');
    assert.equal(parseAccountType(undefined), 'customer');
    assert.equal(parseAccountType(null), 'customer');
  });
});

describe('sign-up options', () => {
  it('send only the display name as metadata', () => {
    const options = buildSignUpOptions('  Asha  ');
    assert.deepEqual(options, { data: { full_name: 'Asha' } });
    assert.equal('role' in options.data, false);
  });
});
