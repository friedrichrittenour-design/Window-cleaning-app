-- Run this in the Supabase SQL editor (or via `supabase db push`) on a fresh project.

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────
-- profiles
-- ─────────────────────────────────────────────
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('client', 'owner')),
  full_name text,
  phone text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles: read own" on profiles
  for select using (auth.uid() = id);

create policy "profiles: owners read all" on profiles
  for select using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'owner')
  );

create policy "profiles: update own" on profiles
  for update using (auth.uid() = id);

create policy "profiles: insert own" on profiles
  for insert with check (auth.uid() = id);

-- ─────────────────────────────────────────────
-- pricing_config (single row, owner-managed)
-- ─────────────────────────────────────────────
create table if not exists pricing_config (
  id int primary key default 1,
  -- window cleaning
  small_window_price numeric not null default 8,
  medium_window_price numeric not null default 12,
  large_window_price numeric not null default 18,
  interior_multiplier numeric not null default 1.6,
  tier_plus_tracks_fee numeric not null default 20,
  tier_premium_fee numeric not null default 45,
  screens_fee numeric not null default 25,
  -- gutter cleaning
  gutter_price_per_linear_foot numeric not null default 1.5,
  gutter_debris_light_multiplier numeric not null default 1,
  gutter_debris_moderate_multiplier numeric not null default 1.3,
  gutter_debris_heavy_multiplier numeric not null default 1.6,
  -- house washing
  house_wash_price_per_sqft numeric not null default 0.2,
  house_wash_dirtiness_light_multiplier numeric not null default 1,
  house_wash_dirtiness_moderate_multiplier numeric not null default 1.25,
  house_wash_dirtiness_heavy_multiplier numeric not null default 1.5,
  -- shared, job-level
  story_surcharge_per_level numeric not null default 15,
  minimum_job_price numeric not null default 89,
  updated_at timestamptz not null default now(),
  constraint single_row check (id = 1)
);

insert into pricing_config (id) values (1) on conflict (id) do nothing;

alter table pricing_config enable row level security;

create policy "pricing_config: owners read/write" on pricing_config
  for all using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'owner')
  ) with check (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'owner')
  );

-- ─────────────────────────────────────────────
-- quotes
-- ─────────────────────────────────────────────
create table if not exists quotes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references profiles (id) on delete cascade,
  status text not null default 'pending_analysis'
    check (status in ('pending_analysis', 'quoted', 'confirmed', 'declined')),
  property_type text not null check (property_type in ('residential', 'commercial')),
  address text,
  stories int not null default 1,
  services text[] not null check (array_length(services, 1) > 0),
  -- window-cleaning-only fields; only meaningful when 'window_cleaning' is in services
  cleaning_type text check (cleaning_type in ('exterior', 'interior_exterior')),
  service_tier text check (service_tier in ('basic', 'plus_tracks', 'premium')),
  add_screens boolean not null default false,
  ai_analysis jsonb,
  estimated_low numeric,
  estimated_high numeric,
  service_breakdown jsonb,
  final_price numeric,
  owner_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table quotes enable row level security;

create policy "quotes: clients read own" on quotes
  for select using (auth.uid() = client_id);

create policy "quotes: clients insert own" on quotes
  for insert with check (auth.uid() = client_id);

create policy "quotes: owners read all" on quotes
  for select using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'owner')
  );

create policy "quotes: owners update all" on quotes
  for update using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'owner')
  );

-- ─────────────────────────────────────────────
-- quote_photos
-- ─────────────────────────────────────────────
create table if not exists quote_photos (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references quotes (id) on delete cascade,
  storage_path text not null,
  created_at timestamptz not null default now()
);

alter table quote_photos enable row level security;

create policy "quote_photos: clients manage own" on quote_photos
  for all using (
    exists (select 1 from quotes q where q.id = quote_id and q.client_id = auth.uid())
  ) with check (
    exists (select 1 from quotes q where q.id = quote_id and q.client_id = auth.uid())
  );

create policy "quote_photos: owners read all" on quote_photos
  for select using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'owner')
  );

-- ─────────────────────────────────────────────
-- storage bucket (create via Supabase dashboard or the snippet below)
-- ─────────────────────────────────────────────
-- insert into storage.buckets (id, name, public) values ('quote-photos', 'quote-photos', false)
--   on conflict (id) do nothing;
