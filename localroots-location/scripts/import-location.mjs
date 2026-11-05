#!/usr/bin/env node
/**
 * Location import, command line.
 *
 * Default mode is a DRY RUN: it reads and checks a file, prints a report, and can write a
 * local plan file or manifest entry. It never connects to a database.
 *
 *   node scripts/import-location.mjs <entity> <file.csv> [options]
 *
 *   entity          states | districts | cities | localities   (PIN codes are not supported yet)
 *   --parents FILE  parent file to verify links against (states for districts, and so on)
 *   --source NAME   source name stored with each record (default LGD)
 *   --source-version VERSION   e.g. 2026-01; recorded for traceability
 *   --batch-size N  rows per batch (default 500)
 *   --plan-out FILE write the SQL plan as JSON for review (no database access)
 *   --manifest FILE append a dry-run entry as one JSON line
 *   --apply         NOT AVAILABLE in this build. Exits 3 without touching any database.
 *
 * Exit codes: 0 clean, 1 rows rejected, 2 bad usage or file, 3 apply requested but disabled.
 */
import { promises as fs } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { CsvError, parseCsv } from './lib/csv.mjs';
import { ENTITIES, ENTITY_NAMES, getEntity, requiredColumnsFor } from './lib/entities.mjs';
import { analyseRows, buildPlan, chunk, DEFAULT_BATCH_SIZE } from './lib/pipeline.mjs';
import { formatReport } from './lib/report.mjs';

const PARENT_ENTITY = { districts: 'states', cities: 'districts', localities: 'cities' };

export function parseArgs(argv) {
  const [entity, file, ...rest] = argv;
  const options = { entity, file, parents: null, source: 'LGD', sourceVersion: null,
    batchSize: DEFAULT_BATCH_SIZE, planOut: null, manifest: null, apply: false };
  for (let i = 0; i < rest.length; i += 1) {
    const flag = rest[i];
    const value = () => {
      if (rest[i + 1] === undefined) throw new Error(`${flag} needs a value.`);
      i += 1;
      return rest[i];
    };
    if (flag === '--parents') options.parents = value();
    else if (flag === '--source') options.source = value();
    else if (flag === '--source-version') options.sourceVersion = value();
    else if (flag === '--batch-size') options.batchSize = Number(value());
    else if (flag === '--plan-out') options.planOut = value();
    else if (flag === '--manifest') options.manifest = value();
    else if (flag === '--apply') options.apply = true;
    else throw new Error(`Unknown option ${flag}.`);
  }
  return options;
}

async function sha256(path) {
  const hash = createHash('sha256');
  hash.update(await fs.readFile(path));
  return hash.digest('hex');
}

async function loadKnownParentIds(parentEntity, parentFile) {
  const text = await fs.readFile(parentFile, 'utf8');
  const rows = parseCsv(text, requiredColumnsFor(parentEntity));
  const analysis = analyseRows(parentEntity, rows);
  return new Set(analysis.accepted.map((r) => r.external_id));
}

export async function run(argv) {
  const options = parseArgs(argv);

  if (!options.entity || !options.file) {
    console.error('Usage: node scripts/import-location.mjs <states|districts|cities|localities> <file.csv> [options]');
    return 2;
  }
  if (options.entity === 'pincodes' || options.entity === 'pins') {
    console.error('PIN code import is not supported yet. It needs an authoritative source and a licence first.');
    return 2;
  }
  getEntity(options.entity);
  if (!Number.isInteger(options.batchSize) || options.batchSize < 1) {
    console.error('--batch-size must be a positive whole number.');
    return 2;
  }

  let rows;
  try {
    rows = parseCsv(await fs.readFile(options.file, 'utf8'), requiredColumnsFor(options.entity));
  } catch (err) {
    console.error(err instanceof CsvError ? `File problem: ${err.message}` : `Could not read ${options.file}: ${err.message}`);
    return 2;
  }

  let knownParentIds = null;
  if (options.parents) {
    const parentEntity = PARENT_ENTITY[options.entity];
    if (!parentEntity) {
      console.error(`${options.entity} has no parent; --parents does not apply.`);
      return 2;
    }
    knownParentIds = await loadKnownParentIds(parentEntity, options.parents);
  }

  const analysis = analyseRows(options.entity, rows, { knownParentIds });
  const checksum = await sha256(options.file);
  const runId = randomUUID();
  const batches = chunk(analysis.accepted, options.batchSize);

  console.log(`Dry run ${runId}`);
  console.log(formatReport({
    entity: options.entity,
    source: options.source,
    sourceVersion: options.sourceVersion,
    checksum,
    analysis,
    batchCount: batches.length,
  }));
  console.log('Nothing was written to any database.');

  if (options.planOut) {
    const plan = buildPlan(options.entity, analysis.accepted, {
      source: options.source,
      sourceVersion: options.sourceVersion,
      batchSize: options.batchSize,
    });
    await fs.writeFile(options.planOut, JSON.stringify(plan, null, 2));
    console.log(`SQL plan written to ${options.planOut} (review it; nothing was executed).`);
  }

  if (options.manifest) {
    const entry = {
      dryRun: true,
      runId,
      entity: options.entity,
      source: options.source,
      sourceVersion: options.sourceVersion,
      sourceFile: options.file,
      sourceChecksum: checksum,
      rowsRead: analysis.totalRows,
      accepted: analysis.accepted.length,
      rejected: analysis.rejected.length,
      identicalDuplicates: analysis.identicalDuplicates,
      timestamp: new Date().toISOString(),
    };
    await fs.appendFile(options.manifest, JSON.stringify(entry) + '\n');
    console.log(`Manifest entry appended to ${options.manifest}`);
  }

  if (options.apply) {
    console.error('--apply is disabled in this build. Database writes need your approval first. Nothing was written.');
    return 3;
  }

  return analysis.rejected.length > 0 ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run(process.argv.slice(2))
    .then((code) => {
      process.exitCode = code;
    })
    .catch((err) => {
      console.error(err.message);
      process.exitCode = 2;
    });
}

export { ENTITIES, ENTITY_NAMES };
