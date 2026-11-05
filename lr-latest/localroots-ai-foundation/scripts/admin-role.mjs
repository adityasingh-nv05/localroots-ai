#!/usr/bin/env node
/**
 * Grant or revoke the admin role for one user. Run on YOUR trusted machine only.
 *
 *   node scripts/admin-role.mjs grant  <user-uuid>
 *   node scripts/admin-role.mjs revoke <user-uuid>
 *
 * It needs SUPABASE_SERVICE_ROLE_KEY in .env.local. That key bypasses security, so
 * this script must never run in a browser, in CI logs, or on a shared machine.
 * The database also checks the caller, and writes an audit row for every change.
 * The app itself never calls this.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const [action, userId] = process.argv.slice(2);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

if (!['grant', 'revoke'].includes(action) || !UUID.test(userId ?? '')) {
  fail('Usage: node scripts/admin-role.mjs grant|revoke <user-uuid>');
}

function readEnvFile(path) {
  const values = {};
  if (!existsSync(path)) return values;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match) values[match[1]] = match[2].replace(/^["']|["']$/g, '');
  }
  return values;
}

const env = { ...readEnvFile(join(process.cwd(), '.env.local')), ...process.env };
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url) fail('NEXT_PUBLIC_SUPABASE_URL is missing from .env.local');
if (!serviceKey) fail('SUPABASE_SERVICE_ROLE_KEY is missing from .env.local');

const rpc = action === 'grant' ? 'grant_admin' : 'revoke_admin';
const response = await fetch(`${url.replace(/\/$/, '')}/rest/v1/rpc/${rpc}`, {
  method: 'POST',
  headers: {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ p_user: userId }),
});

if (!response.ok) {
  const detail = await response.text();
  fail(`Database refused the change (HTTP ${response.status}): ${detail}`);
}

console.log(`Done: ${action} admin for user ${userId}. An audit row was written.`);
