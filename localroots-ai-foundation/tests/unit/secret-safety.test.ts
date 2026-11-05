import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.env.PROJECT_ROOT ?? process.cwd();

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|mjs|js)$/.test(full)) out.push(full);
  }
  return out;
}

const sourceFiles = walk(join(ROOT, 'src'));
const rel = (f: string) => relative(ROOT, f).split('\\').join('/');

describe('secret handling', () => {
  it('reads the service-role key in exactly one server file', () => {
    const readers = sourceFiles.filter((f) => /process\.env\.SUPABASE_SERVICE_ROLE_KEY/.test(readFileSync(f, 'utf8')));
    assert.deepEqual(readers.map(rel), ['src/lib/supabase/server.ts']);
  });

  it('never exposes the service-role key through a NEXT_PUBLIC variable', () => {
    for (const f of sourceFiles) {
      assert.ok(!/NEXT_PUBLIC_[A-Z_]*SERVICE/.test(readFileSync(f, 'utf8')), `${rel(f)} exposes a secret`);
    }
  });

  it('keeps the service-role client out of pages and components', () => {
    for (const f of sourceFiles) {
      const r = rel(f);
      if (!r.startsWith('src/app/') && !r.startsWith('src/components/')) continue;
      const text = readFileSync(f, 'utf8');
      assert.ok(!/createServiceRoleClient/.test(text), `${r} uses the service-role client`);
      assert.ok(!/@\/lib\/supabase\/server/.test(text), `${r} imports server Supabase code directly`);
    }
  });

  it('does not put a real key into .env.example', () => {
    const example = readFileSync(join(ROOT, '.env.example'), 'utf8');
    for (const line of example.split('\n')) {
      if (/^SUPABASE_SERVICE_ROLE_KEY=/.test(line) || /^NEXT_PUBLIC_SUPABASE_ANON_KEY=/.test(line)) {
        assert.equal(line.split('=')[1].trim(), '', `${line.split('=')[0]} must be empty in the template`);
      }
    }
  });
});
