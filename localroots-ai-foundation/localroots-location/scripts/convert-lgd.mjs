#!/usr/bin/env node
/**
 * LGD states and districts converter: DRY RUN ONLY.
 *
 *   node localroots-location/scripts/convert-lgd.mjs \
 *     --states <states.csv> --districts <districts.csv> --out <folder> \
 *     [--archive-states <states.04Nov2026.csv.7z>] [--archive-districts <districts.04Nov2026.csv.7z>]
 *
 * What it does:
 *   1. Reads both CSV files as bytes. It never writes to them.
 *   2. Records SHA-256 checksums before and after, and fails the run if either changed.
 *   3. Optionally checks the original .7z archives against the published checksums.
 *   4. Converts both files into the normalised import layout (see lib/lgd.mjs).
 *   5. Writes three CSV files and a validation report (JSON and Markdown) to <folder>.
 *
 * What it does NOT do: connect to any database, execute SQL, or create cities or localities.
 * The report says so explicitly, and records the database access as false.
 *
 * Output contains no timestamps or absolute paths, so the same inputs always produce the same bytes.
 *
 * Exit codes: 0 = clean and matches the published totals; 1 = rows rejected or totals differ; 2 = error.
 */
import { promises as fs } from 'node:fs';
import { createHash } from 'node:crypto';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  DISTRICT_REQUIRED, LGD_SOURCE, STATE_REQUIRED,
  convertDistricts, convertStates, buildOutputs, decodeUtf8Strict, parseLgdCsv,
} from './lib/lgd.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_CONFIG = join(HERE, '..', 'config', 'lgd-sources.json');

export const OUTPUT_FILES = {
  states: 'states.normalised.csv',
  districts: 'districts.normalised.csv',
  crosswalk: 'lgd-crosswalk.csv',
};

export class ConvertError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConvertError';
  }
}

export function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function countByCategory(rejected) {
  const counts = { malformed_row: 0, invalid_value: 0, duplicate: 0, missing_parent: 0 };
  for (const record of rejected) {
    for (const p of record.problems) counts[p.category] += 1;
  }
  return counts;
}

function renderMarkdown(report) {
  const lines = [];
  lines.push('# LGD dry-run validation report');
  lines.push('');
  lines.push(`Source: ${report.source}  |  Snapshot: ${report.snapshot}`);
  lines.push(`Licence: ${report.licence}`);
  lines.push('');
  lines.push(`> ${report.attribution}`);
  lines.push('');
  lines.push('## Inputs (read-only, checksums recorded)');
  lines.push('');
  lines.push('| Role | File | Rows read | SHA-256 | Unchanged during run |');
  lines.push('|---|---|---|---|---|');
  for (const input of report.inputs) {
    lines.push(`| ${input.role} | ${input.file} | ${input.rows_read} | \`${input.sha256}\` | ${input.unchanged_during_run ? 'yes' : 'NO'} |`);
  }
  lines.push('');
  lines.push('## Archive checks');
  lines.push('');
  for (const role of ['states', 'districts']) {
    const a = report.archive_checks[role];
    lines.push(a.checked
      ? `- ${role}: ${a.file} ${a.verified ? 'matches' : 'DOES NOT MATCH'} the published SHA-256.`
      : `- ${role}: not checked (no archive path supplied).`);
  }
  lines.push('');
  lines.push('## Counts');
  lines.push('');
  lines.push('| Entity | Read | Accepted (expected insertions) | Rejected |');
  lines.push('|---|---|---|---|');
  lines.push(`| states | ${report.counts.states.read} | ${report.counts.states.accepted} | ${report.counts.states.rejected} |`);
  lines.push(`| districts | ${report.counts.districts.read} | ${report.counts.districts.accepted} | ${report.counts.districts.rejected} |`);
  lines.push('');
  lines.push(`Of the accepted states: ${report.counts.states.kinds.state} states (S) and ${report.counts.states.kinds.union_territory} union territories (U).`);
  lines.push('');
  lines.push('## Rejections by category');
  lines.push('');
  for (const [category, n] of Object.entries(report.rejections_by_category)) {
    lines.push(`- ${category}: ${n}`);
  }
  lines.push('');
  lines.push('## Parent checks');
  lines.push('');
  lines.push(`- Districts checked against accepted states: ${report.parent_checks.districts_checked}`);
  lines.push(`- Districts with a missing or invalid parent state: ${report.parent_checks.districts_missing_parent}`);
  lines.push(`- Accepted states with no accepted district: ${report.parent_checks.states_without_districts.length}`);
  lines.push('');
  lines.push('## Published totals');
  lines.push('');
  lines.push(`- States: expected ${report.published_totals.expected.states}, accepted ${report.published_totals.actual.states} (${report.published_totals.matches.states ? 'match' : 'DIFFERENT'})`);
  lines.push(`- Districts: expected ${report.published_totals.expected.districts}, accepted ${report.published_totals.actual.districts} (${report.published_totals.matches.districts ? 'match' : 'DIFFERENT'})`);
  lines.push('');
  lines.push('## Database');
  lines.push('');
  lines.push(`- Accessed: ${report.database.accessed}. SQL executed: ${report.database.sql_executed}. Records written: ${report.database.records_written}.`);
  lines.push(`- Existing-record matches: ${report.existing_record_matches.checked ? 'checked' : 'not checked. ' + report.existing_record_matches.reason}`);
  lines.push('');
  if (report.rejected.length > 0) {
    lines.push('## Rejected records');
    lines.push('');
    lines.push('| Entity | Line | LGD code | Name | Problems |');
    lines.push('|---|---|---|---|---|');
    for (const r of report.rejected) {
      const problems = r.problems.map((p) => `${p.category}: ${p.message}`).join('; ').replace(/\|/g, '/');
      lines.push(`| ${r.entity} | ${r.line} | ${r.lgd_code} | ${String(r.name).replace(/\|/g, '/')} | ${problems} |`);
    }
    lines.push('');
  }
  lines.push('## Outputs');
  lines.push('');
  for (const o of report.outputs) lines.push(`- ${o.file} (${o.rows} rows): \`${o.sha256}\``);
  lines.push('');
  return `${lines.join('\n')}\n`;
}

/**
 * Runs the dry-run conversion. Pure reads for inputs, writes only to outDir.
 * Throws ConvertError before writing anything if a supplied archive does not match.
 */
export async function convert({ statesPath, districtsPath, outDir, configPath = DEFAULT_CONFIG, archives = {} }) {
  const config = JSON.parse(await fs.readFile(configPath, 'utf8'));

  const archiveChecks = {};
  for (const role of ['states', 'districts']) {
    const archivePath = archives[role];
    if (!archivePath) {
      archiveChecks[role] = { checked: false };
      continue;
    }
    const actual = sha256(await fs.readFile(archivePath));
    const expected = config.archives[role].sha256;
    archiveChecks[role] = {
      checked: true,
      file: basename(archivePath),
      expected,
      actual,
      verified: actual === expected,
    };
    if (actual !== expected) {
      throw new ConvertError(`The ${role} archive does not match its published SHA-256. Nothing was written.`);
    }
  }

  const statesBuffer = await fs.readFile(statesPath);
  const districtsBuffer = await fs.readFile(districtsPath);
  const statesSha = sha256(statesBuffer);
  const districtsSha = sha256(districtsBuffer);

  let statesText;
  let districtsText;
  try {
    statesText = decodeUtf8Strict(statesBuffer);
    districtsText = decodeUtf8Strict(districtsBuffer);
  } catch {
    throw new ConvertError('One of the input files is not valid UTF-8. Nothing was written.');
  }

  const statesRows = parseLgdCsv(statesText, STATE_REQUIRED);
  const districtsRows = parseLgdCsv(districtsText, DISTRICT_REQUIRED);

  const states = convertStates(statesRows);
  const districts = convertDistricts(districtsRows, states.accepted);
  const outputs = buildOutputs(states.accepted, districts.accepted);

  const outputPaths = Object.fromEntries(
    Object.entries(OUTPUT_FILES).map(([key, name]) => [key, join(outDir, name)]),
  );
  const inputPaths = [resolve(statesPath), resolve(districtsPath)];
  for (const p of Object.values(outputPaths)) {
    if (inputPaths.includes(resolve(p))) {
      throw new ConvertError('An output path would overwrite an input file. Nothing was written.');
    }
  }

  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(outputPaths.states, outputs.states, 'utf8');
  await fs.writeFile(outputPaths.districts, outputs.districts, 'utf8');
  await fs.writeFile(outputPaths.crosswalk, outputs.crosswalk, 'utf8');

  // Confirm the inputs were not changed by the run.
  const statesAfter = sha256(await fs.readFile(statesPath));
  const districtsAfter = sha256(await fs.readFile(districtsPath));

  const outputRecords = [
    { key: 'states', file: OUTPUT_FILES.states, rows: states.accepted.length, text: outputs.states },
    { key: 'districts', file: OUTPUT_FILES.districts, rows: districts.accepted.length, text: outputs.districts },
    { key: 'crosswalk', file: OUTPUT_FILES.crosswalk, rows: states.accepted.length + districts.accepted.length, text: outputs.crosswalk },
  ].map((o) => ({ file: o.file, rows: o.rows, sha256: sha256(Buffer.from(o.text, 'utf8')) }));

  const stateKinds = { state: 0, union_territory: 0 };
  for (const s of states.accepted) stateKinds[s.su === 'U' ? 'union_territory' : 'state'] += 1;

  const districtsByState = new Set(districts.accepted.map((d) => d.stateCode));
  const statesWithoutDistricts = states.accepted.filter((s) => !districtsByState.has(s.code)).map((s) => s.code);
  const missingParent = districts.rejected.filter((r) => r.problems.some((p) => p.category === 'missing_parent')).length;

  const expected = config.expectedCounts;
  const actualTotals = { states: states.accepted.length, districts: districts.accepted.length };
  const matches = {
    states: actualTotals.states === expected.states && stateKinds.state === expected.statesStates
      && stateKinds.union_territory === expected.statesUnionTerritories,
    districts: actualTotals.districts === expected.districts,
  };

  const report = {
    source: LGD_SOURCE,
    snapshot: config.snapshot,
    licence: config.licence,
    attribution: config.attribution,
    inputs: [
      { role: 'states', file: basename(statesPath), rows_read: statesRows.length, sha256: statesSha, unchanged_during_run: statesSha === statesAfter },
      { role: 'districts', file: basename(districtsPath), rows_read: districtsRows.length, sha256: districtsSha, unchanged_during_run: districtsSha === districtsAfter },
    ],
    archive_checks: archiveChecks,
    counts: {
      states: { read: statesRows.length, accepted: states.accepted.length, rejected: states.rejected.length, kinds: stateKinds },
      districts: { read: districtsRows.length, accepted: districts.accepted.length, rejected: districts.rejected.length },
    },
    expected_insertions: { states: states.accepted.length, districts: districts.accepted.length, cities: 0, localities: 0, pincodes: 0 },
    existing_record_matches: { checked: false, reason: 'The dry run has no database access, so matches against existing rows are unknown.' },
    rejections_by_category: countByCategory([...states.rejected, ...districts.rejected]),
    rejected: [...states.rejected, ...districts.rejected],
    parent_checks: {
      districts_checked: districts.rowsChecked,
      districts_missing_parent: missingParent,
      states_without_districts: statesWithoutDistricts,
    },
    published_totals: {
      expected: { states: expected.states, districts: expected.districts },
      actual: actualTotals,
      matches,
    },
    outputs: outputRecords,
    database: { accessed: false, sql_executed: false, records_written: 0 },
    deterministic: 'Contains no timestamps or absolute paths. Output depends only on input bytes and config.',
  };

  await fs.writeFile(join(outDir, 'validation-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  await fs.writeFile(join(outDir, 'validation-report.md'), renderMarkdown(report), 'utf8');

  return report;
}

function parseArgs(argv) {
  const options = { states: null, districts: null, out: null, archiveStates: null, archiveDistricts: null, config: DEFAULT_CONFIG };
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    const next = () => {
      if (argv[i + 1] === undefined) throw new Error(`${flag} needs a value.`);
      i += 1;
      return argv[i];
    };
    if (flag === '--states') options.states = next();
    else if (flag === '--districts') options.districts = next();
    else if (flag === '--out') options.out = next();
    else if (flag === '--archive-states') options.archiveStates = next();
    else if (flag === '--archive-districts') options.archiveDistricts = next();
    else if (flag === '--config') options.config = next();
    else throw new Error(`Unknown option ${flag}.`);
  }
  return options;
}

async function main(argv) {
  const options = parseArgs(argv);
  if (!options.states || !options.districts || !options.out) {
    console.error('Usage: node localroots-location/scripts/convert-lgd.mjs --states FILE --districts FILE --out FOLDER [--archive-states FILE] [--archive-districts FILE]');
    return 2;
  }
  const report = await convert({
    statesPath: options.states,
    districtsPath: options.districts,
    outDir: options.out,
    configPath: options.config,
    archives: { states: options.archiveStates, districts: options.archiveDistricts },
  });
  console.log('LGD dry run complete. Nothing was written to any database.');
  console.log(`States:    read ${report.counts.states.read}, accepted ${report.counts.states.accepted}, rejected ${report.counts.states.rejected}`);
  console.log(`Districts: read ${report.counts.districts.read}, accepted ${report.counts.districts.accepted}, rejected ${report.counts.districts.rejected}`);
  console.log(`Districts with a missing or invalid parent: ${report.parent_checks.districts_missing_parent}`);
  console.log(`Published totals match: states ${report.published_totals.matches.states}, districts ${report.published_totals.matches.districts}`);
  console.log(`Report: ${join(options.out, 'validation-report.md')}`);
  const clean = report.counts.states.rejected === 0 && report.counts.districts.rejected === 0
    && report.published_totals.matches.states && report.published_totals.matches.districts
    && report.inputs.every((i) => i.unchanged_during_run);
  return clean ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2))
    .then((code) => {
      process.exitCode = code;
    })
    .catch((err) => {
      console.error(err.message);
      process.exitCode = 2;
    });
}
