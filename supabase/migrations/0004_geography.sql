-- =============================================================================
-- 0004: India-wide geography foundation (ADDITIVE)
--
-- Hierarchy:  Country -> State/UT -> District -> City/Town/Village -> Locality
-- PIN codes:  many-to-many with localities; a PIN may span districts.
--
-- RUN AFTER 0001, 0002 and 0003. This file:
--   * creates new tables only (never drops or recreates existing ones),
--   * adds NULLABLE link columns to businesses (existing business IDs are kept),
--   * links existing businesses to location records ONLY where a text value matches
--     an existing record. It creates no geographical records.
-- It is safe to re-run. Nothing is deleted or truncated.
-- =============================================================================

-- 0. Prerequisites ------------------------------------------------------------
do $$
begin
  if to_regclass('public.businesses') is null then
    raise exception 'Table businesses is missing. Run 0001 first.';
  end if;
  if to_regclass('public.business_members') is null then
    raise exception 'Table business_members is missing. Run 0003 first.';
  end if;
  if not exists (select 1 from pg_proc where proname = 'is_admin') then
    raise exception 'Function is_admin() is missing. Run 0001 first.';
  end if;
end
$$;

-- 1. Countries ----------------------------------------------------------------
create table if not exists public.countries (
  id uuid primary key default gen_random_uuid(),
  iso_code char(2) not null,
  name text not null,
  aliases text[] not null default '{}',
  is_published boolean not null default false,
  latitude double precision,
  longitude double precision,
  source text,
  external_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint countries_iso_code_key unique (iso_code),
  constraint countries_iso_code_format check (iso_code ~ '^[A-Z]{2}$'),
  constraint countries_name_key unique (name),
  constraint countries_name_not_blank check (char_length(btrim(name)) between 1 and 200),
  constraint countries_coords_paired check ((latitude is null) = (longitude is null)),
  constraint countries_latitude_range check (latitude is null or latitude between -90 and 90),
  constraint countries_longitude_range check (longitude is null or longitude between -180 and 180)
);

-- 2. States and union territories --------------------------------------------
-- 'code' is the official short code, only when a reliable source provides it. Never guessed.
create table if not exists public.states (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.countries (id) on delete restrict,
  name text not null,
  kind text not null default 'state',
  code text,
  aliases text[] not null default '{}',
  is_published boolean not null default false,
  latitude double precision,
  longitude double precision,
  source text,
  external_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint states_country_name_key unique (country_id, name),
  constraint states_id_country_key unique (id, country_id),
  constraint states_kind_check check (kind in ('state', 'union_territory')),
  constraint states_code_format check (code is null or code ~ '^[A-Z0-9]{1,10}$'),
  constraint states_name_not_blank check (char_length(btrim(name)) between 1 and 200),
  constraint states_coords_paired check ((latitude is null) = (longitude is null)),
  constraint states_latitude_range check (latitude is null or latitude between -90 and 90),
  constraint states_longitude_range check (longitude is null or longitude between -180 and 180)
);

create unique index if not exists states_country_code_key
  on public.states (country_id, code) where code is not null;

-- 3. Districts ----------------------------------------------------------------
create table if not exists public.districts (
  id uuid primary key default gen_random_uuid(),
  state_id uuid not null references public.states (id) on delete restrict,
  name text not null,
  code text,
  aliases text[] not null default '{}',
  is_published boolean not null default false,
  latitude double precision,
  longitude double precision,
  source text,
  external_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint districts_state_name_key unique (state_id, name),
  constraint districts_id_state_key unique (id, state_id),
  constraint districts_code_format check (code is null or code ~ '^[A-Z0-9]{1,15}$'),
  constraint districts_name_not_blank check (char_length(btrim(name)) between 1 and 200),
  constraint districts_coords_paired check ((latitude is null) = (longitude is null)),
  constraint districts_latitude_range check (latitude is null or latitude between -90 and 90),
  constraint districts_longitude_range check (longitude is null or longitude between -180 and 180)
);

create unique index if not exists districts_state_code_key
  on public.districts (state_id, code) where code is not null;

-- 4. Cities, towns and villages ----------------------------------------------
create table if not exists public.cities (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null references public.districts (id) on delete restrict,
  name text not null,
  kind text not null default 'city',
  aliases text[] not null default '{}',
  is_published boolean not null default false,
  latitude double precision,
  longitude double precision,
  source text,
  external_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cities_district_name_key unique (district_id, name),
  constraint cities_id_district_key unique (id, district_id),
  constraint cities_kind_check check (kind in ('metro', 'city', 'town', 'village')),
  constraint cities_name_not_blank check (char_length(btrim(name)) between 1 and 200),
  constraint cities_coords_paired check ((latitude is null) = (longitude is null)),
  constraint cities_latitude_range check (latitude is null or latitude between -90 and 90),
  constraint cities_longitude_range check (longitude is null or longitude between -180 and 180)
);

-- 5. Localities (neighbourhoods, areas) ---------------------------------------
create table if not exists public.localities (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities (id) on delete restrict,
  name text not null,
  aliases text[] not null default '{}',
  is_published boolean not null default false,
  latitude double precision,
  longitude double precision,
  source text,
  external_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint localities_city_name_key unique (city_id, name),
  constraint localities_id_city_key unique (id, city_id),
  constraint localities_name_not_blank check (char_length(btrim(name)) between 1 and 200),
  constraint localities_coords_paired check ((latitude is null) = (longitude is null)),
  constraint localities_latitude_range check (latitude is null or latitude between -90 and 90),
  constraint localities_longitude_range check (longitude is null or longitude between -180 and 180)
);

-- 6. PIN codes ----------------------------------------------------------------
-- One PIN can serve many localities, and one locality can have many PINs (see join table).
-- The same PIN code may appear once per district, because some PINs cross district lines.
create table if not exists public.pincodes (
  id uuid primary key default gen_random_uuid(),
  code char(6) not null,
  district_id uuid references public.districts (id) on delete restrict,
  office_name text,
  is_published boolean not null default false,
  source text,
  external_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pincodes_code_format check (code ~ '^[1-9][0-9]{5}$'),
  constraint pincodes_office_name_length check (office_name is null or char_length(office_name) <= 200)
);

-- Duplicate prevention for nullable district: treat NULL as one fixed value.
create unique index if not exists pincodes_code_district_key
  on public.pincodes (code, coalesce(district_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- 7. Locality <-> PIN code (many to many) ---------------------------------------
create table if not exists public.locality_pincodes (
  locality_id uuid not null references public.localities (id) on delete cascade,
  pincode_id uuid not null references public.pincodes (id) on delete restrict,
  primary key (locality_id, pincode_id)
);

create index if not exists locality_pincodes_pincode_idx on public.locality_pincodes (pincode_id);

-- 8. Indexes for hierarchy lookups and search -----------------------------------
create index if not exists states_country_idx on public.states (country_id);
create index if not exists districts_state_idx on public.districts (state_id);
create index if not exists cities_district_idx on public.cities (district_id);
create index if not exists localities_city_idx on public.localities (city_id);
create index if not exists pincodes_district_idx on public.pincodes (district_id);

create index if not exists states_name_lower_idx on public.states (lower(name));
create index if not exists districts_name_lower_idx on public.districts (lower(name));
create index if not exists cities_name_lower_idx on public.cities (lower(name));
create index if not exists localities_name_lower_idx on public.localities (lower(name));

create index if not exists states_aliases_idx on public.states using gin (aliases);
create index if not exists districts_aliases_idx on public.districts using gin (aliases);
create index if not exists cities_aliases_idx on public.cities using gin (aliases);
create index if not exists localities_aliases_idx on public.localities using gin (aliases);

create index if not exists states_published_idx on public.states (is_published) where is_published;
create index if not exists districts_published_idx on public.districts (is_published) where is_published;
create index if not exists cities_published_idx on public.cities (is_published) where is_published;
create index if not exists localities_published_idx on public.localities (is_published) where is_published;

-- External source ids must be unique per source, which makes imports repeatable.
create unique index if not exists states_external_key on public.states (source, external_id)
  where external_id is not null;
create unique index if not exists districts_external_key on public.districts (source, external_id)
  where external_id is not null;
create unique index if not exists cities_external_key on public.cities (source, external_id)
  where external_id is not null;
create unique index if not exists localities_external_key on public.localities (source, external_id)
  where external_id is not null;
create unique index if not exists pincodes_external_key on public.pincodes (source, external_id)
  where external_id is not null;

-- 9. updated_at maintenance -----------------------------------------------------
drop trigger if exists countries_set_updated_at on public.countries;
create trigger countries_set_updated_at before update on public.countries
  for each row execute function public.set_updated_at();
drop trigger if exists states_set_updated_at on public.states;
create trigger states_set_updated_at before update on public.states
  for each row execute function public.set_updated_at();
drop trigger if exists districts_set_updated_at on public.districts;
create trigger districts_set_updated_at before update on public.districts
  for each row execute function public.set_updated_at();
drop trigger if exists cities_set_updated_at on public.cities;
create trigger cities_set_updated_at before update on public.cities
  for each row execute function public.set_updated_at();
drop trigger if exists localities_set_updated_at on public.localities;
create trigger localities_set_updated_at before update on public.localities
  for each row execute function public.set_updated_at();
drop trigger if exists pincodes_set_updated_at on public.pincodes;
create trigger pincodes_set_updated_at before update on public.pincodes
  for each row execute function public.set_updated_at();

-- 10. Publication helpers --------------------------------------------------------
-- A record is public only when it AND every ancestor are published.
create or replace function public.is_state_public(p_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.states s
    join public.countries c on c.id = s.country_id
    where s.id = p_id and s.is_published and c.is_published
  );
$$;

create or replace function public.is_district_public(p_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.districts d
    where d.id = p_id and d.is_published and public.is_state_public(d.state_id)
  );
$$;

create or replace function public.is_city_public(p_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.cities c
    where c.id = p_id and c.is_published and public.is_district_public(c.district_id)
  );
$$;

create or replace function public.is_locality_public(p_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.localities l
    where l.id = p_id and l.is_published and public.is_city_public(l.city_id)
  );
$$;

-- 11. Row Level Security: anyone reads published data; only admins write ----------
alter table public.countries enable row level security;
alter table public.states enable row level security;
alter table public.districts enable row level security;
alter table public.cities enable row level security;
alter table public.localities enable row level security;
alter table public.pincodes enable row level security;
alter table public.locality_pincodes enable row level security;

drop policy if exists "countries: public read published" on public.countries;
create policy "countries: public read published" on public.countries
  for select using (is_published or public.is_admin());
drop policy if exists "countries: admin write" on public.countries;
create policy "countries: admin write" on public.countries
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "states: public read published" on public.states;
create policy "states: public read published" on public.states
  for select using (public.is_admin() or public.is_state_public(id));
drop policy if exists "states: admin write" on public.states;
create policy "states: admin write" on public.states
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "districts: public read published" on public.districts;
create policy "districts: public read published" on public.districts
  for select using (public.is_admin() or public.is_district_public(id));
drop policy if exists "districts: admin write" on public.districts;
create policy "districts: admin write" on public.districts
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "cities: public read published" on public.cities;
create policy "cities: public read published" on public.cities
  for select using (public.is_admin() or public.is_city_public(id));
drop policy if exists "cities: admin write" on public.cities;
create policy "cities: admin write" on public.cities
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "localities: public read published" on public.localities;
create policy "localities: public read published" on public.localities
  for select using (public.is_admin() or public.is_locality_public(id));
drop policy if exists "localities: admin write" on public.localities;
create policy "localities: admin write" on public.localities
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "pincodes: public read published" on public.pincodes;
create policy "pincodes: public read published" on public.pincodes
  for select using (
    public.is_admin()
    or (is_published and (district_id is null or public.is_district_public(district_id)))
  );
drop policy if exists "pincodes: admin write" on public.pincodes;
create policy "pincodes: admin write" on public.pincodes
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "locality_pincodes: public read published" on public.locality_pincodes;
create policy "locality_pincodes: public read published" on public.locality_pincodes
  for select using (
    public.is_admin()
    or (
      public.is_locality_public(locality_id)
      and exists (select 1 from public.pincodes p where p.id = pincode_id and p.is_published)
    )
  );
drop policy if exists "locality_pincodes: admin write" on public.locality_pincodes;
create policy "locality_pincodes: admin write" on public.locality_pincodes
  for all using (public.is_admin()) with check (public.is_admin());

-- Read access for the API roles; RLS above decides which rows are visible.
grant select on public.countries, public.states, public.districts, public.cities,
  public.localities, public.pincodes, public.locality_pincodes to anon, authenticated;
grant insert, update, delete on public.countries, public.states, public.districts, public.cities,
  public.localities, public.pincodes, public.locality_pincodes to authenticated;

-- 12. Hierarchy rule: a PIN code must belong to the same district as the locality ----
create or replace function public.check_locality_pincode_district()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_city_district uuid;
  v_pin_district uuid;
begin
  select c.district_id into v_city_district
  from public.localities l join public.cities c on c.id = l.city_id
  where l.id = new.locality_id;

  select p.district_id into v_pin_district
  from public.pincodes p
  where p.id = new.pincode_id;

  if v_pin_district is not null and v_pin_district is distinct from v_city_district then
    raise exception 'This PIN code belongs to a different district than the locality'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists locality_pincodes_check_district on public.locality_pincodes;
create trigger locality_pincodes_check_district
  before insert or update on public.locality_pincodes
  for each row execute function public.check_locality_pincode_district();

-- 13. Business links -------------------------------------------------------------
-- Existing text columns (state, district, city, pincode) stay as they are.
alter table public.businesses
  add column if not exists country_id uuid,
  add column if not exists state_id uuid,
  add column if not exists district_id uuid,
  add column if not exists city_id uuid,
  add column if not exists locality_id uuid,
  add column if not exists pincode_id uuid;

do $$
begin
  -- Single-column foreign keys
  if not exists (select 1 from pg_constraint where conname = 'businesses_country_fk') then
    alter table public.businesses add constraint businesses_country_fk
      foreign key (country_id) references public.countries (id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'businesses_state_fk') then
    alter table public.businesses add constraint businesses_state_fk
      foreign key (state_id) references public.states (id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'businesses_district_fk') then
    alter table public.businesses add constraint businesses_district_fk
      foreign key (district_id) references public.districts (id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'businesses_city_fk') then
    alter table public.businesses add constraint businesses_city_fk
      foreign key (city_id) references public.cities (id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'businesses_locality_fk') then
    alter table public.businesses add constraint businesses_locality_fk
      foreign key (locality_id) references public.localities (id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'businesses_pincode_fk') then
    alter table public.businesses add constraint businesses_pincode_fk
      foreign key (pincode_id) references public.pincodes (id) on delete restrict;
  end if;

  -- Composite foreign keys: each link must agree with its parent, so a locality cannot
  -- be attached to a city it does not belong to.
  if not exists (select 1 from pg_constraint where conname = 'businesses_state_country_fk') then
    alter table public.businesses add constraint businesses_state_country_fk
      foreign key (state_id, country_id) references public.states (id, country_id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'businesses_district_state_fk') then
    alter table public.businesses add constraint businesses_district_state_fk
      foreign key (district_id, state_id) references public.districts (id, state_id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'businesses_city_district_fk') then
    alter table public.businesses add constraint businesses_city_district_fk
      foreign key (city_id, district_id) references public.cities (id, district_id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'businesses_locality_city_fk') then
    alter table public.businesses add constraint businesses_locality_city_fk
      foreign key (locality_id, city_id) references public.localities (id, city_id) on delete restrict;
  end if;

  -- A child link needs its parent link (no gaps in the chain)
  if not exists (select 1 from pg_constraint where conname = 'businesses_chain_state_needs_country') then
    alter table public.businesses add constraint businesses_chain_state_needs_country
      check (state_id is null or country_id is not null);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'businesses_chain_district_needs_state') then
    alter table public.businesses add constraint businesses_chain_district_needs_state
      check (district_id is null or state_id is not null);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'businesses_chain_city_needs_district') then
    alter table public.businesses add constraint businesses_chain_city_needs_district
      check (city_id is null or district_id is not null);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'businesses_chain_locality_needs_city') then
    alter table public.businesses add constraint businesses_chain_locality_needs_city
      check (locality_id is null or city_id is not null);
  end if;

  -- PIN format. NOT VALID: new and changed rows are checked now; existing rows are checked
  -- by the separate VALIDATE step in docs/GEOGRAPHY.md, once any bad values are cleaned up.
  if not exists (select 1 from pg_constraint where conname = 'businesses_pincode_format') then
    alter table public.businesses add constraint businesses_pincode_format
      check (pincode is null or pincode ~ '^[1-9][0-9]{5}$') not valid;
  end if;
end
$$;

-- A business PIN link must agree with the business text PIN and with its district.
create or replace function public.check_business_pincode()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code char(6);
  v_district uuid;
begin
  if new.pincode_id is null then
    return new;
  end if;

  select p.code, p.district_id into v_code, v_district
  from public.pincodes p
  where p.id = new.pincode_id;

  if new.pincode is distinct from v_code::text then
    raise exception 'Business PIN code must match the selected PIN code record'
      using errcode = 'check_violation';
  end if;
  if v_district is not null and new.district_id is not null and v_district <> new.district_id then
    raise exception 'The selected PIN code belongs to a different district'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists businesses_check_pincode on public.businesses;
create trigger businesses_check_pincode
  before insert or update of pincode, pincode_id, district_id on public.businesses
  for each row execute function public.check_business_pincode();

-- Indexes on the new business links (foreign-key columns are indexed for fast joins and deletes)
create index if not exists businesses_state_district_city_idx
  on public.businesses (state_id, district_id, city_id);
create index if not exists businesses_country_idx on public.businesses (country_id) where country_id is not null;
create index if not exists businesses_district_idx on public.businesses (district_id) where district_id is not null;
create index if not exists businesses_city_idx on public.businesses (city_id) where city_id is not null;
create index if not exists businesses_locality_idx on public.businesses (locality_id) where locality_id is not null;
create index if not exists businesses_pincode_idx on public.businesses (pincode_id) where pincode_id is not null;

-- 14. Link existing businesses to matching location records (never creates records) ----
-- Matches are exact, case-insensitive and whitespace-trimmed, against India only.
-- Rows that already have a link are left alone. Business IDs are not changed.
update public.businesses b
set country_id = s.country_id,
    state_id = s.id
from public.states s
join public.countries c on c.id = s.country_id
where c.iso_code = 'IN'
  and b.state_id is null
  and lower(btrim(s.name)) = lower(btrim(b.state));

update public.businesses b
set district_id = d.id
from public.districts d
where b.state_id is not null
  and b.district_id is null
  and d.state_id = b.state_id
  and lower(btrim(d.name)) = lower(btrim(b.district));

update public.businesses b
set city_id = c.id
from public.cities c
where b.district_id is not null
  and b.city_id is null
  and c.district_id = b.district_id
  and lower(btrim(c.name)) = lower(btrim(b.city));

-- 15. Execution rights for internal functions -------------------------------------
revoke execute on function public.check_business_pincode() from public, anon, authenticated;
revoke execute on function public.check_locality_pincode_district() from public, anon, authenticated;
