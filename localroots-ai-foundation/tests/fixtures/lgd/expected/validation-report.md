# LGD dry-run validation report

Source: LGD  |  Snapshot: 04Nov2026
Licence: Government Open Data License - India (GODL-India)

> Source: Local Government Directory (LGD), Ministry of Panchayati Raj, Government of India (https://lgdirectory.gov.in/). Licensed under the Government Open Data License - India. Snapshot: 4 November 2026, obtained via ramSeraph/opendata (lgd-latest).

## Inputs (read-only, checksums recorded)

| Role | File | Rows read | SHA-256 | Unchanged during run |
|---|---|---|---|---|
| states | states-excerpt.csv | 2 | `fcbe59a26537e45d484077a31f8b6ef24ef9aed32b41c72efd3bf3b21a6bc213` | yes |
| districts | districts-excerpt.csv | 2 | `58dade494481c855bc50ee1d6f4c2bdd16bf2eb7e88ccc589c59dd2f71e973ea` | yes |

## Archive checks

- states: not checked (no archive path supplied).
- districts: not checked (no archive path supplied).

## Counts

| Entity | Read | Accepted (expected insertions) | Rejected |
|---|---|---|---|
| states | 2 | 2 | 0 |
| districts | 2 | 2 | 0 |

Of the accepted states: 1 states (S) and 1 union territories (U).

## Rejections by category

- malformed_row: 0
- invalid_value: 0
- duplicate: 0
- missing_parent: 0

## Parent checks

- Districts checked against accepted states: 2
- Districts with a missing or invalid parent state: 0
- Accepted states with no accepted district: 1

## Published totals

- States: expected 36, accepted 2 (DIFFERENT)
- Districts: expected 790, accepted 2 (DIFFERENT)

## Database

- Accessed: false. SQL executed: false. Records written: 0.
- Existing-record matches: not checked. The dry run has no database access, so matches against existing rows are unknown.

## Outputs

- states.normalised.csv (2 rows): `6cc53281de34f26871a1f29f66a503e565f486241a272f69fa466cd1f67b46de`
- districts.normalised.csv (2 rows): `72e89b1bba35f951eab0791f64614852a1978ff85b152ef7b528dd40c51a3105`
- lgd-crosswalk.csv (4 rows): `9c7bd3be6c138cf925c88a7d853d2989b3d43b1f3988c0759c758689f7a41437`

