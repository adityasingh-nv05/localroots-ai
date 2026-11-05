# Location import pipeline

This pipeline loads states, districts, cities and localities from an official source into the tables created by migration `0004`. It is **built and tested locally, but nothing has been imported and no database has been changed.**

## Status

| Part | State |
|---|---|
| CSV parsing, validation, deduplication, batching, SQL generation | Built and tested (no database needed) |
| Dry-run command and plan file | Built and tested |
| Transaction runner and run tracking | Built and tested with a fake database client |
| Import-tracking tables (`0005`) | Written, **not applied** |
| Real database writes (`--apply`) | **Disabled.** Needs your approval, a licence check and a reviewed plan |
| PIN-code import | **Not supported.** Needs an authoritative source and licence |

## Source and licence (must be checked before any real import)

Source: the Government of India's Local Government Directory (LGD), maintained by the Ministry of Panchayati Raj.
- https://lgdirectory.gov.in/
- https://data.gov.in/catalog/local-government-directory-lgd

Before using any downloaded file, confirm on the dataset page:
1. The licence name and terms.
2. That commercial reuse is permitted.
3. The attribution required. If it is GODL-India, keep the attribution and source information with the data.

If the licence is unclear, stop. The pipeline does not check the licence for you.

Nothing in this repository contains LGD data. The fixtures in `tests/fixtures/location/` are invented and marked `SAMPLE-`.

## Input format

The importer expects this normalised layout. An official LGD export must be converted into it, and that conversion has not been written yet, because the real file has not been inspected.

| File | Required columns | Optional columns |
|---|---|---|
| `states.csv` | `external_id,name,kind,country_iso` | `code,latitude,longitude` |
| `districts.csv` | `external_id,name,state_external_id` | `code,latitude,longitude` |
| `cities.csv` | `external_id,name,district_external_id,kind` | `latitude,longitude` |
| `localities.csv` | `external_id,name,city_external_id` | `latitude,longitude` |

`kind` for states is `state` or `union_territory`. For cities it is `metro`, `city`, `town` or `village`. Only `IN` is accepted as `country_iso` in this build.

## Dry run (safe, the default)

```bash
node localroots-location/scripts/import-location.mjs states tests/fixtures/location/states.csv
node localroots-location/scripts/import-location.mjs districts tests/fixtures/location/districts.csv --parents tests/fixtures/location/states.csv
```

Options:
- `--parents FILE` checks each row's parent against the parent file. Without it the report warns that the check was not run.
- `--plan-out FILE` writes the SQL and parameters to a JSON file for review. Nothing is executed.
- `--manifest FILE` appends a summary line, including the file's SHA-256 checksum.
- `--batch-size N` sets rows per batch (default 500).

Exit codes: `0` clean, `1` rows rejected, `2` bad usage or file, `3` apply requested but disabled.

## What the pipeline guarantees

- **Idempotent.** Every write is an upsert keyed on `(source, external_id)`, matching the partial unique indexes from `0004`. Re-running the same file changes nothing.
- **Never deletes.** No statement in the pipeline deletes rows, and a test fails if one is introduced. A record missing from a newer file is left alone.
- **Preserves business links.** Upserts never change business IDs or any business's location links.
- **Parent-checked.** A row whose parent is missing is not inserted. The database side compares the affected row count with the expected count and rolls back the whole file if they differ.
- **All or nothing.** Every batch runs inside one transaction. Any failure rolls back the entire file, so no partial import reaches the database.
- **Tracked.** Each run records its source, version, checksum, counts, status, timestamps and every rejected row (`0005`).
- **Duplicates.** Identical repeated rows are kept once and counted. Conflicting rows sharing an ID are all rejected. Names repeated under one parent are rejected.
- **Parameterised SQL.** Values are passed as parameters, never concatenated into the SQL text.

## Before enabling real imports (your steps)

1. Confirm the licence (above).
2. Download the real LGD file and inspect its columns. Write the conversion to the input format and test it on a copy.
3. Run `0005_import_tracking.sql` in Supabase, after `0004`.
4. Run the dry run on the real file with `--parents` set, and review the report and the `--plan-out` file.
5. Approve the apply step. It will be built only at that point, behind a licence-confirmation flag, with a test against a disposable Supabase project first.

## Known limitations

- The `--apply` path and its database client are not built or connected.
- `executeImport` is tested with a fake client only. The real SQL has not run against Postgres.
- The SQL is not validated by a Postgres parser in this environment.
- Names that collide with records from a different source will fail the whole file at apply time and roll back. Those need a manual decision.
- Changing a district's state through an upsert can be blocked by business foreign keys, which is the intended safety behaviour.
- Coordinates are stored as plain numbers; no PostGIS yet.
