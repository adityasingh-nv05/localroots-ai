/**
 * CSV parsing for location imports. Plain JavaScript, no dependencies.
 * Handles a UTF-8 byte-order mark, CRLF line endings, quoted fields containing commas
 * and "" escapes. It does not support fields that contain line breaks; such rows are reported.
 */

export class CsvError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CsvError';
  }
}

export function stripBom(text) {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

/** Splits one CSV line into trimmed fields. */
export function parseCsvLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      fields.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (inQuotes) throw new CsvError('A quoted field is not closed.');
  fields.push(current.trim());
  return fields;
}

/**
 * Parses CSV text into row objects keyed by header name.
 * Throws CsvError for file-level problems (empty file, duplicate or missing headers).
 * Row-level problems (wrong column count, unclosed quotes) are attached to the row
 * as __problems so the caller can report them with the line number.
 */
export function parseCsv(text, requiredColumns) {
  const lines = stripBom(text)
    .split(/\r?\n/)
    .map((line, index) => ({ line, number: index + 1 }))
    .filter(({ line }) => line.trim().length > 0);

  if (lines.length === 0) throw new CsvError('The file is empty.');

  const header = parseCsvLine(lines[0].line).map((h) => h.toLowerCase());
  const duplicates = header.filter((h, i) => header.indexOf(h) !== i);
  if (duplicates.length > 0) throw new CsvError(`Duplicate column name(s): ${[...new Set(duplicates)].join(', ')}`);

  const missing = requiredColumns.filter((c) => !header.includes(c));
  if (missing.length > 0) throw new CsvError(`Missing required column(s): ${missing.join(', ')}`);

  return lines.slice(1).map(({ line, number }) => {
    const row = { __line: number, __problems: [] };
    let values;
    try {
      values = parseCsvLine(line);
    } catch (err) {
      row.__problems.push(err.message);
      values = [];
    }
    if (values.length > 0 && values.length !== header.length) {
      row.__problems.push(`Expected ${header.length} columns but found ${values.length}.`);
    }
    header.forEach((name, i) => {
      row[name] = values[i] ?? '';
    });
    return row;
  });
}
