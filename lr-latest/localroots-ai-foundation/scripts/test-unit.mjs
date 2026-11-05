#!/usr/bin/env node
/**
 * Dependency-free unit test runner.
 *
 * Source files use '@/...' path aliases and extensionless imports, which Node cannot
 * load directly. This script copies src/ and tests/ into a temporary folder, rewrites
 * the imports to real relative paths, then runs the tests with Node's built-in runner.
 * The project folder is never modified.
 *
 * Requires Node 22.6+ (for --experimental-strip-types). Replace with Vitest later if preferred.
 */
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';

const projectRoot = process.cwd();
const work = mkdtempSync(join(tmpdir(), 'localroots-unit-'));
const srcDir = join(work, 'src');

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (full.endsWith('.ts')) out.push(full);
  }
  return out;
}

/** Turns '@/x/y' or './y' into a real .ts file path, relative to the importing file. */
function resolveSpecifier(spec, fromFile) {
  let target;
  if (spec.startsWith('@/')) target = join(srcDir, spec.slice(2));
  else if (spec.startsWith('.')) target = resolve(dirname(fromFile), spec);
  else return spec; // node: built-ins and packages are left alone

  const candidates = [`${target}.ts`, join(target, 'index.ts'), target];
  const file = candidates.find((c) => existsSync(c) && statSync(c).isFile());
  if (!file) return spec;

  let rel = relative(dirname(fromFile), file).split('\\').join('/');
  if (!rel.startsWith('.')) rel = `./${rel}`;
  return rel;
}

const IMPORT_RE = /((?:\bfrom|\bimport)\s*\(?\s*)(['"])([^'"]+)\2/g;

try {
  cpSync(join(projectRoot, 'src'), srcDir, { recursive: true });
  cpSync(join(projectRoot, 'tests'), join(work, 'tests'), { recursive: true });
  if (existsSync(join(projectRoot, 'public'))) {
    cpSync(join(projectRoot, 'public'), join(work, 'public'), { recursive: true });
  }

  for (const file of [...walk(srcDir), ...walk(join(work, 'tests'))]) {
    const source = readFileSync(file, 'utf8');
    const rewritten = source.replace(IMPORT_RE, (match, prefix, quote, spec) => {
      const next = resolveSpecifier(spec, file);
      return next === spec ? match : `${prefix}${quote}${next}${quote}`;
    });
    if (rewritten !== source) writeFileSync(file, rewritten);
  }

  const testFiles = walk(join(work, 'tests')).filter((f) => f.endsWith('.test.ts'));
  if (testFiles.length === 0) {
    console.error('No *.test.ts files found in tests/.');
    process.exit(1);
  }

  const result = spawnSync(
    process.execPath,
    ['--experimental-strip-types', '--no-warnings', '--test', ...testFiles],
    {
      cwd: work,
      stdio: 'inherit',
      env: { ...process.env, PROJECT_ROOT: projectRoot },
    },
  );
  process.exitCode = result.status ?? 1;
} finally {
  rmSync(work, { recursive: true, force: true });
}
