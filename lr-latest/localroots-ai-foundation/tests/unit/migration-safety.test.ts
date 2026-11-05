import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.env.PROJECT_ROOT ?? process.cwd();
const MIGRATIONS_DIR = join(ROOT, 'supabase', 'migrations');
const migrations = readdirSync(MIGRATIONS_DIR).filter((f: string) => f.endsWith(".sql")).sort();
const allSql = migrations.map((f: string) => readFileSync(join(MIGRATIONS_DIR, f), 'utf8')).join('\n');

// Strip SQL comments so words inside comments do not trigger false alarms.
const code = allSql.replace(/--.*$/gm, '');

describe('migrations are non-destructive', () => {
  it('contains no table, schema or column drops', () => {
    assert.doesNotMatch(code, /\bdrop\s+(table|schema|database|column)\b/i);
  });

  it('contains no truncation or unfiltered deletes', () => {
    assert.doesNotMatch(code, /\btruncate\b/i);
    assert.doesNotMatch(code, /\bdelete\s+from\b/i);
  });

  it('turns on row-level security for every table it creates', () => {
    const tables = [...code.matchAll(/create table public\.(\w+)/g)].map((m) => m[1]);
    assert.ok(tables.length >= 8, 'expected the core tables');
    for (const t of tables) {
      assert.match(code, new RegExp(`alter table public\\.${t} enable row level security`), `${t} has no RLS`);
    }
  });

  it('has a fix-up migration that adds products.kind', () => {
    assert.ok(migrations.length >= 2, 'expected 0002 to exist');
    assert.match(code, /add column if not exists kind/i);
  });
});

describe('seed data', () => {
  it('does not insert any businesses, products or reviews', () => {
    const seedPath = join(ROOT, 'supabase', 'seed.sql');
    assert.ok(existsSync(seedPath));
    const seed = readFileSync(seedPath, 'utf8').replace(/--.*$/gm, '');
    assert.doesNotMatch(seed, /insert into public\.(businesses|products|reviews)/i);
  });
});
