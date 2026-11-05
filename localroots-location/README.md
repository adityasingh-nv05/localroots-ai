# LocalRoots AI: Location Hierarchy (Migration 001)

## What this package contains

- `migrations/001_location_hierarchy.sql`: additive migration. Creates the location
  tables, RLS policies, indexes, and seeds India plus its 36 states/UTs.
- `verify/001_checks.sql`: post-migration checks.

## What this package does not contain

- No districts, cities or localities. These must come from a verified dataset
  (see Data sources below). They are not invented here.
- No changes to businesses or any existing table. Foreign keys from the
  businesses table are added in a later migration, once its schema is confirmed.
- No application code (selectors, registration, discovery). Those come after
  the schema is in place.

## Apply

1. Confirm PostGIS is available: Supabase Dashboard > Database > Extensions.
2. Run `migrations/001_location_hierarchy.sql` in the SQL editor, or with
   `supabase db push` if you use the Supabase CLI.
3. Run `verify/001_checks.sql` statement by statement. Expected results are
   noted in the file.

## Data sources (to be imported in a later step)

- Districts and sub-districts: Local Government Directory (LGD), Government of
  India. Check the current licence terms before import.
- PIN codes: India Post PIN directory. Check the current licence terms before import.
- Coordinates: must come with a licence that permits redistribution, or be
  sourced separately. Do not use Survey of India boundary polygons without a licence.

## Limitations

- The 36 state/UT names are seeded from the standard list. LGD codes are left
  null until the LGD import runs.
- The seed is not a substitute for verified district and city data.
- Coverage of cities, towns and localities will be incomplete until imported.
