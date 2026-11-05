# LGD states and districts: local converter (dry run)

This converter turns the verified LGD states and districts files into the normalised import layout used by migration `0004`. It is a **dry run**. It reads two CSV files, writes three output files and a validation report to a folder you choose, and stops there. It does not connect to any database, does not execute SQL, and does not create cities, localities or PIN codes.

## Source and licence

- **Source:** Local Government Directory (LGD), Ministry of Panchayati Raj, Government of India. https://lgdirectory.gov.in/
- **Snapshot:** 4 November 2026, obtained from the ramSeraph/opendata `lgd-latest` release (https://github.com/ramSeraph/opendata/releases/tag/lgd-latest).
- **Licence:** Government Open Data License – India (GODL-India).
- **Attribution (kept in every report):** Source: Local Government Directory (LGD), Ministry of Panchayati Raj, Government of India (https://lgdirectory.gov.in/). Licensed under the Government Open Data License – India. Snapshot: 4 November 2026, obtained via ramSeraph/opendata (lgd-latest).

The repository's UNLICENSE covers only the code written by its author. It does not license the government data.

## Verified inputs

| File | Rows | SHA-256 of the 7z archive (published, verified) |
|---|---|---|
| `states.04Nov2026.csv` | 36 (28 states, 8 union territories) | `c6a67e4de9c3ecd3c13d3d8ff5cf8418822f83b4007b83e62a269b1d08c0311b` |
| `districts.04Nov2026.csv` | 790 | `7f0cdc9cc5d85b0af7d5c1ec2beb07a0137434d75e9c6fc178f2045815087884` |

The converter records a SHA-256 for the extracted CSV files as well. Verified expectations are stored in `localroots-location/config/lgd-sources.json`.

### Headers (exactly as in the files)

- States: `S.No.`, `State Code`, `State Version`, `State Name (In English)`, `State Name (In Local)`, `Census 2001 Code`, `Census 2011 Code`, `State or UT`
- Districts: `S.No.`, `State Code`, `State Name (In English)`, `District Code`, `District Name(In English)`, `Census 2001 Code`, `Census 2011 Code`

Note that the district header has no space before `(In English)` in `District Name(In English)`. The converter matches names exactly after lowercasing.

## Mapping

| LGD field | Normalised field | Rule |
|---|---|---|
| State Code | states `external_id` | Kept exactly (trimmed). Must be 1–6 digits. |
| State or UT | states `kind` | `S` → `state`, `U` → `union_territory`. Anything else is rejected. |
| State Name (In English) | states `name` | Whitespace collapsed. Must be non-empty, 200 characters or fewer. |
| (constant) | states `country_iso` | `IN` |
| District Code | districts `external_id` | Kept exactly (trimmed). Must be 1–6 digits. |
| State Code (districts file) | districts `state_external_id` | Must equal an accepted state's `external_id`. Otherwise rejected as a missing parent. |
| District Name(In English) | districts `name` | Whitespace collapsed. Must be non-empty, 200 characters or fewer. |
| Census 2001 / 2011 Code | not imported | Written to `lgd-crosswalk.csv` only, for traceability. |
| (constant) | source | `LGD` (recorded in the report and the crosswalk's provenance). |

Lat/long and the local-language names are not in these files, so they are left empty.

## Rejection rules

Each rejected row is listed with its line number, LGD code, name, and every problem found, grouped into one of four categories:

- `malformed_row`: wrong number of columns, or an unclosed quote.
- `invalid_value`: non-numeric code, bad state or UT value, empty or over-long name.
- `duplicate`: the same code appears more than once, or two rows in the same parent (state) share a name. **Every copy is rejected**, so a conflict is never resolved by guessing which copy is right.
- `missing_parent`: a district whose state code is not an accepted state.

All duplicate checks run against every valid row, so a name clash is never hidden by a separate code clash.

## Outputs

Written to the folder given with `--out`. Nothing else is written, and the input files are never modified.

| File | Contents |
|---|---|
| `states.normalised.csv` | Accepted states, sorted by LGD code, in the import layout |
| `districts.normalised.csv` | Accepted districts, sorted by LGD code, in the import layout |
| `lgd-crosswalk.csv` | Every accepted record with its raw name, normalised name, census codes and source line. Not imported. |
| `validation-report.json` | Machine-readable report: inputs, checksums, counts, rejections, parent checks, published-totals comparison, database status |
| `validation-report.md` | The same report for reading |

Output is deterministic: no timestamps, no absolute paths, and the same inputs always give the same bytes. The report includes the SHA-256 of each output file.

## How to run (your Mac)

Make sure your project contains the updated `localroots-location` folder from the foundation zip, then:

```bash
cd ~/Downloads/localroots-ai
node localroots-location/scripts/convert-lgd.mjs \
  --states ~/Downloads/lgd-raw/states.04Nov2026.csv \
  --districts ~/Downloads/lgd-raw/districts.04Nov2026.csv \
  --out ~/Downloads/lgd-raw/dry-run-output \
  --archive-states ~/Downloads/lgd-raw/states.04Nov2026.csv.7z \
  --archive-districts ~/Downloads/lgd-raw/districts.04Nov2026.csv.7z
echo "exit code: $?"
```

Then check repeatability by running it again into a second folder:

```bash
node localroots-location/scripts/convert-lgd.mjs \
  --states ~/Downloads/lgd-raw/states.04Nov2026.csv \
  --districts ~/Downloads/lgd-raw/districts.04Nov2026.csv \
  --out ~/Downloads/lgd-raw/dry-run-output-2 \
  --archive-states ~/Downloads/lgd-raw/states.04Nov2026.csv.7z \
  --archive-districts ~/Downloads/lgd-raw/districts.04Nov2026.csv.7z
diff -r ~/Downloads/lgd-raw/dry-run-output ~/Downloads/lgd-raw/dry-run-output-2 && echo "IDENTICAL"
```

Exit codes: `0` clean and matches the published totals; `1` rows rejected or totals differ; `2` error (including an archive that does not match its published checksum, in which case nothing is written).

## What the report must show for a clean run

- States: 36 read, 36 accepted (28 `state`, 8 `union_territory`), 0 rejected.
- Districts: 790 read, 790 accepted, 0 rejected, 0 with a missing parent.
- Both inputs `unchanged_during_run: true`.
- `database.accessed: false`, `sql_executed: false`, `records_written: 0`.

A rejection is not necessarily an error in the official data. It is a row the import rules cannot accept, and it needs a decision before import.

## Tests

`tests/unit/lgd-convert.test.mjs` covers: input headers and rejection of missing columns; UTF-8 strictness; preservation of every official identifier; S/U mapping and `IN`; parent mapping, missing parents and parents rejected upstream; duplicates of codes and names, including the case where a code clash used to hide a name clash; malformed rows; the scope (no cities, localities or PINs); the source, licence and attribution in the report; the no-database statement; input files unchanged; byte-identical repeat runs; order-independence; a golden comparison; refusal on archive checksum mismatch; no timestamps or absolute paths; and a static check that the converter contains no database or network code.

The fixtures in `tests/fixtures/lgd/` are two real excerpt rows from each file (states 35 and 28; districts 603 and 632) and synthetic rows marked `TEST`. The golden output in `tests/fixtures/lgd/expected/` comes from the excerpt, so its report correctly shows that the totals differ.

## Not done

- The full files have **not** been converted in this environment. Only the excerpts above were run here. The full run must be done on your Mac with the commands above.
- No database check. Existing-record matches are reported as not checked, because the dry run has no database access.
- Cities, localities and PIN codes are out of scope for these two files.
- Import into Supabase is not approved and has not happened.
