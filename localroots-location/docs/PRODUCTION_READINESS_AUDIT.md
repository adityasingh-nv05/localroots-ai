# Production-readiness audit: India-wide location pipeline

**Scope:** the location pipeline as it exists in the verified build (`localroots-ai-foundation`, tests 205 passing).
**Method:** static reading of every location file in the build, search for legacy names and risky patterns, execution of the existing test suite, and syntax checks of every location script. No database was contacted, no migration was run, and no existing code was changed.
**Not reviewed (unverified):** `001_location_hierarchy.sql`, `002_businesses_location_links.sql`, `scripts/utils/pg-client.mjs`, `scripts/utils/validator.mjs`, `scripts/utils/import-location.orig.mjs.txt`, and `docs/config.mjs`. These exist in the project on the developer's machine but not in the verified build. Any finding that depends on them is marked **UNVERIFIED**.

Severity: **CRITICAL** blocks any database write. **HIGH** must be fixed before production import. **MEDIUM** should be fixed before scale-up. **LOW** is hygiene.

---

## 0. Summary

| Area | Status | Engineering estimate |
|---|---|---|
| LGD dry-run converter | Working and tested on the full files (36 states, 790 districts, 0 rejected) | ~85% |
| Generic import pipeline (dry run and plan) | Working and tested offline | ~70% |
| Apply path (SQL, transactions, run tracking) | Written, tested only with a fake client; never run against Postgres | ~35% |
| Schema authority | Two competing location schemas may exist; only one is in the verified build | ~30% |
| Security | Parameterised SQL, RLS and trusted-only writes are designed in; checksum enforcement is optional | ~65% |
| Automated tests | 205 offline tests; no executable SQL tests | ~55% |

**Overall production readiness for importing location data: about 45%.** This is an engineering estimate based on the findings below, not a measured quantity.

**Safe to connect to Supabase?**
- For the **dry run**: yes. It already makes no database connection.
- For the **apply step**: **no**. It has never run against Postgres, and the schema authority is unresolved.
- For **read-only schema inspection** on a disposable project: yes, after the schema authority is resolved.

---

## 1. What is correctly implemented

1. **Read-only inputs.** The converter reads inputs as bytes, records SHA-256 before and after, and sets `unchanged_during_run` in the report. A test plants a write to an input and confirms seven tests fail.
2. **Strict UTF-8 decoding.** `decodeUtf8Strict` (fatal mode) rejects invalid bytes rather than replacing them silently.
3. **Official identifiers are preserved.** LGD state and district codes become `external_id` unchanged after trimming. Census codes go to the crosswalk, not the import.
4. **Parent relationships are checked in the converter.** A district whose state code is not an accepted state is rejected with `missing_parent`.
5. **Duplicates are rejected, not guessed.** Every copy of a duplicated code or name is rejected. All duplicate checks run against all valid rows (fixed earlier).
6. **Deterministic output.** No timestamps or absolute paths; sorted by numeric code; a test confirms identical bytes across runs and across input row orders.
7. **Parameterised SQL.** Values are passed as `$n` parameters. A test confirms a hostile external ID does not appear in SQL text.
8. **Upserts match the schema.** Every `ON CONFLICT (source, external_id) WHERE external_id IS NOT NULL` clause matches the partial unique index created in `0004`.
9. **Atomic apply design.** All batches run inside one `BEGIN … COMMIT`; a row-count mismatch triggers `ROLLBACK`.
10. **Run tracking columns match `0005`.** `import_runs` and `import_run_errors` columns used by `executeImport` all exist, and `mode`/`status` values are allowed by the check constraints.
11. **Writes are restricted to trusted callers.** `0004` and `0005` give clients read access only, through RLS (admin read for tracking tables).
12. **No deletes anywhere.** A test scans every pipeline file for `delete from`.
13. **Dry-run CLI never imports a database client.** `import-location.mjs` imports only local library modules.

---

## 2. What is incomplete

- **Apply path is not wired to a real database client.** `executeImport` accepts a client, but no client is constructed, and `--apply` exits with code 3.
- **No PIN-code import.** Intentionally out of scope until a licensed source exists.
- **No cities or localities from the LGD files.** Intentionally out of scope; no source has been chosen for them.
- **No PostGIS.** The prompt specifies PostGIS, but the migrations store coordinates as `double precision`. No geography columns, spatial indexes or distance functions exist.
- **No existing-record matching.** The dry run states this explicitly, which is correct, but no read-only comparison step exists yet.
- **No archive-verification requirement.** See H1.
- **No recovery procedure** for stuck import runs. See H4.
- **Converter expected totals are hard-coded per snapshot** in `config/lgd-sources.json`. A new snapshot needs a manual edit.

---

## 3. Findings

### CRITICAL

**C1. Schema authority is unresolved.** *(UNVERIFIED in part)*
- The verified build defines the hierarchy in `0004_geography.sql`: tables `states`, `districts`, `cities`, `localities`, `pincodes`, `locality_pincodes`, UUID keys, and `(source, external_id)` identity.
- The project also contains `001_location_hierarchy.sql` and `002_businesses_location_links.sql`, which the verified build does not. The original importer you had (now replaced) referenced a different design: `states_uts`, `districts.lgd_code`, `districts.state_ut_id`.
- If `001` creates `states_uts` or any `lgd_code`-keyed table, two incompatible hierarchies exist. Applying both would produce duplicate or conflicting location trees, and the pipeline would write to whichever table matches its SQL.
- **Action:** supply `001` and `002`. Diff them against `0004`, and decide which set is authoritative. Retire the other with a documented migration, never by editing applied files.

**C2. The apply SQL has never executed against Postgres.** Tests use a fake client that returns canned `rowCount` values. Not verified: `unnest` type inference for each array, `ON CONFLICT … WHERE` inference, the `rowCount` semantics for `DO UPDATE` (the code assumes inserted plus updated), composite-foreign-key failures, and `pg_trigger_depth` interaction with the rating trigger.
- **Action:** run `0001`–`0005`, `seed.sql` and `geography_tests.sql` on a disposable Supabase project. Then run the apply SQL on a small synthetic file there, and compare with the expected counts.

### HIGH

**H1. Archive checksum verification is optional, and the dry run can pass without it.**
- `convert()` checks archives only when `--archive-*` flags are given. The exit code is `0` when totals match, whether or not archives were verified (`convert-lgd.mjs` lines ~302–305).
- The CSV files' own SHA-256 is recorded but never compared with a known value.
- **Action:** make the exit code non-zero unless both archives are verified, or require an explicit `--unverified` flag. Record the expected CSV hashes once extracted.

**H2. Upserts can move a record to a different parent.** `districts` updates `state_id`, `cities` updates `district_id`, `localities` updates `city_id` (`pipeline.mjs` lines ~167, ~183, ~199).
- A re-import in which a district's `State Code` changed would silently move it. Composite foreign keys block the move only when a business is linked to it, so unlinked records move without warning.
- **Action:** do not update parent columns on conflict. A changed parent should be a reported conflict requiring a human decision.

**H3. Name collisions with other sources are found only at apply time.** `unique (country_id, name)` and `unique (state_id, name)` can be violated by a record from another source or a manual row. The whole file then rolls back. The dry run cannot detect this without database access.
- **Action:** add a read-only pre-apply check that lists name collisions before any write.

**H4. Failed runs can be left in `running` forever, and a failed rollback is unhandled.**
- `executeImport` inserts the run row before the transaction and updates it afterwards. If the process dies between the two, the row stays `running`. Nothing reconciles it.
- In `applyBatches`, the `catch` block calls `ROLLBACK` without its own error handling. If the connection has dropped, `ROLLBACK` throws, the function exits without returning a status, and `executeImport` never reaches its final update.
- **Action:** wrap the rollback in its own try/catch; mark stale `running` rows older than a threshold as `failed` in a recovery routine; record the rollback error in the run.

**H5. No concurrency control.** Two imports of the same entity can run at once. Upserts are idempotent, but the name-collision and parent-move issues above can then interleave.
- **Action:** take an advisory lock per entity (`pg_advisory_xact_lock`) inside the transaction.

**H6. Two incompatible rejection shapes.** `pipeline.mjs` records rejections as `{ errors: [string] }`. `lib/lgd.mjs` uses `{ problems: [{category, message}] }`. Passing LGD output to `executeImport` would fail, and the run's error table would be filled incorrectly.
- **Action:** choose one shape and convert at the boundary. Add a test that feeds converter output into the apply path.

**H7. The connection role decides whether writes are permitted.** Under RLS, a write from `anon` or `authenticated` is refused. A write from a service-role or direct connection bypasses RLS. This is the intended design, but nothing enforces it. A future change could run the apply step as the wrong role, or with a key that should not be available to the script.
- **Action:** document the required role; have the apply step verify its own role at startup (`select current_user`, `auth.role()`) and refuse to run as anything else.

### MEDIUM

**M1. One transaction for every batch.** Acceptable for 790 districts. For city or locality imports of hundreds of thousands of rows, a single transaction holds row locks and grows the write-ahead log for the whole duration. Chunked commits need a resumable checkpoint, and that checkpoint must be designed with H4 in mind.

**M2. Database connection cleanup is unverified.** *(UNVERIFIED: `pg-client.mjs`)* The apply path must release the client and end the pool in a `finally` block, including when the run fails. The version in the verified build has no client.

**M3. No PostGIS.** Coordinates are stored as plain numbers, so distance and bounding-box queries will be slow and the map milestone will need a migration later. Decide before the first large import.

**M4. Pin exceptions in the business link migration.** `0004` adds `businesses_pincode_format` as `NOT VALID`. Existing bad values remain until someone runs `VALIDATE`. The docs explain this, but nothing alerts anyone. Track it.

**M5. The `0004` backfill updates existing businesses.** It sets link columns on rows that match names, which fires the trust trigger and changes `updated_at`. This is documented, but it is a write to business rows, which the brief asks us not to change. Confirm acceptance before running `0004` on live data.

**M6. Version drift has caused three false results in this project.** Old zips in `Downloads`, and copies made without clearing the destination folder, produced mismatched code and tests. This is a process risk rather than a code defect.
- **Action:** publish a checksum manifest with each zip, and verify the checksum of every script before running it.

**M7. Expected totals and snapshot names are hard-coded.** A new LGD snapshot needs the config edited by hand, and the published-totals check will fail until it is.

### LOW

**L1. A raw DDL file sits in the scripts folder.** `scripts/utils/import-location.orig.mjs.txt` (UNVERIFIED) contains `CREATE TABLE IF NOT EXISTS stg_districts` and a live-looking insert into `public.districts`. It is not executed, but it is dangerous to keep beside the importer. Move it out of the repository or delete it after your review.

**L2. Quoted newlines are unsupported.** A CSV field containing a line break is reported as malformed, not parsed. This fails safe, but it will reject real rows in a future file.

**L3. Name normalisation is not full Unicode case folding.** `toLowerCase` is used for duplicate keys. Some scripts (for example Turkish dotless i) can produce false negatives in duplicate detection.

**L4. Two incompatible test-count claims appeared in project history** (130 and 205). The current suite has 205 tests, and the number should be taken from the runner, not from documents.

---

## 4. Security risks

| Risk | Current state | Action |
|---|---|---|
| Service-role key on a developer machine | Not used by any current code | Store only in `.env.local`; never pass it to a browser or log it |
| Raw SQL in the repository | `import-location.orig.mjs.txt` (UNVERIFIED) | Remove (L1) |
| Optional archive verification | Dry run can pass unverified | Fix H1 |
| Writes from the wrong role | Not enforced | Fix H7 |
| Admin read on tracking tables | Implemented with RLS | Keep; test with two accounts on the disposable project |
| Report contents | Basenames only; no absolute paths | Keep; a test enforces it |
| Input files | Read-only; checksum-verified | Keep |

---

## 5. Missing tests

Tests that need **no** live database (can be written now):
1. **Schema compatibility (static):** parse `0004` and `0005`, and check that every column named in every `unnest` alias and `insert` list exists in its table, and that each `ON CONFLICT` predicate matches a partial unique index.
2. **Rejection-shape contract:** converter output passed through `analyseRows`-compatible adapter; asserts one shape.
3. **Mandatory archive verification:** convert with no archive flags; assert a non-zero exit (after H1 is fixed).
4. **Parent-change protection:** the generated `ON CONFLICT` for districts, cities and localities must not contain `state_id =`, `district_id =` or `city_id =` in its `DO UPDATE` set (after H2 is fixed).
5. **Rollback failure path:** a fake client whose `ROLLBACK` throws; assert the run is marked `failed` and the error is reported (after H4 is fixed).
6. **Stale-run recovery:** a fake client that returns a `running` row older than the threshold; assert it is marked `failed`.
7. **Lock acquisition:** the apply transaction issues an advisory lock before the first write (after H5 is fixed).
8. **Role check:** the apply step refuses to run as `anon` or `authenticated` (after H7 is fixed).
9. **Connection cleanup:** the client is released and the pool ended on success and on failure.

Tests that **require** a disposable Postgres or Supabase project (cannot run here):
10. Every upsert against real constraints, including partial-index inference.
11. Composite foreign-key failure when a child references a parent in another state.
12. RLS: anonymous and authenticated sessions cannot write; admin can read tracking tables.
13. Repeated import of the same file produces no new rows and no changed rows.
14. Two concurrent imports of one entity: exactly one proceeds.

---

## 6. Exact files that need modification (after your approval)

| File | Change | Findings |
|---|---|---|
| `localroots-location/scripts/convert-lgd.mjs` | Require archive verification; non-zero exit when unverified | H1 |
| `localroots-location/scripts/lib/pipeline.mjs` | Remove parent columns from `DO UPDATE`; harden rollback; add advisory lock; add stale-run recovery; role check | H2, H4, H5, H7 |
| `localroots-location/scripts/lib/lgd.mjs` | Emit the shared rejection shape | H6 |
| `localroots-location/scripts/lib/entities.mjs` | Unchanged; referenced by new static tests | — |
| `localroots-location/config/lgd-sources.json` | Add expected CSV hashes once extracted | H1, M7 |
| `tests/unit/` (new files) | Schema-compatibility, contract, rollback, lock and role tests (Section 5, items 1–9) | Section 5 |
| `supabase/tests/` (new file) | SQL behaviour tests for the apply path, to run on a disposable project | C2, Section 5 items 10–14 |
| `localroots-location/scripts/utils/import-location.orig.mjs.txt` | Remove or move out of the repository | L1 |
| `supabase/migrations/` | **Only after C1 is resolved:** a retirement migration for any conflicting schema; never edit an applied file | C1 |

---

## 7. Recommended implementation order

1. **Resolve C1 (schema authority).** Supply `001` and `002`. Diff against `0004`. Decide, in writing, which schema is authoritative.
2. **Add the static tests** (Section 5, items 1–4). They need no database and expose H2 directly.
3. **Fix H1 and H2** in the converter and the upsert SQL.
4. **Fix H4, H5, H6 and H7** in the apply path, with the fake-client tests from Section 5 items 5–8.
5. **Build a disposable Supabase test project.** Run `0001`–`0005`, `seed.sql` and `geography_tests.sql`. Then run the SQL tests (Section 5 items 10–14).
6. **Run the apply path on a 10-row synthetic file** in the disposable project. Verify counts, the rollback path (add one bad parent on purpose), and the repeated-import behaviour.
7. **Only then** consider the full LGD districts and states import, with your explicit approval, a verified backup, and the report from step 6 reviewed.
8. **Defer M1 (chunking), M3 (PostGIS) and the city/locality imports** until the states and districts import has run cleanly in production.

---

## 8. Conditions required before production import

All of the following must be true:

1. C1 resolved in writing: one authoritative location schema, and any conflicting schema retired by a documented migration.
2. C2 closed: the full migration set and the apply SQL have run on a disposable Supabase project, with all SQL tests passing.
3. H1 closed: archive checksums verified by default; unverified runs cannot exit successfully.
4. H2 closed: no upsert can change a record's parent.
5. H3 closed: a read-only collision check runs before every apply and blocks on any collision.
6. H4 and H5 closed: rollback failures are reported, stale runs recover, and concurrent imports of one entity are serialised.
7. H7 closed: the apply step refuses to run under an unexpected role.
8. A verified backup of the production database taken immediately before the import.
9. The dry-run report reviewed and signed off by you, with the attribution and GODL-India licence basis confirmed for the intended use.
10. A rollback plan written down before the import starts. Note that the migrations are additive, but removing imported location rows would delete them, so that step needs its own approval.

---

## 9. Next implementation step

**Resolve C1.** Nothing else should be changed first, because the correct fixes depend on which schema is authoritative. Send `001_location_hierarchy.sql` and `002_businesses_location_links.sql` from the project, and I'll produce a schema diff against `0004`, with the findings classified and a recommendation. No existing code will change until you approve that diff.
