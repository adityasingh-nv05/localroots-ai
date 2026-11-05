# India-wide geography (migration 0004)

This is the database foundation for locations. It contains **structure only**. No states, districts, cities, localities or PIN codes are loaded yet, because none have been verified from an authoritative source. Nothing here is invented.

## The hierarchy

```
countries ─< states ─< districts ─< cities ─< localities
                                                   │
pincodes ─────────────────── (many-to-many) ───────┘  via locality_pincodes
```

| Table | Parent | Key rules |
|---|---|---|
| `countries` | none | ISO code (two uppercase letters) unique; name unique |
| `states` | country | `kind` is `state` or `union_territory`; name unique per country; optional official `code` |
| `districts` | state | name unique per state; optional `code` |
| `cities` | district | `kind` is `metro`, `city`, `town` or `village`; name unique per district |
| `localities` | city | name unique per city |
| `pincodes` | district (optional) | six digits, first digit 1–9; unique per (code, district) |
| `locality_pincodes` | locality + pincode | many-to-many; primary key on both IDs |

Every table has a UUID primary key, timestamps (`created_at`, `updated_at`), optional `latitude`/`longitude` (both or neither, in range), `aliases` (alternative names), `is_published`, and `source` / `external_id` (unique per source, so re-imports cannot create duplicates).

## Why PIN codes are many-to-many

A PIN code can cover several localities, and a locality can have several PIN codes. Some PINs also cross district lines, so the same six digits can appear once per district. The database rejects a locality–PIN link when the PIN belongs to a different district from the locality.

## How businesses connect

Existing columns (`state`, `district`, `city`, `pincode`, `latitude`, `longitude`) stay as they are. New nullable columns are added alongside them:

`country_id`, `state_id`, `district_id`, `city_id`, `locality_id`, `pincode_id`

Business IDs are not changed. Composite foreign keys mean a locality cannot be attached to a city it does not belong to. Chain checks mean a city cannot be set without its district. A trigger checks that a business PIN link matches its text PIN and its district.

The migration also links **existing** businesses where their text values exactly match an existing record (case-insensitive, trimmed). It only sets link columns. With no location records loaded, it links nothing.

## Who can see and change location data

| Role | Read | Write |
|---|---|---|
| Anonymous visitors | Published records whose ancestors are all published | No |
| Signed-in users | Same as anonymous | No |
| Administrators (`is_admin()`) | Everything, including unpublished | Yes |

Records are unpublished by default, so loading data does not make it public by accident.

## Indexes

Foreign-key columns on the hierarchy, lower-cased names for search, GIN indexes on aliases, partial indexes on published rows, and indexes on each new business link column.

## Apply it in Supabase (step by step)

Do this on a backup or development project first. Never run it on production without a backup.

**Step 1 — Check the prerequisites.** SQL Editor → New query:
```sql
select
  to_regclass('public.businesses') is not null       as has_businesses,
  to_regclass('public.business_members') is not null as has_0003,
  to_regclass('public.countries') is null            as no_geography_yet;
```
Expected: `true`, `true`, `true`. If `has_0003` is false, run migration 0003 first (see `docs/ACCOUNTS_AND_ROLES.md`). If `no_geography_yet` is false, 0004 has already run; continue to Step 3 instead of re-running it.

**Step 2 — Record the business count** so you can prove nothing changes:
```sql
select count(*) as businesses_before from public.businesses;
```

**Step 3 — Run the migration.** Open `supabase/migrations/0004_geography.sql`, copy everything, paste into a new query, click **Run**. It should finish without error. It is safe to re-run.

**Step 4 — Load the reference seed.** Paste `supabase/seed.sql` and run it. It adds the category rows (already present is fine) and the India country row.

**Step 5 — Run the behaviour tests.** Paste `supabase/tests/geography_tests.sql` and run it. The result is an error message, which is expected, because the script rolls back all of its test rows:
- `GEOGRAPHY TESTS PASSED: 31 checks passed...` → all good.
- `GEOGRAPHY TESTS FAILED: ...` → send me the message; do not continue.

**Step 6 — Verify the result:**
```sql
-- Every location table must show rowsecurity = true
select tablename, rowsecurity from pg_tables
where schemaname = 'public'
  and tablename in ('countries','states','districts','cities','localities','pincodes','locality_pincodes')
order by tablename;

-- Business count must equal Step 2
select count(*) as businesses_after from public.businesses;

-- Only the India country row should exist so far
select iso_code, name, is_published from public.countries;
```

## Validating existing PIN codes later (optional, deliberate)

The business PIN check was added as `NOT VALID`. New and changed rows are checked, but old values are not, until you validate them. Find any existing bad values first:
```sql
select id, name, pincode from public.businesses
where pincode is not null and pincode !~ '^[1-9][0-9]{5}$';
```
Fix those rows with the owner or an admin. When the list is empty, run:
```sql
alter table public.businesses validate constraint businesses_pincode_format;
```

## Loading real location data (not part of this migration)

Load states, districts, cities, localities and PIN codes only from an **authoritative source whose licence allows your use**, for example official Indian government datasets such as the Local Government Directory (LGD). Use a reviewed import process that writes `source` and `external_id`, so a re-run updates instead of duplicating. Publish a region only after it has been checked. The importer is a later milestone.

## Rolling back

This migration is additive. Removing it would mean dropping the new tables and columns, which deletes any location data loaded into them. That is a destructive decision and needs your explicit approval; no rollback script is provided.

## Known limitations

- Coordinates are plain `double precision` values. PostGIS (for distance and map queries) is a later addition, when the map milestone begins.
- Name search uses lower-cased btree indexes and alias arrays. Fuzzy (trigram) search can be added later.
- Business matching during the backfill is exact on name, not alias-aware.
- Pincodes are not linked to businesses automatically; that needs a loaded PIN dataset.

## Checks that were run and checks that were not

Run locally: unit tests (130 passing, including migration and validation tests), a strict TypeScript check of the library, types and tests, a syntax parse of every TypeScript file, an unused-import scan, dollar-quote balance on both SQL files, and a mutation test that confirmed the migration tests fail when an invented-data insert is planted.

Not run: the SQL itself. No PostgreSQL is available in this environment, so the migration and `geography_tests.sql` have not been executed. Running them in Supabase (Steps 3–5) is the real verification.
