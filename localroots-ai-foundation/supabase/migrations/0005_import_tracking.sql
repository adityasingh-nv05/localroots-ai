-- =============================================================================
-- 0005: import run tracking (ADDITIVE). RUN AFTER 0004. Not applied in this build.
--
-- Every import records its source, version, checksum, counts, status and rejected rows.
-- Only administrators can read these tables. Writes come from trusted server processes
-- (the service role or the SQL editor), never from browsers.
-- Re-runnable. Deletes nothing.
-- =============================================================================

create table if not exists public.import_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  source_version text,
  entity text not null check (entity in ('states', 'districts', 'cities', 'localities')),
  mode text not null check (mode in ('dry_run', 'apply')),
  status text not null check (status in ('running', 'succeeded', 'failed')),
  rows_read integer not null default 0 check (rows_read >= 0),
  rows_written integer not null default 0 check (rows_written >= 0),
  rows_rejected integer not null default 0 check (rows_rejected >= 0),
  file_checksum text,
  error_summary text,
  created_by uuid references public.profiles (id) on delete set null,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create table if not exists public.import_run_errors (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.import_runs (id) on delete restrict,
  line_number integer not null check (line_number >= 1),
  external_id text,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists import_runs_started_idx on public.import_runs (started_at desc);
create index if not exists import_run_errors_run_idx on public.import_run_errors (run_id);

alter table public.import_runs enable row level security;
alter table public.import_run_errors enable row level security;

drop policy if exists "import_runs: admin read" on public.import_runs;
create policy "import_runs: admin read" on public.import_runs
  for select using (public.is_admin());

drop policy if exists "import_run_errors: admin read" on public.import_run_errors;
create policy "import_run_errors: admin read" on public.import_run_errors
  for select using (public.is_admin());

-- No insert, update or delete policies: clients cannot write import records.
revoke all on public.import_runs from anon;
revoke all on public.import_run_errors from anon;
grant select on public.import_runs, public.import_run_errors to authenticated;
