/**
 * LGD conversion rules. Pure functions: no file access, no database access.
 *
 * Input rows come from scripts/lib/csv.mjs (header names are lowercased by that parser).
 * The official identifiers are preserved exactly as they appear in the file (trimmed):
 *   - state external_id     = "State Code"
 *   - district external_id  = "District Code"
 *   - district parent       = "State Code" (must match an accepted state)
 * Census codes and the raw names are kept only in the crosswalk file. They are not imported.
 */
import { parseCsv } from './csv.mjs';

export const LGD_SOURCE = 'LGD';
export const STATE_REQUIRED = ['state code', 'state name (in english)', 'state or ut'];
export const DISTRICT_REQUIRED = ['state code', 'district code', 'district name(in english)'];

export const STATE_OUTPUT_COLUMNS = ['external_id', 'name', 'kind', 'code', 'country_iso', 'latitude', 'longitude'];
export const DISTRICT_OUTPUT_COLUMNS = ['external_id', 'name', 'state_external_id', 'code', 'latitude', 'longitude'];
export const CROSSWALK_COLUMNS = [
  'entity', 'lgd_code', 'lgd_parent_code', 'name_raw', 'name_normalised',
  'state_or_ut', 'census_2001_code', 'census_2011_code', 'source_line',
];

export const CATEGORY = {
  MALFORMED: 'malformed_row',
  INVALID: 'invalid_value',
  DUPLICATE: 'duplicate',
  MISSING_PARENT: 'missing_parent',
};

const NUMERIC_CODE = /^[0-9]{1,6}$/;
const KIND_BY_CODE = { S: 'state', U: 'union_territory' };

export function normaliseName(value) {
  return String(value ?? '').normalize('NFC').replace(/\s+/g, ' ').trim();
}

function nameKey(value) {
  return normaliseName(value).toLowerCase();
}

function cell(row, column) {
  return String(row[column] ?? '').trim();
}

function problem(category, message) {
  return { category, message };
}

/** Throws a TypeError if the bytes are not valid UTF-8. Nothing is silently replaced. */
export function decodeUtf8Strict(buffer) {
  return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
}

/** Parses an LGD CSV, failing early if a required column is missing. */
export function parseLgdCsv(text, required) {
  return parseCsv(text, required);
}

function sortByCode(list) {
  return [...list].sort((a, b) => {
    const numeric = Number(a.code) - Number(b.code);
    if (numeric !== 0) return numeric;
    return a.code < b.code ? -1 : a.code > b.code ? 1 : 0;
  });
}

/**
 * Runs every duplicate check against ALL valid rows, then rejects each row that any check flags.
 * Checking against all rows (not against rows already removed by another check) means a name
 * clash is never hidden by a separate code clash.
 */
function flagDuplicates(items, checks) {
  const flags = new Map();
  for (const { keyOf, message } of checks) {
    const counts = new Map();
    for (const item of items) counts.set(keyOf(item), (counts.get(keyOf(item)) ?? 0) + 1);
    items.forEach((item, index) => {
      if (counts.get(keyOf(item)) > 1) flags.set(index, [...(flags.get(index) ?? []), message]);
    });
  }
  const kept = [];
  const rejected = [];
  items.forEach((item, index) => {
    const messages = flags.get(index);
    if (messages) {
      rejected.push({ ...item, problems: [...item.problems, ...messages.map((m) => problem(CATEGORY.DUPLICATE, m))] });
    } else {
      kept.push(item);
    }
  });
  return { kept, rejected };
}

function rejectionRecord(entity, item) {
  return {
    entity,
    line: item.line,
    lgd_code: item.code,
    name: item.rawName,
    problems: item.problems,
  };
}

function sortRejections(records) {
  return [...records].sort((a, b) => a.entity.localeCompare(b.entity) || a.line - b.line);
}

/**
 * States. Accepted rows are sorted by LGD code. A duplicate code, or a name repeated
 * across two codes, rejects every copy involved.
 */
export function convertStates(rows) {
  const valid = [];
  const rejected = [];

  for (const row of rows) {
    const problems = (row.__problems ?? []).map((m) => problem(CATEGORY.MALFORMED, m));
    const code = cell(row, 'state code');
    const rawName = String(row['state name (in english)'] ?? '');
    const name = normaliseName(rawName);
    const su = cell(row, 'state or ut').toUpperCase();

    if (!NUMERIC_CODE.test(code)) {
      problems.push(problem(CATEGORY.INVALID, `State Code "${code}" must be a numeric LGD code of 1 to 6 digits.`));
    }
    if (!name) {
      problems.push(problem(CATEGORY.INVALID, 'State name is empty.'));
    } else if (name.length > 200) {
      problems.push(problem(CATEGORY.INVALID, 'State name is longer than 200 characters.'));
    }
    if (!Object.hasOwn(KIND_BY_CODE, su)) {
      problems.push(problem(CATEGORY.INVALID, `State or UT must be S or U; found "${su}".`));
    }

    const item = {
      line: row.__line,
      code,
      rawName,
      name,
      su,
      census2001: cell(row, 'census 2001 code'),
      census2011: cell(row, 'census 2011 code'),
      problems,
    };
    if (problems.length > 0) rejected.push(item);
    else valid.push(item);
  }

  const dup = flagDuplicates(valid, [
    { keyOf: (i) => i.code, message: 'Duplicate State Code in the file. Every copy is rejected.' },
    { keyOf: (i) => nameKey(i.name), message: 'State name repeated under another code. Every copy is rejected.' },
  ]);

  return {
    accepted: sortByCode(dup.kept),
    rejected: sortRejections([
      ...rejected.map((i) => rejectionRecord('states', i)),
      ...dup.rejected.map((i) => rejectionRecord('states', i)),
    ]),
  };
}

/**
 * Districts. Each district must reference an accepted state. Rows whose parent is missing
 * or invalid are rejected and counted separately, so they can be investigated.
 */
export function convertDistricts(rows, acceptedStates) {
  const parentCodes = new Set(acceptedStates.map((s) => s.code));
  const valid = [];
  const rejected = [];

  for (const row of rows) {
    const problems = (row.__problems ?? []).map((m) => problem(CATEGORY.MALFORMED, m));
    const code = cell(row, 'district code');
    const stateCode = cell(row, 'state code');
    const rawName = String(row['district name(in english)'] ?? '');
    const name = normaliseName(rawName);

    if (!NUMERIC_CODE.test(code)) {
      problems.push(problem(CATEGORY.INVALID, `District Code "${code}" must be a numeric LGD code of 1 to 6 digits.`));
    }
    if (!NUMERIC_CODE.test(stateCode)) {
      problems.push(problem(CATEGORY.INVALID, `State Code "${stateCode}" must be a numeric LGD code of 1 to 6 digits.`));
    }
    if (!name) {
      problems.push(problem(CATEGORY.INVALID, 'District name is empty.'));
    } else if (name.length > 200) {
      problems.push(problem(CATEGORY.INVALID, 'District name is longer than 200 characters.'));
    }

    const item = {
      line: row.__line,
      code,
      stateCode,
      rawName,
      name,
      census2001: cell(row, 'census 2001 code'),
      census2011: cell(row, 'census 2011 code'),
      problems,
    };

    if (problems.length > 0) {
      rejected.push(item);
      continue;
    }
    if (!parentCodes.has(stateCode)) {
      item.problems = [problem(CATEGORY.MISSING_PARENT, `Parent state ${stateCode} is not an accepted state in the states file.`)];
      rejected.push(item);
      continue;
    }
    valid.push(item);
  }

  const dup = flagDuplicates(valid, [
    { keyOf: (i) => i.code, message: 'Duplicate District Code in the file. Every copy is rejected.' },
    { keyOf: (i) => `${i.stateCode}|${nameKey(i.name)}`, message: 'Duplicate district name within the same state. Every copy is rejected.' },
  ]);

  return {
    accepted: sortByCode(dup.kept),
    rejected: sortRejections([
      ...rejected.map((i) => rejectionRecord('districts', i)),
      ...dup.rejected.map((i) => rejectionRecord('districts', i)),
    ]),
    rowsChecked: rows.length,
  };
}

/** Quotes a field only when needed, so output is byte-for-byte repeatable. */
export function csvField(value) {
  const text = value === undefined || value === null ? '' : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(columns, records) {
  const lines = [columns.join(',')];
  for (const record of records) {
    lines.push(columns.map((c) => csvField(record[c])).join(','));
  }
  return `${lines.join('\n')}\n`;
}

/** Builds the three output files from accepted rows. Cities and localities are never produced here. */
export function buildOutputs(acceptedStates, acceptedDistricts) {
  const stateRecords = acceptedStates.map((s) => ({
    external_id: s.code,
    name: s.name,
    kind: KIND_BY_CODE[s.su],
    code: '',
    country_iso: 'IN',
    latitude: '',
    longitude: '',
  }));
  const districtRecords = acceptedDistricts.map((d) => ({
    external_id: d.code,
    name: d.name,
    state_external_id: d.stateCode,
    code: '',
    latitude: '',
    longitude: '',
  }));
  const crosswalkRecords = [
    ...acceptedStates.map((s) => ({
      entity: 'states',
      lgd_code: s.code,
      lgd_parent_code: '',
      name_raw: s.rawName,
      name_normalised: s.name,
      state_or_ut: s.su,
      census_2001_code: s.census2001,
      census_2011_code: s.census2011,
      source_line: s.line,
    })),
    ...acceptedDistricts.map((d) => ({
      entity: 'districts',
      lgd_code: d.code,
      lgd_parent_code: d.stateCode,
      name_raw: d.rawName,
      name_normalised: d.name,
      state_or_ut: '',
      census_2001_code: d.census2001,
      census_2011_code: d.census2011,
      source_line: d.line,
    })),
  ];

  return {
    states: toCsv(STATE_OUTPUT_COLUMNS, stateRecords),
    districts: toCsv(DISTRICT_OUTPUT_COLUMNS, districtRecords),
    crosswalk: toCsv(CROSSWALK_COLUMNS, crosswalkRecords),
  };
}
