import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCsv } from '../../localroots-location/scripts/lib/csv.mjs';
import {
  DISTRICT_REQUIRED, STATE_REQUIRED, buildOutputs, convertDistricts, convertStates,
  decodeUtf8Strict, parseLgdCsv,
} from '../../localroots-location/scripts/lib/lgd.mjs';
import { ConvertError, convert, sha256 } from '../../localroots-location/scripts/convert-lgd.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIX = join(HERE, '..', 'fixtures', 'lgd');
const ROOT = join(HERE, '..', '..');
const read = (p) => readFileSync(p, 'utf8');
const states = () => parseLgdCsv(read(join(FIX, 'states-excerpt.csv')), STATE_REQUIRED);
const districts = () => parseLgdCsv(read(join(FIX, 'districts-excerpt.csv')), DISTRICT_REQUIRED);
const reasonsOf = (record) => record.problems.map((p) => p.category);

function scratch() {
  return mkdtempSync(join(tmpdir(), 'lgd-test-'));
}

// -------------------------------------------------------------- A: inspection-level checks on real headers
describe('input files (verified headers and rows)', () => {
  it('parses the states header, with lowercased names and the State or UT column', () => {
    const rows = states();
    assert.equal(rows.length, 2);
    assert.equal(rows[0]['state or ut'], 'U');
    assert.equal(rows[1]['state or ut'], 'S');
  });

  it('parses the districts header and keeps the quoted-free layout intact', () => {
    const rows = districts();
    assert.equal(rows[0]['district name(in english)'], 'Nicobars');
    assert.equal(rows[1]['district code'], '632');
  });

  it('rejects an input file that lacks a required column', () => {
    assert.throws(() => parseLgdCsv('S.No.,State Code\n1,35\n', STATE_REQUIRED), /Missing required column/);
  });

  it('rejects bytes that are not valid UTF-8 instead of silently replacing them', () => {
    assert.throws(() => decodeUtf8Strict(Buffer.from([0x53, 0xff, 0xfe])), TypeError);
  });
});

// -------------------------------------------------------------- ID preservation
describe('official identifiers are preserved', () => {
  it('uses the LGD state code as the state external_id, unchanged', () => {
    const { accepted } = convertStates(states());
    assert.deepEqual(accepted.map((s) => s.code), ['28', '35']);
  });

  it('uses the LGD district code as the district external_id, unchanged', () => {
    const { accepted: s } = convertStates(states());
    const { accepted } = convertDistricts(districts(), s);
    assert.deepEqual(accepted.map((d) => d.code), ['603', '632']);
  });

  it('keeps census codes out of the import but in the crosswalk', () => {
    const { accepted: s } = convertStates(states());
    const { accepted: d } = convertDistricts(districts(), s);
    const out = buildOutputs(s, d);
    assert.equal(out.states.split('\n')[0].includes('census'), false);
    assert.match(out.crosswalk, /districts,603,35,Nicobars,Nicobars,,2,638,2/);
  });

  it('never sets a short code (the code column is left empty for LGD rows)', () => {
    const { accepted: s } = convertStates(states());
    const { accepted: d } = convertDistricts(districts(), s);
    const out = buildOutputs(s, d);
    for (const line of out.states.trim().split('\n').slice(1)) assert.equal(line.split(',')[3], '');
  });
});

// -------------------------------------------------------------- kind and country mapping
describe('state kind and country', () => {
  it('maps S to state and U to union_territory', () => {
    const out = buildOutputs(convertStates(states()).accepted, []);
    assert.match(out.states, /^28,Andhra Pradesh,state,,IN,,$/m);
    assert.match(out.states, /^35,Andaman And Nicobar Islands,union_territory,,IN,,$/m);
  });

  it('sets country_iso to IN for every state', () => {
    const out = buildOutputs(convertStates(states()).accepted, []);
    for (const line of out.states.trim().split('\n').slice(1)) assert.equal(line.split(',')[4], 'IN');
  });
});

// -------------------------------------------------------------- parent-child relationships
describe('district to state parent mapping', () => {
  it('maps each district to its parent state code', () => {
    const { accepted: s } = convertStates(states());
    const { accepted: d } = convertDistricts(districts(), s);
    assert.ok(d.every((x) => x.stateCode === '35'));
  });

  it('rejects a district whose parent is not in the states file, and says why', () => {
    const { accepted: s } = convertStates(states());
    const rows = parseLgdCsv('S.No.,State Code,State Name (In English),District Code,District Name(In English)\n1,999,X,9001,Orphan\n',
      DISTRICT_REQUIRED);
    const out = convertDistricts(rows, s);
    assert.equal(out.accepted.length, 0);
    assert.deepEqual(reasonsOf(out.rejected[0]), ['missing_parent']);
    assert.match(out.rejected[0].problems[0].message, /Parent state 999/);
  });

  it('rejects a district whose parent state was itself rejected', () => {
    const badStates = parseLgdCsv('S.No.,State Code,State Name (In English),State or UT\n1,35,,U\n', STATE_REQUIRED);
    const { accepted } = convertStates(badStates);
    const out = convertDistricts(districts(), accepted);
    assert.equal(out.accepted.length, 0);
    assert.equal(out.rejected.every((r) => reasonsOf(r).includes('missing_parent')), true);
  });

  it('reports states that have no accepted district', () => {
    const { accepted: s } = convertStates(states());
    const { accepted: d } = convertDistricts(districts(), s);
    const withoutDistricts = s.filter((x) => !d.some((y) => y.stateCode === x.code)).map((x) => x.code);
    assert.deepEqual(withoutDistricts, ['28']);
  });
});

// -------------------------------------------------------------- duplicates
describe('duplicate detection', () => {
  const malformedStates = () => parseLgdCsv(read(join(FIX, 'states-malformed.csv')), STATE_REQUIRED);

  it('rejects every copy of a duplicated state code', () => {
    const out = convertStates(malformedStates());
    const codes = out.rejected.filter((r) => r.lgd_code === '93');
    assert.equal(codes.length, 2);
    assert.ok(codes.every((r) => reasonsOf(r).includes('duplicate')));
  });

  it('rejects a state name repeated under another code, even when a code clash hides it elsewhere', () => {
    const out = convertStates(malformedStates());
    const name = out.rejected.find((r) => r.lgd_code === '94');
    assert.ok(name, 'state 94 with the same name as state 93 must be rejected');
    assert.ok(reasonsOf(name).includes('duplicate'));
  });

  it('rejects both copies of a district name repeated within one state', () => {
    const { accepted: s } = convertStates(states());
    const rows = parseLgdCsv(read(join(FIX, 'districts-malformed.csv')), DISTRICT_REQUIRED);
    const out = convertDistricts(rows, s);
    const same = out.rejected.filter((r) => r.lgd_code === '9003' || r.lgd_code === '9004');
    assert.equal(same.length, 2);
  });

  it('keeps a valid district that shares a name with a district in a different state', () => {
    const s = parseLgdCsv('S.No.,State Code,State Name (In English),State or UT\n1,35,A,U\n2,28,B,S\n', STATE_REQUIRED);
    const accepted = convertStates(s).accepted;
    const rows = parseLgdCsv('S.No.,State Code,State Name (In English),District Code,District Name(In English)\n1,35,A,1001,Same\n2,28,B,1002,Same\n',
      DISTRICT_REQUIRED);
    assert.equal(convertDistricts(rows, accepted).accepted.length, 2);
  });
});

// -------------------------------------------------------------- malformed and incomplete records
describe('malformed and incomplete records', () => {
  const malformedStates = () => parseLgdCsv(read(join(FIX, 'states-malformed.csv')), STATE_REQUIRED);
  const malformedDistricts = () => parseLgdCsv(read(join(FIX, 'districts-malformed.csv')), DISTRICT_REQUIRED);

  it('rejects a non-numeric state code', () => {
    const rec = convertStates(malformedStates()).rejected.find((r) => r.lgd_code === 'ABC');
    assert.ok(rec && reasonsOf(rec).includes('invalid_value'));
  });

  it('rejects a state or UT value other than S or U', () => {
    const rec = convertStates(malformedStates()).rejected.find((r) => r.lgd_code === '91');
    assert.ok(rec && rec.problems.some((p) => /must be S or U/.test(p.message)));
  });

  it('rejects an empty state name', () => {
    const rec = convertStates(malformedStates()).rejected.find((r) => r.lgd_code === '92');
    assert.ok(rec && rec.problems.some((p) => /empty/.test(p.message)));
  });

  it('rejects a row with the wrong number of columns, and labels it malformed', () => {
    const rec = convertStates(malformedStates()).rejected.find((r) => r.lgd_code === '95');
    assert.ok(rec && reasonsOf(rec).includes('malformed_row'));
  });

  it('rejects a district with a non-numeric code', () => {
    const rec = convertDistricts(malformedDistricts(), convertStates(states()).accepted).rejected.find((r) => r.lgd_code === 'ABC');
    assert.ok(rec && reasonsOf(rec).includes('invalid_value'));
  });

  it('keeps the one valid district in the malformed file', () => {
    const out = convertDistricts(malformedDistricts(), convertStates(states()).accepted);
    assert.deepEqual(out.accepted.map((d) => d.code), ['9005']);
  });
});

// -------------------------------------------------------------- source, boundaries and scope
describe('scope and provenance', () => {
  it('produces states, districts, crosswalk and report only (no cities, localities or PINs)', async () => {
    const dir = scratch();
    try {
      await convert({ statesPath: join(FIX, 'states-excerpt.csv'), districtsPath: join(FIX, 'districts-excerpt.csv'), outDir: dir });
      assert.deepEqual(readdirSync(dir).sort(), [
        'districts.normalised.csv', 'lgd-crosswalk.csv', 'states.normalised.csv',
        'validation-report.json', 'validation-report.md',
      ]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('records the LGD source, the GODL-India licence and the attribution in the report', async () => {
    const dir = scratch();
    try {
      const report = await convert({ statesPath: join(FIX, 'states-excerpt.csv'), districtsPath: join(FIX, 'districts-excerpt.csv'), outDir: dir });
      assert.equal(report.source, 'LGD');
      assert.match(report.licence, /GODL-India/);
      assert.match(report.attribution, /Ministry of Panchayati Raj/);
      assert.match(report.attribution, /lgdirectory\.gov\.in/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('reports the database as untouched and the existing-record check as not performed', async () => {
    const dir = scratch();
    try {
      const report = await convert({ statesPath: join(FIX, 'states-excerpt.csv'), districtsPath: join(FIX, 'districts-excerpt.csv'), outDir: dir });
      assert.deepEqual(report.database, { accessed: false, sql_executed: false, records_written: 0 });
      assert.equal(report.existing_record_matches.checked, false);
      assert.equal(report.expected_insertions.cities, 0);
      assert.equal(report.expected_insertions.localities, 0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('flags excerpt totals as different from the published totals rather than passing them', async () => {
    const dir = scratch();
    try {
      const report = await convert({ statesPath: join(FIX, 'states-excerpt.csv'), districtsPath: join(FIX, 'districts-excerpt.csv'), outDir: dir });
      assert.equal(report.published_totals.matches.states, false);
      assert.equal(report.published_totals.matches.districts, false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

// -------------------------------------------------------------- D: integrity and repeatability
describe('integrity and repeatability', () => {
  it('leaves the input files byte-identical after the run', async () => {
    const before = sha256(readFileSync(join(FIX, 'states-excerpt.csv')));
    const dir = scratch();
    try {
      const report = await convert({ statesPath: join(FIX, 'states-excerpt.csv'), districtsPath: join(FIX, 'districts-excerpt.csv'), outDir: dir });
      assert.equal(report.inputs[0].sha256, before);
      assert.ok(report.inputs.every((i) => i.unchanged_during_run));
      assert.equal(sha256(readFileSync(join(FIX, 'states-excerpt.csv'))), before);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('produces identical bytes on two runs with the same inputs', async () => {
    const a = scratch();
    const b = scratch();
    try {
      await convert({ statesPath: join(FIX, 'states-excerpt.csv'), districtsPath: join(FIX, 'districts-excerpt.csv'), outDir: a });
      await convert({ statesPath: join(FIX, 'states-excerpt.csv'), districtsPath: join(FIX, 'districts-excerpt.csv'), outDir: b });
      for (const name of readdirSync(a)) {
        assert.equal(sha256(readFileSync(join(a, name))), sha256(readFileSync(join(b, name))), `${name} differs between runs`);
      }
    } finally {
      rmSync(a, { recursive: true, force: true });
      rmSync(b, { recursive: true, force: true });
    }
  });

  it('produces the same output whatever order the input rows arrive in', () => {
    const forward = convertStates(states());
    const reversed = convertStates(parseCsv(read(join(FIX, 'states-excerpt.csv')), STATE_REQUIRED).reverse());
    assert.deepEqual(forward.accepted.map((s) => s.code), reversed.accepted.map((s) => s.code));
    assert.equal(buildOutputs(forward.accepted, []).states, buildOutputs(reversed.accepted, []).states);
  });

  it('matches the committed golden output byte for byte', async () => {
    const dir = scratch();
    try {
      await convert({ statesPath: join(FIX, 'states-excerpt.csv'), districtsPath: join(FIX, 'districts-excerpt.csv'), outDir: dir });
      for (const name of readdirSync(join(FIX, 'expected'))) {
        assert.equal(readFileSync(join(dir, name), 'utf8'), readFileSync(join(FIX, 'expected', name), 'utf8'), `${name} changed`);
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('refuses to proceed when an archive does not match its published checksum, and writes nothing', async () => {
    const dir = scratch();
    const fake = join(dir, 'fake.7z');
    writeFileSync(fake, 'not the real archive');
    const out = join(dir, 'out');
    try {
      await assert.rejects(
        convert({ statesPath: join(FIX, 'states-excerpt.csv'), districtsPath: join(FIX, 'districts-excerpt.csv'), outDir: out, archives: { states: fake } }),
        ConvertError,
      );
      assert.equal(readdirSync(dir).includes('out'), false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('the report contains no timestamps and no absolute paths', () => {
    const json = readFileSync(join(FIX, 'expected', 'validation-report.json'), 'utf8');
    assert.doesNotMatch(json, /\d{4}-\d{2}-\d{2}T/);
    assert.doesNotMatch(json, /\/Users\/|\/tmp\/|[A-Za-z]:\\/);
  });
});

// -------------------------------------------------------------- configuration and no-database guarantee
describe('configuration and guarantees', () => {
  it('stores verified archive checksums and the snapshot in the config', () => {
    const cfg = JSON.parse(read(join(ROOT, 'localroots-location', 'config', 'lgd-sources.json')));
    assert.match(cfg.archives.states.sha256, /^[0-9a-f]{64}$/);
    assert.match(cfg.archives.districts.sha256, /^[0-9a-f]{64}$/);
    assert.equal(cfg.snapshot, '04Nov2026');
    assert.equal(cfg.expectedCounts.districts, 790);
    assert.equal(cfg.expectedCounts.statesStates + cfg.expectedCounts.statesUnionTerritories, cfg.expectedCounts.states);
  });

  it('the converter and its rules contain no database access and no SQL execution', () => {
    const files = [
      join(ROOT, 'localroots-location', 'scripts', 'convert-lgd.mjs'),
      join(ROOT, 'localroots-location', 'scripts', 'lib', 'lgd.mjs'),
    ];
    for (const f of files) {
      const code = read(f).replace(/\/\/.*$/gm, '');
      assert.doesNotMatch(code, /from ['"](pg|postgres|@supabase\/[^'"]*)['"]/, `${f} imports a database client`);
      assert.doesNotMatch(code, /\.query\(|\bfetch\(|\bdelete\s+from\b|\binsert\s+into\b/i, `${f} contains database or network code`);
    }
  });
});
