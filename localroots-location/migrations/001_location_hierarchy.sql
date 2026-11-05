-- 001_location_hierarchy.sql
-- Additive only: creates new tables, seeds India and its 36 states/UTs.
-- Does not drop, alter or delete any existing table or record.

create extension if not exists postgis;

create table if not exists public.countries (
  id smallint generated always as identity primary key,
  iso_code char(2) not null unique,
  name text not null
);

create table if not exists public.states_uts (
  id smallint generated always as identity primary key,
  country_id smallint not null references public.countries(id),
  lgd_code text unique,
  name text not null,
  kind text not null check (kind in ('state', 'union_territory')),
  unique (country_id, name)
);
create index if not exists states_uts_country_idx on public.states_uts(country_id);

create table if not exists public.districts (
  id integer generated always as identity primary key,
  state_ut_id smallint not null references public.states_uts(id),
  lgd_code text unique,
  name text not null,
  unique (state_ut_id, name)
);
create index if not exists districts_state_idx on public.districts(state_ut_id);

create table if not exists public.cities (
  id integer generated always as identity primary key,
  district_id integer not null references public.districts(id),
  name text not null,
  kind text not null default 'city' check (kind in ('city', 'town', 'village')),
  location geography(Point, 4326),
  unique (district_id, name)
);
create index if not exists cities_district_idx on public.cities(district_id);
create index if not exists cities_location_gix on public.cities using gist(location);

create table if not exists public.localities (
  id bigint generated always as identity primary key,
  city_id integer not null references public.cities(id),
  name text not null,
  location geography(Point, 4326),
  unique (city_id, name)
);
create index if not exists localities_city_idx on public.localities(city_id);
create index if not exists localities_location_gix on public.localities using gist(location);

create table if not exists public.pincodes (
  code char(6) primary key check (code ~ '^[1-9][0-9]{5}$'),
  district_id integer not null references public.districts(id)
);
create index if not exists pincodes_district_idx on public.pincodes(district_id);

-- Reference data: readable by everyone, writable only by server-side admin code
-- (service role), never directly from the browser client.
alter table public.countries  enable row level security;
alter table public.states_uts enable row level security;
alter table public.districts  enable row level security;
alter table public.cities     enable row level security;
alter table public.localities enable row level security;
alter table public.pincodes   enable row level security;

create policy "location reference is readable" on public.countries  for select using (true);
create policy "location reference is readable" on public.states_uts for select using (true);
create policy "location reference is readable" on public.districts  for select using (true);
create policy "location reference is readable" on public.cities     for select using (true);
create policy "location reference is readable" on public.localities for select using (true);
create policy "location reference is readable" on public.pincodes   for select using (true);

-- Seed: India and all 36 states/UTs (28 states + 8 UTs).
insert into public.countries (iso_code, name) values ('IN', 'India')
on conflict (iso_code) do nothing;

insert into public.states_uts (country_id, name, kind)
select c.id, s.name, s.kind
from public.countries c
cross join (values
  ('Andhra Pradesh', 'state'), ('Arunachal Pradesh', 'state'), ('Assam', 'state'),
  ('Bihar', 'state'), ('Chhattisgarh', 'state'), ('Goa', 'state'), ('Gujarat', 'state'),
  ('Haryana', 'state'), ('Himachal Pradesh', 'state'), ('Jharkhand', 'state'),
  ('Karnataka', 'state'), ('Kerala', 'state'), ('Madhya Pradesh', 'state'),
  ('Maharashtra', 'state'), ('Manipur', 'state'), ('Meghalaya', 'state'),
  ('Mizoram', 'state'), ('Nagaland', 'state'), ('Odisha', 'state'), ('Punjab', 'state'),
  ('Rajasthan', 'state'), ('Sikkim', 'state'), ('Tamil Nadu', 'state'),
  ('Telangana', 'state'), ('Tripura', 'state'), ('Uttar Pradesh', 'state'),
  ('Uttarakhand', 'state'), ('West Bengal', 'state'),
  ('Andaman and Nicobar Islands', 'union_territory'), ('Chandigarh', 'union_territory'),
  ('Dadra and Nagar Haveli and Daman and Diu', 'union_territory'),
  ('Delhi', 'union_territory'), ('Jammu and Kashmir', 'union_territory'),
  ('Ladakh', 'union_territory'), ('Lakshadweep', 'union_territory'),
  ('Puducherry', 'union_territory')
) as s(name, kind)
where c.iso_code = 'IN'
on conflict (country_id, name) do nothing;
