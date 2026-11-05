/**
 * Import pipeline: analyse rows, deduplicate, batch, and build SQL.
 * Pure functions only. Nothing here connects to a database.
 *
 * Idempotency: every write is an upsert keyed on (source, external_id), matching the
 * partial unique indexes created in migration 0004. Re-running an identical file changes
 * nothing. No statement in this file deletes anything.
 */
import { ENTITIES, getEntity, validateRow, coordinateOf } from './entities.mjs';

export const DEFAULT_BATCH_SIZE = 500;

function contentKey(name, row) {
  const entity = getEntity(name);
  const fields = [...entity.required, ...entity.optional];
  return JSON.stringify(fields.map((f) => row[f] ?? ''));
}

function nameKey(value) {
  return value.normalize('NFC').replace(/\s+/g, ' ').trim().toLowerCase();
}

/**
 * Checks every row and returns:
 *  - accepted: rows that can be written, in file order
 *  - rejected: { line, externalId, errors } for rows that cannot
 *  - identicalDuplicates: repeated rows that were identical and therefore dropped
 *  - warnings: things that could not be checked in this run
 */
export function analyseRows(name, rows, options = {}) {
  const entity = getEntity(name);
  const rejected = [];
  const candidates = [];
  const warnings = [];

  for (const row of rows) {
    if (row.__problems && row.__problems.length > 0) {
      rejected.push({ line: row.__line, externalId: row.external_id ?? '', errors: row.__problems });
      continue;
    }
    const errors = validateRow(name, row);
    if (errors.length > 0) {
      rejected.push({ line: row.__line, externalId: row.external_id ?? '', errors });
    } else {
      candidates.push(row);
    }
  }

  // Duplicate external_id within the file: identical repeats are kept once; conflicting ones are rejected.
  const groups = new Map();
  for (const row of candidates) {
    groups.set(row.external_id, [...(groups.get(row.external_id) ?? []), row]);
  }
  let accepted = [];
  let identicalDuplicates = 0;
  for (const [externalId, group] of groups) {
    if (group.length === 1) {
      accepted.push(group[0]);
      continue;
    }
    const distinct = new Set(group.map((r) => contentKey(name, r)));
    if (distinct.size === 1) {
      identicalDuplicates += group.length - 1;
      accepted.push(group[0]);
    } else {
      for (const r of group) {
        rejected.push({ line: r.__line, externalId, errors: ['Conflicting rows share this external_id.'] });
      }
    }
  }
  accepted.sort((a, b) => a.__line - b.__line);

  // Parent links: checked only when the caller supplies the set of known parent IDs.
  if (entity.parentField) {
    if (options.knownParentIds) {
      const known = options.knownParentIds;
      accepted = accepted.filter((row) => {
        if (known.has(row[entity.parentField])) return true;
        rejected.push({
          line: row.__line,
          externalId: row.external_id,
          errors: [`${entity.parentField} "${row[entity.parentField]}" was not found in the parent data.`],
        });
        return false;
      });
    } else {
      warnings.push(`Parent check not run for ${entity.parentField}. Pass the parent file to verify links.`);
    }
  }

  // Duplicate names within the same parent (the database forbids them too).
  const seen = new Map();
  accepted = accepted.filter((row) => {
    const parent = entity.parentField ? row[entity.parentField] : '';
    const key = `${parent}|${nameKey(row.name)}`;
    const first = seen.get(key);
    if (first && first !== row.external_id) {
      rejected.push({
        line: row.__line,
        externalId: row.external_id,
        errors: [`Name "${row.name}" is already used by ${first} under the same parent.`],
      });
      return false;
    }
    seen.set(key, row.external_id);
    return true;
  });

  rejected.sort((a, b) => a.line - b.line);
  return { entity: name, totalRows: rows.length, accepted, rejected, identicalDuplicates, warnings };
}

export function chunk(items, size = DEFAULT_BATCH_SIZE) {
  if (!Number.isInteger(size) || size < 1) throw new Error('Batch size must be a positive whole number.');
  const batches = [];
  for (let i = 0; i < items.length; i += size) batches.push(items.slice(i, i + size));
  return batches;
}

const nullIfBlank = (v) => (v === undefined || v === '' ? null : v);

/**
 * Builds one parameterised upsert for a batch. Parent rows are looked up by
 * (source, external_id). Rows whose parent is missing are not inserted, so the caller
 * compares the row count with expectedRows and rolls back on any difference.
 */
export function buildStatement(name, batch, { source }) {
  const exts = batch.map((r) => r.external_id);
  const names = batch.map((r) => r.name);
  const coords = batch.map(coordinateOf);
  const lats = coords.map((c) => c.latitude);
  const lngs = coords.map((c) => c.longitude);
  const conflictTarget = '(source, external_id) where external_id is not null';

  if (name === 'states') {
    const countries = batch.map((r) => r.country_iso);
    const kinds = batch.map((r) => r.kind);
    const codes = batch.map((r) => nullIfBlank(r.code));
    return {
      expectedRows: batch.length,
      text: `
insert into public.states (country_id, name, kind, code, latitude, longitude, source, external_id)
select c.id, u.name, u.kind, u.code, u.latitude, u.longitude, $1, u.external_id
from unnest($2::text[], $3::text[], $4::text[], $5::text[], $6::float8[], $7::float8[], $8::text[])
  as u(external_id, name, kind, code, latitude, longitude, country_iso)
join public.countries c on c.iso_code = u.country_iso
on conflict ${conflictTarget} do update set
  name = excluded.name, kind = excluded.kind, code = excluded.code,
  latitude = excluded.latitude, longitude = excluded.longitude, updated_at = now()`,
      params: [source, exts, names, kinds, codes, lats, lngs, countries],
    };
  }

  const parents = batch.map((r) => r[ENTITIES[name].parentField]);
  const kindsOf = (field) => batch.map((r) => nullIfBlank(r[field]));

  if (name === 'districts') {
    return {
      expectedRows: batch.length,
      text: `
insert into public.districts (state_id, name, code, latitude, longitude, source, external_id)
select s.id, u.name, u.code, u.latitude, u.longitude, $1, u.external_id
from unnest($2::text[], $3::text[], $4::text[], $5::text[], $6::float8[], $7::float8[])
  as u(external_id, parent, name, code, latitude, longitude)
join public.states s on s.source = $1 and s.external_id = u.parent
on conflict ${conflictTarget} do update set
  name = excluded.name, state_id = excluded.state_id, code = excluded.code,
  latitude = excluded.latitude, longitude = excluded.longitude, updated_at = now()`,
      params: [source, exts, parents, names, kindsOf('code'), lats, lngs],
    };
  }

  if (name === 'cities') {
    return {
      expectedRows: batch.length,
      text: `
insert into public.cities (district_id, name, kind, latitude, longitude, source, external_id)
select d.id, u.name, u.kind, u.latitude, u.longitude, $1, u.external_id
from unnest($2::text[], $3::text[], $4::text[], $5::text[], $6::float8[], $7::float8[])
  as u(external_id, parent, name, kind, latitude, longitude)
join public.districts d on d.source = $1 and d.external_id = u.parent
on conflict ${conflictTarget} do update set
  name = excluded.name, district_id = excluded.district_id, kind = excluded.kind,
  latitude = excluded.latitude, longitude = excluded.longitude, updated_at = now()`,
      params: [source, exts, parents, names, kindsOf('kind'), lats, lngs],
    };
  }

  if (name === 'localities') {
    return {
      expectedRows: batch.length,
      text: `
insert into public.localities (city_id, name, latitude, longitude, source, external_id)
select c.id, u.name, u.latitude, u.longitude, $1, u.external_id
from unnest($2::text[], $3::text[], $4::text[], $5::float8[], $6::float8[])
  as u(external_id, parent, name, latitude, longitude)
join public.cities c on c.source = $1 and c.external_id = u.parent
on conflict ${conflictTarget} do update set
  name = excluded.name, city_id = excluded.city_id,
  latitude = excluded.latitude, longitude = excluded.longitude, updated_at = now()`,
      params: [source, exts, parents, names, lats, lngs],
    };
  }

  throw new Error(`No SQL template for entity "${name}".`);
}

/** Builds the full plan without touching a database. Written to a file for review. */
export function buildPlan(name, accepted, { source, sourceVersion, batchSize = DEFAULT_BATCH_SIZE }) {
  const batches = chunk(accepted, batchSize).map((batch, index) => {
    const statement = buildStatement(name, batch, { source });
    return { index: index + 1, rows: batch.length, expectedRows: statement.expectedRows, sql: statement.text, params: statement.params };
  });
  return {
    entity: name,
    source,
    sourceVersion,
    rowCount: accepted.length,
    batchSize,
    batchCount: batches.length,
    batches,
  };
}

/**
 * Runs batches inside ONE transaction. Any failure rolls the whole file back, so a
 * partial import never reaches the database. `client` needs query(text, params) returning { rowCount }.
 */
export async function applyBatches(client, { source, entity, batches }) {
  let written = 0;
  let batchesDone = 0;
  await client.query('BEGIN');
  try {
    for (const batch of batches) {
      const statement = buildStatement(entity, batch, { source });
      const result = await client.query(statement.text, statement.params);
      const affected = result.rowCount ?? 0;
      if (affected !== statement.expectedRows) {
        throw new Error(
          `Batch ${batchesDone + 1}: ${statement.expectedRows - affected} row(s) had no matching parent record. The whole file was rolled back.`,
        );
      }
      written += affected;
      batchesDone += 1;
    }
    await client.query('COMMIT');
    return { status: 'succeeded', rowsWritten: written, batchesDone };
  } catch (err) {
    await client.query('ROLLBACK');
    return { status: 'failed', rowsWritten: 0, batchesDone, error: err.message };
  }
}

/**
 * Records an import run around the transaction: start row, outcome, and every rejected row.
 * Tracking rows are written outside the data transaction, so a failed import is still recorded.
 */
export async function executeImport(client, { source, sourceVersion, entity, checksum, analysis, batches, createdBy }) {
  const start = await client.query(
    `insert into public.import_runs
       (source, source_version, entity, mode, status, rows_read, rows_rejected, file_checksum, created_by)
     values ($1, $2, $3, 'apply', 'running', $4, $5, $6, $7)
     returning id`,
    [source, sourceVersion, entity, analysis.totalRows, analysis.rejected.length, checksum, createdBy ?? null],
  );
  const runId = start.rows[0].id;

  if (analysis.rejected.length > 0) {
    await client.query(
      `insert into public.import_run_errors (run_id, line_number, external_id, message)
       select $1, u.line, u.external_id, u.message
       from unnest($2::int[], $3::text[], $4::text[]) as u(line, external_id, message)`,
      [
        runId,
        analysis.rejected.map((r) => r.line),
        analysis.rejected.map((r) => r.externalId ?? ''),
        analysis.rejected.map((r) => r.errors.join(' ')),
      ],
    );
  }

  const outcome = await applyBatches(client, { source, entity, batches });

  await client.query(
    `update public.import_runs
        set status = $2, rows_written = $3, error_summary = $4, finished_at = now()
      where id = $1`,
    [runId, outcome.status, outcome.rowsWritten, outcome.error ?? null],
  );
  return { runId, ...outcome };
}
