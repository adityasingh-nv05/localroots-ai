-- 002_businesses_location_links.sql (re-runnable)
-- Additive. Existing text columns and data are untouched.

-- Composite keys so a child level can only reference a parent it belongs to.
do $$ begin
  alter table public.districts add constraint districts_state_id_key unique (state_ut_id, id);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.cities add constraint cities_district_id_key unique (district_id, id);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.localities add constraint localities_city_id_key unique (city_id, id);
exception when duplicate_object then null; end $$;

-- New nullable columns on businesses.
alter table public.businesses
  add column if not exists state_ut_id   smallint,
  add column if not exists district_id   integer,
  add column if not exists city_id       integer,
  add column if not exists locality_id   bigint,
  add column if not exists pincode_code  char(6),
  add column if not exists geo geography(Point, 4326) generated always as (
    case
      when latitude is not null and longitude is not null
      then st_setsrid(st_makepoint(longitude, latitude), 4326)::geography
    end
  ) stored;

-- Single-column foreign keys.
do $$ begin
  alter table public.businesses add constraint businesses_state_fk
    foreign key (state_ut_id) references public.states_uts(id);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.businesses add constraint businesses_pincode_fk
    foreign key (pincode_code) references public.pincodes(code);
exception when duplicate_object then null; end $$;

-- Composite foreign keys: each level must sit inside the level above it.
do $$ begin
  alter table public.businesses add constraint businesses_district_fk
    foreign key (state_ut_id, district_id) references public.districts(state_ut_id, id);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.businesses add constraint businesses_city_fk
    foreign key (district_id, city_id) references public.cities(district_id, id);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.businesses add constraint businesses_locality_fk
    foreign key (city_id, locality_id) references public.localities(city_id, id);
exception when duplicate_object then null; end $$;

-- A lower level can't be set without the level above it.
do $$ begin
  alter table public.businesses add constraint businesses_location_complete check (
    (district_id is null or state_ut_id is not null)
    and (city_id is null or district_id is not null)
    and (locality_id is null or city_id is not null)
  );
exception when duplicate_object then null; end $$;

-- Coordinate and PIN checks. NOT VALID: applies to new rows, skips old ones.
do $$ begin
  alter table public.businesses add constraint businesses_latitude_range
    check (latitude is null or latitude between -90 and 90) not valid;
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.businesses add constraint businesses_longitude_range
    check (longitude is null or longitude between -180 and 180) not valid;
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.businesses add constraint businesses_coords_pair
    check ((latitude is null) = (longitude is null)) not valid;
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.businesses add constraint businesses_legacy_pincode_format
    check (pincode is null or pincode ~ '^[1-9][0-9]{5}$') not valid;
exception when duplicate_object then null; end $$;

-- Indexes.
create index if not exists businesses_state_ut_idx on public.businesses(state_ut_id);
create index if not exists businesses_district_idx on public.businesses(district_id);
create index if not exists businesses_city_idx     on public.businesses(city_id);
create index if not exists businesses_locality_idx on public.businesses(locality_id);
create index if not exists businesses_pincode_idx  on public.businesses(pincode_code);
create index if not exists businesses_geo_gix      on public.businesses using gist(geo);