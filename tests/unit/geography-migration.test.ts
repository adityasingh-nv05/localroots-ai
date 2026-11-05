import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.env.PROJECT_ROOT ?? process.cwd();
const migration = readFileSync(join(ROOT, 'supabase', 'migrations', '0004_geography.sql'), 'utf8');
const seed = readFileSync(join(ROOT, 'supabase', 'seed.sql'), 'utf8');
const sql = migration.replace(/--.*$/gm, '');
const seedSql = seed.replace(/--.*$/gm, '');
const LOCATION_TABLES = ['countries', 'states', 'districts', 'cities', 'localities', 'pincodes', 'locality_pincodes'];

describe('0004 is additive and never destructive', () => {
  it('drops, truncates and unfiltered deletes nothing', () => {
    assert.doesNotMatch(sql, /\bdrop\s+(table|schema|database|column)\b/i);
    assert.doesNotMatch(sql, /\btruncate\b/i);
    assert.doesNotMatch(sql, /\bdelete\s+from\b/i);
  });

  it('does not rename or alter existing business columns', () => {
    assert.doesNotMatch(sql, /alter\s+column/i);
    assert.doesNotMatch(sql, /\brename\b/i);
    assert.doesNotMatch(sql, /alter table public\.businesses\s+drop/i);
  });

  it('keeps the existing text location columns in place', () => {
    assert.doesNotMatch(sql, /businesses[^;]*\bdrop\b/i);
  });

  it('is written to be re-runnable', () => {
    assert.match(sql, /create table if not exists/i);
    assert.match(sql, /add column if not exists/i);
    assert.match(sql, /create index if not exists/i);
    assert.match(sql, /create or replace function/i);
  });
});

describe('location tables and keys', () => {
  it('creates every hierarchy table', () => {
    for (const t of LOCATION_TABLES) {
      assert.match(sql, new RegExp(`create table if not exists public\\.${t}\\b`), `missing ${t}`);
    }
  });

  it('turns on row-level security for every location table', () => {
    for (const t of LOCATION_TABLES) {
      assert.match(sql, new RegExp(`alter table public\\.${t} enable row level security`), `${t} has no RLS`);
    }
  });

  it('gives every parent table a UUID primary key', () => {
    assert.match(sql, /id uuid primary key default gen_random_uuid\(\)/g);
    assert.ok((sql.match(/id uuid primary key default gen_random_uuid\(\)/g) ?? []).length >= 6);
  });

  it('links each level to its parent with a foreign key', () => {
    assert.match(sql, /country_id uuid not null references public\.countries \(id\) on delete restrict/);
    assert.match(sql, /state_id uuid not null references public\.states \(id\) on delete restrict/);
    assert.match(sql, /district_id uuid not null references public\.districts \(id\) on delete restrict/);
    assert.match(sql, /city_id uuid not null references public\.cities \(id\) on delete restrict/);
  });

  it('never cascades deletes out of the hierarchy (only the join table cascades)', () => {
    const cascades = sql.match(/references public\.\w+ \(id\) on delete cascade/g) ?? [];
    assert.equal(cascades.length, 1, 'only locality_pincodes.locality_id may cascade');
    assert.match(sql, /locality_id uuid not null references public\.localities \(id\) on delete cascade/);
  });

  it('has duplicate-prevention constraints at every level', () => {
    assert.match(sql, /constraint countries_iso_code_key unique \(iso_code\)/);
    assert.match(sql, /constraint countries_name_key unique \(name\)/);
    assert.match(sql, /constraint states_country_name_key unique \(country_id, name\)/);
    assert.match(sql, /constraint districts_state_name_key unique \(state_id, name\)/);
    assert.match(sql, /constraint cities_district_name_key unique \(district_id, name\)/);
    assert.match(sql, /constraint localities_city_name_key unique \(city_id, name\)/);
    assert.match(sql, /create unique index if not exists pincodes_code_district_key/);
    assert.match(sql, /primary key \(locality_id, pincode_id\)/);
  });

  it('prevents the same external record being imported twice', () => {
    for (const t of ['states', 'districts', 'cities', 'localities', 'pincodes']) {
      assert.match(sql, new RegExp(`create unique index if not exists ${t}_external_key on public\\.${t} \\(source, external_id\\)`), `${t} external key`);
    }
  });

  it('validates coordinates and codes with check constraints', () => {
    assert.match(sql, /constraint countries_iso_code_format check \(iso_code ~ '\^\[A-Z\]\{2\}\$'\)/);
    assert.match(sql, /constraint pincodes_code_format check \(code ~ '\^\[1-9\]\[0-9\]\{5\}\$'\)/);
    assert.match(sql, /constraint localities_coords_paired check/);
    assert.match(sql, /constraint localities_latitude_range check/);
    assert.match(sql, /constraint cities_kind_check check \(kind in \('metro', 'city', 'town', 'village'\)\)/);
  });
});

describe('PIN codes and business links', () => {
  it('lets a PIN serve many localities through a join table', () => {
    assert.match(sql, /create table if not exists public\.locality_pincodes/);
    assert.match(sql, /pincode_id uuid not null references public\.pincodes \(id\) on delete restrict/);
  });

  it('adds nullable location links to businesses without touching existing IDs', () => {
    for (const col of ['country_id', 'state_id', 'district_id', 'city_id', 'locality_id', 'pincode_id']) {
      assert.match(sql, new RegExp(`add column if not exists ${col} uuid`), `missing ${col}`);
    }
    assert.doesNotMatch(sql, /add column if not exists \w+ uuid not null/);
  });

  it('uses composite foreign keys so a child must belong to its parent', () => {
    assert.match(sql, /businesses_state_country_fk[\s\S]*?foreign key \(state_id, country_id\) references public\.states \(id, country_id\)/);
    assert.match(sql, /businesses_district_state_fk[\s\S]*?foreign key \(district_id, state_id\) references public\.districts \(id, state_id\)/);
    assert.match(sql, /businesses_city_district_fk[\s\S]*?foreign key \(city_id, district_id\) references public\.cities \(id, district_id\)/);
    assert.match(sql, /businesses_locality_city_fk[\s\S]*?foreign key \(locality_id, city_id\) references public\.localities \(id, city_id\)/);
  });

  it('requires each parent link before a child link', () => {
    assert.match(sql, /businesses_chain_state_needs_country[\s\S]*?check \(state_id is null or country_id is not null\)/);
    assert.match(sql, /businesses_chain_district_needs_state[\s\S]*?check \(district_id is null or state_id is not null\)/);
    assert.match(sql, /businesses_chain_city_needs_district[\s\S]*?check \(city_id is null or district_id is not null\)/);
    assert.match(sql, /businesses_chain_locality_needs_city[\s\S]*?check \(locality_id is null or city_id is not null\)/);
  });

  it('adds the PIN format check as NOT VALID, so existing rows are not rejected at once', () => {
    assert.match(sql, /businesses_pincode_format[\s\S]*?not valid/);
  });

  it('checks that a business PIN link matches its text PIN and district', () => {
    assert.match(sql, /create trigger businesses_check_pincode/);
    assert.match(sql, /Business PIN code must match the selected PIN code record/);
    assert.match(sql, /belongs to a different district/);
  });

  it('checks that a PIN linked to a locality belongs to the locality district', () => {
    assert.match(sql, /create trigger locality_pincodes_check_district/);
    assert.match(sql, /belongs to a different district than the locality/);
  });

  it('indexes every new foreign-key column on businesses', () => {
    for (const idx of ['businesses_country_idx', 'businesses_district_idx', 'businesses_city_idx', 'businesses_locality_idx', 'businesses_pincode_idx']) {
      assert.match(sql, new RegExp(`create index if not exists ${idx}`));
    }
    assert.match(sql, /create index if not exists businesses_state_district_city_idx/);
  });
});

describe('row-level security for location data', () => {
  it('lets the public read only published records', () => {
    assert.match(sql, /"countries: public read published"[\s\S]*?using \(is_published or public\.is_admin\(\)\)/);
    assert.match(sql, /"states: public read published"[\s\S]*?public\.is_state_public\(id\)/);
    assert.match(sql, /"localities: public read published"[\s\S]*?public\.is_locality_public\(id\)/);
  });

  it('allows writes only for administrators', () => {
    const writePolicies = sql.match(/create policy "[^"]*admin write"[\s\S]*?with check \(public\.is_admin\(\)\);/g) ?? [];
    assert.equal(writePolicies.length, 7, 'every location table needs an admin-only write policy');
    for (const p of writePolicies) assert.match(p, /for all using \(public\.is_admin\(\)\)/);
  });

  it('grants writes only to the authenticated role (RLS then limits them to admins)', () => {
    assert.match(sql, /grant insert, update, delete on[\s\S]*? to authenticated;/);
    assert.doesNotMatch(sql, /grant (insert|update|delete)[^;]*to (anon|public)/i);
  });

  it('gives anonymous users read access only', () => {
    assert.match(sql, /grant select on[\s\S]*? to anon, authenticated;/);
  });

  it('only a published chain of ancestors is public', () => {
    assert.match(sql, /where s\.id = p_id and s\.is_published and c\.is_published/);
    assert.match(sql, /where d\.id = p_id and d\.is_published and public\.is_state_public\(d\.state_id\)/);
  });
});

describe('no invented geographical data', () => {
  it('the migration inserts no location records', () => {
    for (const t of LOCATION_TABLES) {
      assert.doesNotMatch(sql, new RegExp(`insert into public\\.${t}\\b`, 'i'), `migration inserts into ${t}`);
    }
  });

  it('the seed inserts only the country row, and no states, districts, cities, localities or PINs', () => {
    assert.match(seedSql, /insert into public\.countries/i);
    for (const t of ['states', 'districts', 'cities', 'localities', 'pincodes', 'locality_pincodes']) {
      assert.doesNotMatch(seedSql, new RegExp(`insert into public\\.${t}\\b`, 'i'), `seed inserts into ${t}`);
    }
  });

  it('the backfill only sets link columns on existing businesses', () => {
    const backfill = migration.slice(migration.indexOf('-- 14.')).replace(/--.*$/gm, '');
    assert.match(backfill, /update public\.businesses b/);
    assert.doesNotMatch(backfill, /insert into/i);
    assert.match(backfill, /lower\(btrim\(s\.name\)\) = lower\(btrim\(b\.state\)\)/);
  });
});
