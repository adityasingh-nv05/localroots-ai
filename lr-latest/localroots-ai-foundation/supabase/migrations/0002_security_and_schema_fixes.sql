-- =============================================================================
-- 0002: security and schema fixes for LocalRoots AI
--
-- RUN AFTER 0001_init.sql (the original file). If you have not run 0001 yet,
-- run 0001 first, then this file.
--
-- What this file does:
--   * Adds products.kind (the TypeScript model has it; 0001 did not).
--   * Stops vendors from inserting/updating verification status or rating totals.
--   * Stops vendors from re-publishing listings that admins hid.
--   * Restricts verification requests to the business owner.
--   * Restricts reviews to active businesses.
--   * Adds a function that returns display names for reviewers only.
--   * Removes public execute rights from internal trigger functions.
--
-- What this file does NOT do:
--   * It does not delete, truncate or rewrite any rows.
--   * It does not drop tables or columns.
-- It is safe to re-run.
-- =============================================================================

-- 1. products.kind -------------------------------------------------------------
alter table public.products add column if not exists kind text not null default 'product';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'products_kind_check') then
    alter table public.products
      add constraint products_kind_check check (kind in ('product', 'service'));
  end if;
end
$$;

-- 2. Trusted-context check -----------------------------------------------------
-- "Trusted" means: a direct database connection (SQL editor, migrations),
-- the service role, or an admin user. Everyone else is an end user.
create or replace function public.is_trusted_context()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    nullif(current_setting('request.jwt.claims', true), '') is null
    or coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', '') = 'service_role'
    or public.is_admin();
$$;

-- 3. Business trust fields -----------------------------------------------------
-- Replaces 0001's verification-only guard. Covers inserts and updates.
create or replace function public.protect_business_trust_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_trusted_context() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- New listings always start unverified with no ratings, whatever the client sends.
    new.verification_status := 'unverified';
    new.rating_average := 0;
    new.rating_count := 0;
    return new;
  end if;

  -- Updates made by other triggers (the rating refresh) run at depth > 1 and are allowed.
  if pg_trigger_depth() > 1 then
    return new;
  end if;

  if new.verification_status is distinct from old.verification_status then
    raise exception 'Only admins can change verification status';
  end if;

  if new.rating_average is distinct from old.rating_average
     or new.rating_count is distinct from old.rating_count then
    raise exception 'Ratings are calculated from reviews and cannot be edited directly';
  end if;

  if new.is_active is distinct from old.is_active then
    raise exception 'Only admins can hide or re-publish a listing';
  end if;

  return new;
end;
$$;

drop trigger if exists businesses_protect_verification on public.businesses;
drop function if exists public.protect_verification_status();

drop trigger if exists businesses_protect_trust on public.businesses;
create trigger businesses_protect_trust
before insert or update on public.businesses
for each row execute function public.protect_business_trust_fields();

-- 4. Verification requests: only the business owner may submit -----------------
drop policy if exists "verification: submitter create" on public.verification_requests;
create policy "verification: owner submits"
  on public.verification_requests
  for insert
  with check (
    submitted_by = auth.uid()
    and exists (
      select 1 from public.businesses b
      where b.id = business_id and b.owner_id = auth.uid()
    )
  );

-- 5. Reviews: only on active businesses ---------------------------------------
drop policy if exists "reviews: user create own" on public.reviews;
create policy "reviews: user creates on active business"
  on public.reviews
  for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.businesses b
      where b.id = business_id and b.is_active
    )
  );

-- 6. Reviewer display names ----------------------------------------------------
-- Profiles are private, so the app asks this function for names. It only returns
-- names of people who have written a review, and never returns other profile fields.
create or replace function public.get_review_authors(author_ids uuid[])
returns table (id uuid, display_name text)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, coalesce(nullif(p.full_name, ''), 'Customer')
  from public.profiles p
  where p.id = any (author_ids)
    and exists (select 1 from public.reviews r where r.user_id = p.id);
$$;

grant execute on function public.get_review_authors(uuid[]) to anon, authenticated;

-- 7. Internal functions are not callable through the API ----------------------
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.refresh_business_rating() from public, anon, authenticated;
revoke execute on function public.protect_business_trust_fields() from public, anon, authenticated;
revoke execute on function public.is_trusted_context() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
-- is_admin() is used inside row-level security policies, so anon and authenticated keep it.
