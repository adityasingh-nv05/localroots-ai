-- =============================================================================
-- 0003: account roles, business membership and trusted admin assignment
--
-- RUN AFTER 0001 and 0002. Additive and safe to re-run. Deletes no data.
--
-- Rules this file enforces in the database (not just in the app):
--   1. Nobody can make themselves an admin. Only a trusted server process can.
--      Trusted = SQL editor (direct connection) or the service role.
--   2. Customers can become vendors (customer -> vendor only). Admins can never be
--      changed through this path.
--   3. Business access comes from business_members (owner / manager / staff),
--      not from a single owner_id column.
--   4. New businesses start inactive and unverified. Vendors cannot verify anything.
-- =============================================================================

-- 1. Business membership ------------------------------------------------------
create table if not exists public.business_members (
  business_id uuid not null references public.businesses (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('owner', 'manager', 'staff')),
  created_at timestamptz not null default now(),
  primary key (business_id, user_id)
);

create index if not exists business_members_user_idx on public.business_members (user_id);

-- Existing listings keep their owner as an owner member. Nothing is removed.
insert into public.business_members (business_id, user_id, role)
select b.id, b.owner_id, 'owner'
from public.businesses b
where b.owner_id is not null
on conflict (business_id, user_id) do nothing;

-- 2. Audit log for admin changes ----------------------------------------------
create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  action text not null check (action in ('grant_admin', 'revoke_admin')),
  target_user_id uuid references public.profiles (id) on delete set null,
  performed_by text not null,
  created_at timestamptz not null default now()
);

alter table public.business_members enable row level security;
alter table public.admin_audit_log enable row level security;

-- 3. Helper functions ---------------------------------------------------------

-- True for a direct database connection (SQL editor, migrations) or the service role.
-- Never true for end users with a sign-in token.
create or replace function public.is_direct_or_service_context()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    nullif(current_setting('request.jwt.claims', true), '') is null
    or coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', '') = 'service_role';
$$;

create or replace function public.is_business_member(p_business uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.business_members m
    where m.business_id = p_business
      and m.user_id = auth.uid()
      and m.role = any (p_roles)
  );
$$;

-- 4. Business insert and update protection (replaces the 0002 version) --------
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
    new.verification_status := 'unverified';
    new.rating_average := 0;
    new.rating_count := 0;
    new.is_active := false;
    return new;
  end if;

  -- Updates made by other triggers (the rating refresh) run at depth > 1.
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
    raise exception 'Only admins can hide or publish a listing';
  end if;
  return new;
end;
$$;

-- 5. Profile role protection ---------------------------------------------------
-- Column privileges already stop clients editing role (see 0001). This trigger is a second
-- layer: the only allowed change by an end user is customer -> vendor on their own profile.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is not distinct from old.role then
    return new;
  end if;
  if public.is_direct_or_service_context() then
    return new;
  end if;
  if old.role = 'customer' and new.role = 'vendor' and old.id = auth.uid() then
    return new;
  end if;
  raise exception 'Account roles can only be changed by a trusted server process';
end;
$$;

drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role
before update on public.profiles
for each row execute function public.protect_profile_role();

-- 6. Admin assignment: trusted callers only ------------------------------------
create or replace function public.grant_admin(p_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_direct_or_service_context() then
    raise exception 'Admin roles can only be assigned by a trusted server process';
  end if;
  if not exists (select 1 from public.profiles where id = p_user) then
    raise exception 'No profile exists for that user';
  end if;

  update public.profiles set role = 'admin' where id = p_user;

  insert into public.admin_audit_log (action, target_user_id, performed_by)
  values (
    'grant_admin',
    p_user,
    coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', 'direct connection')
  );
end;
$$;

create or replace function public.revoke_admin(p_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_direct_or_service_context() then
    raise exception 'Admin roles can only be changed by a trusted server process';
  end if;

  update public.profiles set role = 'customer' where id = p_user and role = 'admin';
  if not found then
    raise exception 'That user is not an administrator';
  end if;

  insert into public.admin_audit_log (action, target_user_id, performed_by)
  values (
    'revoke_admin',
    p_user,
    coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', 'direct connection')
  );
end;
$$;

-- 7. Vendor registration: upgrade own account, then create a business -----------
create or replace function public.become_vendor()
returns public.user_role
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_role;
begin
  if auth.uid() is null then
    raise exception 'Sign in before registering as a vendor';
  end if;

  select p.role into v_role from public.profiles p where p.id = auth.uid();
  if v_role is null then
    raise exception 'No profile found for this account';
  end if;
  if v_role = 'admin' then
    raise exception 'This account cannot change role here';
  end if;
  if v_role = 'customer' then
    update public.profiles set role = 'vendor' where id = auth.uid();
    return 'vendor';
  end if;
  return v_role; -- already a vendor
end;
$$;

create or replace function public.create_vendor_business(
  p_name text,
  p_slug text,
  p_description text,
  p_category text,
  p_state text,
  p_district text,
  p_city text,
  p_address text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_role;
  v_owned integer;
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Sign in before creating a business';
  end if;

  select p.role into v_role from public.profiles p where p.id = auth.uid();
  if v_role is distinct from 'vendor' then
    raise exception 'Only vendor accounts can create businesses. Register as a vendor first.';
  end if;

  if p_name is null or char_length(trim(p_name)) < 2 or char_length(trim(p_name)) > 120 then
    raise exception 'Business name must be 2 to 120 characters';
  end if;
  if p_slug is null or char_length(p_slug) > 80 or p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
    raise exception 'Web address may only contain lowercase letters, numbers and single hyphens';
  end if;
  if char_length(coalesce(p_description, '')) > 2000 then
    raise exception 'Description is too long';
  end if;
  if coalesce(trim(p_state), '') = '' or coalesce(trim(p_district), '') = '' or coalesce(trim(p_city), '') = '' then
    raise exception 'State, district and city are required';
  end if;

  select count(*) into v_owned
  from public.business_members m
  where m.user_id = auth.uid() and m.role = 'owner';
  if v_owned >= 10 then
    raise exception 'A vendor account can own up to 10 businesses';
  end if;

  -- Starts inactive and unverified. An admin must publish and verify it.
  insert into public.businesses (
    slug, owner_id, name, description, category_slug,
    state, district, city, address, is_active
  ) values (
    p_slug, auth.uid(), trim(p_name), coalesce(p_description, ''), p_category,
    trim(p_state), trim(p_district), trim(p_city), coalesce(p_address, ''), false
  )
  returning id into v_id;

  insert into public.business_members (business_id, user_id, role)
  values (v_id, auth.uid(), 'owner');

  return v_id;
end;
$$;

-- 8. Row-level security: move from owner_id to membership ----------------------
drop policy if exists "businesses: public read active" on public.businesses;
drop policy if exists "businesses: owner create" on public.businesses;
drop policy if exists "businesses: owner or admin update" on public.businesses;

create policy "businesses: visible when active or to members"
  on public.businesses for select
  using (
    is_active
    or public.is_business_member(id, array['owner', 'manager', 'staff'])
    or public.is_admin()
  );

-- No insert policy: listings are created only through create_vendor_business().

create policy "businesses: owner or manager update"
  on public.businesses for update
  using (public.is_business_member(id, array['owner', 'manager']) or public.is_admin())
  with check (public.is_business_member(id, array['owner', 'manager']) or public.is_admin());

drop policy if exists "products: public read" on public.products;
drop policy if exists "products: owner or admin manage" on public.products;

create policy "products: read when business is visible"
  on public.products for select
  using (
    exists (
      select 1 from public.businesses b
      where b.id = business_id
        and (b.is_active
             or public.is_business_member(b.id, array['owner', 'manager', 'staff'])
             or public.is_admin())
    )
  );

create policy "products: members manage"
  on public.products for all
  using (public.is_business_member(business_id, array['owner', 'manager', 'staff']) or public.is_admin())
  with check (public.is_business_member(business_id, array['owner', 'manager', 'staff']) or public.is_admin());

drop policy if exists "verification: owner submits" on public.verification_requests;
drop policy if exists "verification: submitter or admin read" on public.verification_requests;

create policy "verification: owner submits"
  on public.verification_requests for insert
  with check (
    submitted_by = auth.uid()
    and public.is_business_member(business_id, array['owner'])
  );

create policy "verification: owner or admin read"
  on public.verification_requests for select
  using (
    submitted_by = auth.uid()
    or public.is_business_member(business_id, array['owner'])
    or public.is_admin()
  );

drop policy if exists "subscriptions: owner or admin read" on public.subscriptions;
create policy "subscriptions: members or admin read"
  on public.subscriptions for select
  using (
    public.is_business_member(business_id, array['owner', 'manager', 'staff'])
    or public.is_admin()
  );

create policy "business_members: read own, team or admin"
  on public.business_members for select
  using (
    user_id = auth.uid()
    or public.is_business_member(business_id, array['owner'])
    or public.is_admin()
  );

create policy "admin_audit_log: admin read"
  on public.admin_audit_log for select
  using (public.is_admin());

-- 9. Execution rights ------------------------------------------------------------
-- Admin assignment: service role and SQL editor only.
revoke execute on function public.grant_admin(uuid) from public, anon, authenticated;
revoke execute on function public.revoke_admin(uuid) from public, anon, authenticated;
grant execute on function public.grant_admin(uuid) to service_role;
grant execute on function public.revoke_admin(uuid) to service_role;

-- Vendor registration: signed-in users only.
revoke execute on function public.become_vendor() from public, anon;
grant execute on function public.become_vendor() to authenticated;
revoke execute on function public.create_vendor_business(text, text, text, text, text, text, text, text) from public, anon;
grant execute on function public.create_vendor_business(text, text, text, text, text, text, text, text) to authenticated;

-- Internal helpers are not callable through the API.
revoke execute on function public.protect_profile_role() from public, anon, authenticated;
revoke execute on function public.is_direct_or_service_context() from public, anon, authenticated;
