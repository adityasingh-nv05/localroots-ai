import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CsvError, parseCsv, parseCsvLine, stripBom } from '../../localroots-location/scripts/lib/csv.mjs';
import { validateRow } from '../../localroots-location/scripts/lib/entities.mjs';
import {
  analyseRows, applyBatches, buildPlan, buildStatement, chunk, executeImport,
} from '../../localroots-location/scripts/lib/pipeline.mjs';
import { parseArgs, run } from '../../localroots-location/scripts/import-location.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(HERE, '..', 'fixtures', 'location');
const fixture = (name) => readFileSync(join(FIXTURES, name), 'utf8');
const ROOT = process.env.PROJECT_ROOT ?? join(HERE, '..', '..');

const STATE = { external_id: 'S1', name: 'Alpha State', kind: 'state', code: '', country_iso: 'IN', latitude: '', longitude: '' };
const DISTRICT = { external_id: 'D1', name: 'Alpha District', state_external_id: 'S1', code: '', latitude: '', longitude: '' };

// ---------------------------------------------------------------- CSV parsing
describe('CSV parsing', () => {
  it('strips a byte-order mark', () => {
    assert.equal(stripBom('\ufeffabc'), 'abc');
    assert.equal(stripBom('abc'), 'abc');
  });

  it('handles quoted commas and "" escapes', () => {
    assert.deepEqual(parseCsvLine('1,"Test, Name","He said ""hi"""'), ['1', 'Test, Name', 'He said "hi"']);
  });

  it('accepts CRLF line endings and ignores blank lines', () => {
    const rows = parseCsv('a,b\r\n1,2\r\n\r\n3,4\r\n', ['a', 'b']);
    assert.equal(rows.length, 2);
    assert.equal(rows[1].b, '4');
  });

  it('reports the line number of each row', () => {
    const rows = parseCsv('a,b\n1,2\n3,4\n', ['a', 'b']);
    assert.deepEqual(rows.map((r) => r.__line), [2, 3]);
  });

  it('refuses an empty file', () => {
    assert.throws(() => parseCsv('', ['a']), CsvError);
    assert.throws(() => parseCsv('\n\n', ['a']), CsvError);
  });

  it('refuses a file with a missing required column', () => {
    assert.throws(() => parseCsv('a,b\n1,2\n', ['a', 'c']), /Missing required column\(s\): c/);
  });

  it('refuses duplicate column names', () => {
    assert.throws(() => parseCsv('a,a\n1,2\n', ['a']), /Duplicate column/);
  });

  it('flags a row with the wrong number of columns instead of guessing', () => {
    const rows = parseCsv('a,b\n1\n', ['a', 'b']);
    assert.ok(rows[0].__problems.some((p) => /Expected 2 columns/.test(p)));
  });

  it('flags an unclosed quote on a row', () => {
    const rows = parseCsv('a,b\n"1,2\n', ['a', 'b']);
    assert.ok(rows[0].__problems.length > 0);
  });
});

// ---------------------------------------------------------------- row rules
describe('row validation', () => {
  it('accepts a valid state, district, city and locality', () => {
    assert.deepEqual(validateRow('states', STATE), []);
    assert.deepEqual(validateRow('districts', DISTRICT), []);
    assert.deepEqual(validateRow('cities', { external_id: 'C1', name: 'Alpha City', district_external_id: 'D1', kind: 'city' }), []);
    assert.deepEqual(validateRow('localities', { external_id: 'L1', name: 'Alpha Area', city_external_id: 'C1' }), []);
  });

  it('requires the required columns', () => {
    assert.ok(validateRow('districts', { ...DISTRICT, name: '' }).some((e) => /name is required/.test(e)));
    assert.ok(validateRow('districts', { ...DISTRICT, state_external_id: '' }).some((e) => /state_external_id is required/.test(e)));
  });

  it('rejects an external_id with spaces or unsafe characters', () => {
    assert.ok(validateRow('states', { ...STATE, external_id: 'bad id' }).length > 0);
    assert.ok(validateRow('states', { ...STATE, external_id: "x'; drop" }).length > 0);
  });

  it('rejects an unknown state kind and an unknown settlement kind', () => {
    assert.ok(validateRow('states', { ...STATE, kind: 'province' }).length > 0);
    assert.ok(validateRow('cities', { external_id: 'C1', name: 'X', district_external_id: 'D1', kind: 'hamlet' }).length > 0);
  });

  it('supports only India in this build', () => {
    assert.ok(validateRow('states', { ...STATE, country_iso: 'US' }).some((e) => /Only India/.test(e)));
  });

  it('rejects latitude without longitude, and out-of-range values', () => {
    assert.ok(validateRow('districts', { ...DISTRICT, latitude: '12.9' }).some((e) => /given together/.test(e)));
    assert.ok(validateRow('districts', { ...DISTRICT, latitude: '95', longitude: '10' }).some((e) => /between -90/.test(e)));
    assert.ok(validateRow('districts', { ...DISTRICT, latitude: 'north', longitude: '10' }).some((e) => /not a number/.test(e)));
  });
});

// ---------------------------------------------------------------- analysis and deduplication
describe('analysis and deduplication', () => {
  it('keeps one copy of identical repeated rows and reports the count', () => {
    const rows = parseCsv('external_id,name,state_external_id\nD1,Alpha,S1\nD1,Alpha,S1\n', ['external_id', 'name', 'state_external_id']);
    const a = analyseRows('districts', rows);
    assert.equal(a.accepted.length, 1);
    assert.equal(a.identicalDuplicates, 1);
    assert.equal(a.rejected.length, 0);
  });

  it('rejects every copy when repeated external_ids carry different content', () => {
    const rows = parseCsv('external_id,name,state_external_id\nD1,Alpha,S1\nD1,Beta,S1\n', ['external_id', 'name', 'state_external_id']);
    const a = analyseRows('districts', rows);
    assert.equal(a.accepted.length, 0);
    assert.equal(a.rejected.length, 2);
    assert.match(a.rejected[0].errors[0], /Conflicting rows/);
  });

  it('rejects a second district with the same name under the same state', () => {
    const rows = parseCsv('external_id,name,state_external_id\nD1,Alpha,S1\nD2,alpha ,S1\n', ['external_id', 'name', 'state_external_id']);
    const a = analyseRows('districts', rows);
    assert.deepEqual(a.accepted.map((r) => r.external_id), ['D1']);
    assert.match(a.rejected[0].errors[0], /already used/);
  });

  it('allows the same district name under a different state', () => {
    const rows = parseCsv('external_id,name,state_external_id\nD1,Alpha,S1\nD2,Alpha,S2\n', ['external_id', 'name', 'state_external_id']);
    assert.equal(analyseRows('districts', rows).accepted.length, 2);
  });

  it('rejects a child whose parent is not in the supplied parent set', () => {
    const rows = parseCsv('external_id,name,state_external_id\nD1,Alpha,S9\n', ['external_id', 'name', 'state_external_id']);
    const a = analyseRows('districts', rows, { knownParentIds: new Set(['S1']) });
    assert.equal(a.accepted.length, 0);
    assert.match(a.rejected[0].errors[0], /not found in the parent data/);
  });

  it('warns, rather than guessing, when no parent set is supplied', () => {
    const rows = parseCsv('external_id,name,state_external_id\nD1,Alpha,S9\n', ['external_id', 'name', 'state_external_id']);
    const a = analyseRows('districts', rows);
    assert.equal(a.accepted.length, 1);
    assert.ok(a.warnings.some((w) => /Parent check not run/.test(w)));
  });

  it('keeps file order and line numbers for rejected rows', () => {
    const rows = parseCsv('external_id,name,state_external_id\n,Missing,S1\nD1,Ok,S1\n', ['external_id', 'name', 'state_external_id']);
    const a = analyseRows('districts', rows);
    assert.equal(a.rejected[0].line, 2);
    assert.equal(a.accepted[0].external_id, 'D1');
  });
});

// ---------------------------------------------------------------- batching and SQL
describe('batching and SQL generation', () => {
  it('splits rows into batches of the requested size', () => {
    assert.deepEqual(chunk([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);
    assert.deepEqual(chunk([], 2), []);
    assert.throws(() => chunk([1], 0), /positive whole number/);
  });

  it('builds an idempotent upsert keyed on (source, external_id)', () => {
    const s = buildStatement('districts', [{ external_id: 'D1', name: 'A', state_external_id: 'S1', code: '', latitude: '', longitude: '' }], { source: 'LGD' });
    assert.match(s.text, /on conflict \(source, external_id\) where external_id is not null do update/);
  });

  it('uses parameters rather than inserting values into the SQL text', () => {
    const row = { external_id: "D1'); drop table x; --", name: 'A', state_external_id: 'S1', code: '', latitude: '', longitude: '' };
    const s = buildStatement('districts', [row], { source: 'LGD' });
    assert.doesNotMatch(s.text, /drop table/);
    assert.ok(s.params.some((p) => Array.isArray(p) && p.includes(row.external_id)));
  });

  it('looks up each parent by source and external_id', () => {
    assert.match(buildStatement('districts', [DISTRICT], { source: 'LGD' }).text, /join public\.states s on s\.source = \$1 and s\.external_id = u\.parent/);
    assert.match(buildStatement('cities', [{ external_id: 'C1', name: 'X', district_external_id: 'D1', kind: 'city', latitude: '', longitude: '' }], { source: 'LGD' }).text, /join public\.districts d/);
    assert.match(buildStatement('localities', [{ external_id: 'L1', name: 'X', city_external_id: 'C1', latitude: '', longitude: '' }], { source: 'LGD' }).text, /join public\.cities c on c\.source/);
  });

  it('never generates a delete statement', () => {
    for (const entity of ['states', 'districts', 'cities', 'localities']) {
      const row = entity === 'states' ? STATE : entity === 'districts' ? DISTRICT : { external_id: 'X1', name: 'X', district_external_id: 'D1', city_external_id: 'C1', kind: 'city', latitude: '', longitude: '' };
      assert.doesNotMatch(buildStatement(entity, [row], { source: 'LGD' }).text, /\bdelete\b/i);
    }
  });

  it('builds a plan with batch counts and expected row counts', () => {
    const rows = [1, 2, 3].map((n) => ({ external_id: `S${n}`, name: `State ${n}`, kind: 'state', code: '', country_iso: 'IN', latitude: '', longitude: '' }));
    const plan = buildPlan('states', rows, { source: 'LGD', sourceVersion: 'v1', batchSize: 2 });
    assert.equal(plan.batchCount, 2);
    assert.deepEqual(plan.batches.map((b) => b.expectedRows), [2, 1]);
  });
});

// ---------------------------------------------------------------- transactions (fake client, no database)
function fakeClient({ rowCounts = [], failOn = null } = {}) {
  const log = [];
  let i = 0;
  return {
    log,
    async query(text, params) {
      const label = String(text).trim().split(/\s+/).slice(0, 2).join(' ').toLowerCase();
      log.push(label);
      if (failOn && label.startsWith(failOn)) throw new Error(`simulated failure at ${failOn}`);
      if (/insert into public\.import_runs/.test(text)) return { rowCount: 1, rows: [{ id: 'run-1' }] };
      if (label === 'insert into') {
        const n = rowCounts[i] ?? (params?.[1]?.length ?? 1);
        i += 1;
        return { rowCount: n, rows: [] };
      }
      return { rowCount: 0, rows: [] };
    },
  };
}

describe('transaction handling', () => {
  const batch = [DISTRICT, { ...DISTRICT, external_id: 'D2', name: 'Beta District' }];

  it('commits when every batch writes the expected number of rows', async () => {
    const client = fakeClient();
    const out = await applyBatches(client, { source: 'LGD', entity: 'districts', batches: [batch] });
    assert.equal(out.status, 'succeeded');
    assert.equal(out.rowsWritten, 2);
    assert.equal(client.log[0], 'begin');
    assert.equal(client.log.at(-1), 'commit');
  });

  it('rolls back the whole file when a parent is missing (row count differs)', async () => {
    const client = fakeClient({ rowCounts: [1] });
    const out = await applyBatches(client, { source: 'LGD', entity: 'districts', batches: [batch] });
    assert.equal(out.status, 'failed');
    assert.equal(out.rowsWritten, 0);
    assert.match(out.error, /no matching parent record/);
    assert.equal(client.log.at(-1), 'rollback');
    assert.ok(!client.log.includes('commit'));
  });

  it('rolls back and reports when a statement throws', async () => {
    const client = fakeClient({ failOn: 'insert into' });
    const out = await applyBatches(client, { source: 'LGD', entity: 'districts', batches: [batch] });
    assert.equal(out.status, 'failed');
    assert.equal(client.log.at(-1), 'rollback');
  });

  it('records the run, its rejected rows and its outcome, and never issues a delete', async () => {
    const client = fakeClient();
    const rows = parseCsv('external_id,name,state_external_id\nD1,A,S1\n,Bad,S1\n', ['external_id', 'name', 'state_external_id']);
    const analysis = analyseRows('districts', rows);
    const out = await executeImport(client, {
      source: 'LGD', sourceVersion: 'v1', entity: 'districts', checksum: 'abc',
      analysis, batches: [analysis.accepted], createdBy: null,
    });
    assert.equal(out.status, 'succeeded');
    assert.equal(out.runId, 'run-1');
    assert.ok(client.log.some((s) => s === 'insert into'));
    assert.ok(client.log.includes('update public.import_runs'));
    assert.ok(!client.log.some((s) => s.startsWith('delete')));
  });
});

// ---------------------------------------------------------------- fixtures end to end (dry run)
describe('synthetic fixtures (dry run)', () => {
  it('accepts every row in the sample hierarchy', () => {
    const states = analyseRows('states', parseCsv(fixture('states.csv'), requiredColumnsOf('states')));
    const stateIds = new Set(states.accepted.map((r) => r.external_id));
    const districts = analyseRows('districts', parseCsv(fixture('districts.csv'), requiredColumnsOf('districts')), { knownParentIds: stateIds });
    const districtIds = new Set(districts.accepted.map((r) => r.external_id));
    const cities = analyseRows('cities', parseCsv(fixture('cities.csv'), requiredColumnsOf('cities')), { knownParentIds: districtIds });
    const cityIds = new Set(cities.accepted.map((r) => r.external_id));
    const localities = analyseRows('localities', parseCsv(fixture('localities.csv'), requiredColumnsOf('localities')), { knownParentIds: cityIds });

    assert.equal(states.accepted.length, 2);
    assert.equal(districts.accepted.length, 3);
    assert.equal(cities.accepted.length, 2);
    assert.equal(localities.accepted.length, 1);
    for (const a of [states, districts, cities, localities]) assert.equal(a.rejected.length, 0);
  });

  it('keeps synthetic records clearly labelled as sample data', () => {
    for (const f of ['states.csv', 'districts.csv', 'cities.csv', 'localities.csv']) {
      assert.match(fixture(f), /SAMPLE-|Sample /, `${f} is not labelled as sample data`);
    }
  });

  it('the CLI dry run exits 0 for clean input and 1 when rows are rejected', async () => {
    const quietLog = console.log;
    const quietErr = console.error;
    console.log = () => {};
    console.error = () => {};
    try {
      assert.equal(await run(['states', join(FIXTURES, 'states.csv')]), 0);
      assert.equal(await run(['cities', join(FIXTURES, 'cities.csv'), '--parents', join(FIXTURES, 'districts.csv')]), 0);
    } finally {
      console.log = quietLog;
      console.error = quietErr;
    }
  });

  it('the CLI refuses PIN codes and apply mode', async () => {
    const quietErr = console.error;
    const quietLog = console.log;
    console.error = () => {};
    console.log = () => {};
    try {
      assert.equal(await run(['pincodes', join(FIXTURES, 'states.csv')]), 2);
      assert.equal(await run(['states', join(FIXTURES, 'states.csv'), '--apply']), 3);
    } finally {
      console.error = quietErr;
      console.log = quietLog;
    }
  });

  it('parses the command line options', () => {
    const o = parseArgs(['districts', 'f.csv', '--parents', 'p.csv', '--source-version', 'v1', '--batch-size', '100']);
    assert.equal(o.parents, 'p.csv');
    assert.equal(o.sourceVersion, 'v1');
    assert.equal(o.batchSize, 100);
    assert.equal(o.apply, false);
  });
});

// ---------------------------------------------------------------- no deletion anywhere in the pipeline
describe('the pipeline never deletes records', () => {
  it('no library file contains a delete statement', () => {
    const dir = join(ROOT, 'localroots-location', 'scripts', 'lib');
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.mjs'))) {
      const code = readFileSync(join(dir, f), 'utf8').replace(/\/\/.*$/gm, '');
      assert.doesNotMatch(code, /\bdelete\s+from\b/i, `${f} contains a delete`);
    }
  });

  it('the migration for tracking tables contains no destructive statements', () => {
    const sql = readFileSync(join(ROOT, 'supabase', 'migrations', '0005_import_tracking.sql'), 'utf8').replace(/--.*$/gm, '');
    assert.doesNotMatch(sql, /\bdrop\s+(table|column|schema)\b/i);
    assert.doesNotMatch(sql, /\bdelete\s+from\b/i);
    assert.match(sql, /alter table public\.import_runs enable row level security/);
    assert.match(sql, /alter table public\.import_run_errors enable row level security/);
    assert.doesNotMatch(sql, /for (insert|update|delete) on public\.import_/i);
  });
});

function requiredColumnsOf(name) {
  return { states: ['external_id', 'name', 'kind', 'country_iso'], districts: ['external_id', 'name', 'state_external_id'],
    cities: ['external_id', 'name', 'district_external_id', 'kind'], localities: ['external_id', 'name', 'city_external_id'] }[name];
}
