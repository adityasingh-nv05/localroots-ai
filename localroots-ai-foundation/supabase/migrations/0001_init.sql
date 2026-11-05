-- LocalRoots AI: initial schema
-- Apply with the Supabase CLI (`supabase db push`) or paste into the SQL editor.
-- Designed so that a fresh database can run this file once, top to bottom.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('customer', 'vendor', 'admin');
create type public.verification_status as enum ('unverified', 'pending', 'verified', 'rejected');
create type public.subscription_plan as enum ('free', 'growth', 'premium');
create type public.subscription_status as enum ('inactive', 'trialing', 'active', 'past_due', 'cancelled');
create type public.ai_task_type as enum (
  'description_generation', 'category_suggestion', 'review_summary', 'image_tagging', 'search_ranking'
);
create type public.ai_task_status as enum ('queued', 'running', 'succeeded', 'failed');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- One row per Supabase Auth user. Role is never read from user metadata.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text not null default '',
  avatar_url text,
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  sort_order integer not null default 0
);

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  owner_id uuid references public.profiles (id) on delete set null,
  name text not null,
  description text not null default '',
  category_slug text not null references public.categories (slug),
  tags text[] not null default '{}',

  state text not null,
  district text not null,
  city text not null,
  address text not null default '',
  pincode text,
  latitude double precision,
  longitude double precision,

  images text[] not null default '{}',
  website_url text,
  instagram_handle text,
  facebook_url text,
  youtube_url text,
  contact_phone text,
  contact_email text,

  verification_status public.verification_status not null default 'unverified',
  is_active boolean not null default true,
  rating_average numeric(2, 1) not null default 0,
  rating_count integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint businesses_coords_paired check ((latitude is null) = (longitude is null)),
  constraint businesses_latitude_range check (latitude is null or latitude between -90 and 90),
  constraint businesses_longitude_range check (longitude is null or longitude between -180 and 180),
  constraint businesses_rating_range check (rating_average between 0 and 5)
);

create index businesses_category_idx on public.businesses (category_slug);
create index businesses_location_idx on public.businesses (state, district, city);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  description text not null default '',
  category_slug text references public.categories (slug),
  price_inr integer check (price_inr is null or price_inr >= 0),
  image_url text,
  is_available boolean not null default true,
  created_at timestamptz not null default now()
);

create index products_business_idx on public.products (business_id);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text not null default '',
  created_at timestamptz not null default now(),
  unique (business_id, user_id)
);

create index reviews_business_idx on public.reviews (business_id);

create table public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  submitted_by uuid references public.profiles (id) on delete set null,
  status public.verification_status not null default 'pending',
  document_path text,
  reviewer_notes text,
  reviewed_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index verification_requests_business_idx on public.verification_requests (business_id);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  plan public.subscription_plan not null default 'free',
  status public.subscription_status not null default 'inactive',
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

create table public.ai_tasks (
  id uuid primary key default gen_random_uuid(),
  task_type public.ai_task_type not null,
  status public.ai_task_status not null default 'queued',
  business_id uuid references public.businesses (id) on delete cascade,
  requested_by uuid references public.profiles (id) on delete set null,
  input jsonb not null default '{}'::jsonb,
  output jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

-- ---------------------------------------------------------------------------
-- Helper functions
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- Keeps updated_at current on business edits.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger businesses_set_updated_at
before update on public.businesses
for each row execute function public.set_updated_at();

-- Blocks non-admins from changing verification status. Service-role calls are allowed.
create or replace function public.protect_verification_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.verification_status is distinct from old.verification_status
     and coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', '') <> 'service_role'
     and not public.is_admin() then
    raise exception 'Only admins can change verification status';
  end if;
  return new;
end;
$$;

create trigger businesses_protect_verification
before update on public.businesses
for each row execute function public.protect_verification_status();

-- Recalculates rating_average and rating_count whenever a review changes.
create or replace function public.refresh_business_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_business uuid;
begin
  if tg_op = 'DELETE' then
    target_business := old.business_id;
  else
    target_business := new.business_id;
  end if;

  update public.businesses b
  set
    rating_count = (select count(*) from public.reviews r where r.business_id = target_business),
    rating_average = coalesce(
      (select round(avg(r.rating)::numeric, 1) from public.reviews r where r.business_id = target_business),
      0
    )
  where b.id = target_business;

  return null;
end;
$$;

create trigger reviews_refresh_rating
after insert or update or delete on public.reviews
for each row execute function public.refresh_business_rating();

-- Creates a profile row for each new Auth user. Role always defaults to 'customer'.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.businesses enable row level security;
alter table public.products enable row level security;
alter table public.reviews enable row level security;
alter table public.verification_requests enable row level security;
alter table public.subscriptions enable row level security;
alter table public.ai_tasks enable row level security;

-- Users may edit only their own display fields, never their role.
revoke update on public.profiles from authenticated, anon;
grant update (full_name, avatar_url) on public.profiles to authenticated;

-- profiles
create policy "profiles: read own or admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles: update own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- categories: public read; writes are admin-only
create policy "categories: public read" on public.categories
  for select using (true);
create policy "categories: admin write" on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

-- businesses: active listings are public; owners and admins see/edit their own
create policy "businesses: public read active" on public.businesses
  for select using (is_active or owner_id = auth.uid() or public.is_admin());
create policy "businesses: owner create" on public.businesses
  for insert with check (owner_id = auth.uid());
create policy "businesses: owner or admin update" on public.businesses
  for update using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());
create policy "businesses: admin delete" on public.businesses
  for delete using (public.is_admin());

-- products: visible when the business is visible; managed by the owner or admin
create policy "products: public read" on public.products
  for select using (
    exists (select 1 from public.businesses b where b.id = business_id and (b.is_active or b.owner_id = auth.uid() or public.is_admin()))
  );
create policy "products: owner or admin manage" on public.products
  for all using (
    exists (select 1 from public.businesses b where b.id = business_id and (b.owner_id = auth.uid() or public.is_admin()))
  ) with check (
    exists (select 1 from public.businesses b where b.id = business_id and (b.owner_id = auth.uid() or public.is_admin()))
  );

-- reviews: public read; users write their own
create policy "reviews: public read" on public.reviews
  for select using (true);
create policy "reviews: user create own" on public.reviews
  for insert with check (user_id = auth.uid());
create policy "reviews: user or admin update" on public.reviews
  for update using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());
create policy "reviews: user or admin delete" on public.reviews
  for delete using (user_id = auth.uid() or public.is_admin());

-- verification requests: owners submit and read theirs; admins review
create policy "verification: submitter create" on public.verification_requests
  for insert with check (submitted_by = auth.uid());
create policy "verification: submitter or admin read" on public.verification_requests
  for select using (submitted_by = auth.uid() or public.is_admin());
create policy "verification: admin update" on public.verification_requests
  for update using (public.is_admin()) with check (public.is_admin());

-- subscriptions: owners may read; no client writes (payments will go through a server webhook)
create policy "subscriptions: owner or admin read" on public.subscriptions
  for select using (
    exists (select 1 from public.businesses b where b.id = business_id and (b.owner_id = auth.uid() or public.is_admin()))
  );

-- ai_tasks: requesters read their own; admins see all; no client updates
create policy "ai_tasks: requester create" on public.ai_tasks
  for insert with check (requested_by = auth.uid());
create policy "ai_tasks: requester or admin read" on public.ai_tasks
  for select using (requested_by = auth.uid() or public.is_admin());
