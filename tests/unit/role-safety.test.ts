import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.env.PROJECT_ROOT ?? process.cwd();

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(full)) out.push(full);
  }
  return out;
}

const appFiles = walk(join(ROOT, 'src'));
const read = (f: string) => readFileSync(f, 'utf8');
const rel = (f: string) => relative(ROOT, f).split('\\').join('/');

describe('application code cannot grant roles', () => {
  it('never writes an admin role', () => {
    for (const f of appFiles) {
      assert.doesNotMatch(read(f), /\brole\s*[:=]\s*['"]admin['"]/, `${rel(f)} sets admin role`);
    }
  });

  it('never updates a role column directly', () => {
    for (const f of appFiles) {
      assert.doesNotMatch(read(f), /\.update\(\s*\{\s*role/, `${rel(f)} updates role directly`);
    }
  });

  it('never calls the admin-assignment function', () => {
    for (const f of appFiles) {
      assert.doesNotMatch(read(f), /['"`](grant|revoke)_admin['"`]/, `${rel(f)} calls admin assignment`);
    }
  });

  it('never reads roles from user metadata', () => {
    for (const f of appFiles) {
      assert.doesNotMatch(read(f), /user_metadata\.role|raw_user_meta_data/, `${rel(f)} trusts metadata for roles`);
    }
  });
});

describe('role migration (0003)', () => {
  const sql = readFileSync(join(ROOT, 'supabase', 'migrations', '0003_roles_and_membership.sql'), 'utf8')
    .replace(/--.*$/gm, '');

  it('lets only the service role run grant_admin', () => {
    assert.match(sql, /grant execute on function public\.grant_admin\(uuid\) to service_role;/);
    assert.doesNotMatch(sql, /grant execute on function public\.grant_admin\(uuid\) to (anon|authenticated)/);
  });

  it('sets the admin role in exactly one place: the trusted grant function', () => {
    const matches = sql.match(/set role = 'admin'/g) ?? [];
    assert.equal(matches.length, 1);
    const grantIndex = sql.indexOf('function public.grant_admin');
    assert.ok(grantIndex > 0 && sql.indexOf("set role = 'admin'") > grantIndex);
  });

  it('lets a customer become a vendor and nothing else', () => {
    assert.match(sql, /if v_role = 'customer' then\s+update public\.profiles set role = 'vendor'/);
    assert.match(sql, /if v_role = 'admin' then\s+raise exception/);
  });

  it('creates new businesses inactive, owned by the caller, with an owner membership', () => {
    assert.match(sql, /coalesce\(p_address, ''\), false\s*\)/);
    assert.match(sql, /insert into public\.business_members \(business_id, user_id, role\)\s+values \(v_id, auth\.uid\(\), 'owner'\)/);
  });

  it('gives clients no direct insert into businesses or membership', () => {
    assert.doesNotMatch(sql, /create policy "[^"]*" on public\.businesses\s+for insert/);
    assert.doesNotMatch(sql, /create policy "[^"]*" on public\.business_members\s+for (insert|update|delete)/);
  });

  it('blocks role changes that do not come from a trusted process', () => {
    assert.match(sql, /raise exception 'Account roles can only be changed by a trusted server process'/);
  });

  it('enables row-level security on the new tables', () => {
    assert.match(sql, /alter table public\.business_members enable row level security/);
    assert.match(sql, /alter table public\.admin_audit_log enable row level security/);
  });
});

describe('sign-up cannot elevate roles in the database', () => {
  const base = readdirSync(join(ROOT, 'supabase', 'migrations'))
    .map((f: string) => readFileSync(join(ROOT, 'supabase', 'migrations', f), 'utf8'))
    .join('\n')
    .replace(/--.*$/gm, '');

  it('creates every new account as a customer, ignoring metadata', () => {
    const fn = base.match(/function public\.handle_new_user\(\)[\s\S]*?\$\$;\s*\n?\s*\n/);
    assert.ok(fn, 'handle_new_user not found');
    assert.doesNotMatch(fn[0], /role/i);
  });
});
