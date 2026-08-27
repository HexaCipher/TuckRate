-- TuckRate initial schema — per docs/5-Backend-Schema.md
-- Applied automatically by the Supabase GitHub integration (Deploy to production)
-- on push to the connected branch. Runs once; tracked in the migration history table.
--
-- Seed data lives in supabase/seed.sql and is NOT applied by this pipeline —
-- run it manually in the Supabase SQL editor.

-- ─────────────────────────────────────────────────────────────────────
-- Tables (§1)
-- ─────────────────────────────────────────────────────────────────────

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  room_number text,
  is_banned boolean not null default false,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(6, 2) not null check (price >= 0),
  category text,
  photo_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  item_id uuid not null references public.items (id) on delete cascade,
  stars smallint not null check (stars between 1 and 5),
  worth_it boolean not null,
  review_text text check (char_length(review_text) <= 500),
  hygiene_flag boolean not null default false,
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint ratings_user_item_unique unique (user_id, item_id)
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  rating_id uuid not null references public.ratings (id) on delete cascade,
  reported_by uuid not null references public.users (id) on delete cascade,
  reason text not null check (reason in ('fake_spam', 'offensive', 'unrelated', 'other')),
  comment text,
  status text not null default 'pending' check (status in ('pending', 'dismissed', 'removed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,

  constraint reports_rating_reporter_unique unique (rating_id, reported_by)
);

-- ─────────────────────────────────────────────────────────────────────
-- Indexes (§3)
-- ─────────────────────────────────────────────────────────────────────

create index if not exists ratings_item_id_idx on public.ratings (item_id);
create index if not exists ratings_user_id_idx on public.ratings (user_id);
create index if not exists items_is_active_idx on public.items (is_active);
create index if not exists reports_status_idx on public.reports (status);

-- ─────────────────────────────────────────────────────────────────────
-- Triggers (§4)
-- ─────────────────────────────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists items_set_updated_at on public.items;
create trigger items_set_updated_at
  before update on public.items
  for each row execute function public.set_updated_at();

drop trigger if exists ratings_set_updated_at on public.ratings;
create trigger ratings_set_updated_at
  before update on public.ratings
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────
-- Row Level Security (§5)
-- ─────────────────────────────────────────────────────────────────────

alter table public.users enable row level security;
alter table public.items enable row level security;
alter table public.ratings enable row level security;
alter table public.reports enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and is_admin = true
  );
$$;

create or replace function public.is_banned()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and is_banned = true
  );
$$;

-- items: public read; admin-only writes
drop policy if exists "Items are readable by everyone" on public.items;
create policy "Items are readable by everyone"
  on public.items for select
  using (true);

drop policy if exists "Admins can insert items" on public.items;
create policy "Admins can insert items"
  on public.items for insert
  with check (public.is_admin());

drop policy if exists "Admins can update items" on public.items;
create policy "Admins can update items"
  on public.items for update
  using (public.is_admin());

drop policy if exists "Admins can delete items" on public.items;
create policy "Admins can delete items"
  on public.items for delete
  using (public.is_admin());

-- ratings: public read; users write only their own, unless banned
drop policy if exists "Ratings are readable by everyone" on public.ratings;
create policy "Ratings are readable by everyone"
  on public.ratings for select
  using (true);

drop policy if exists "Non-banned users can insert own ratings" on public.ratings;
create policy "Non-banned users can insert own ratings"
  on public.ratings for insert to authenticated
  with check (
    user_id = auth.uid()
    and not public.is_banned()
  );

drop policy if exists "Non-banned users can update own ratings" on public.ratings;
create policy "Non-banned users can update own ratings"
  on public.ratings for update to authenticated
  using (
    user_id = auth.uid()
    and not public.is_banned()
  )
  with check (user_id = auth.uid());

drop policy if exists "Owners or admins can delete ratings" on public.ratings;
create policy "Owners or admins can delete ratings"
  on public.ratings for delete
  using (
    user_id = auth.uid()
    or public.is_admin()
  );

-- reports: admin reads/resolves; users submit about themselves
drop policy if exists "Admins can read reports" on public.reports;
create policy "Admins can read reports"
  on public.reports for select
  using (public.is_admin());

drop policy if exists "Authenticated users can report as themselves" on public.reports;
create policy "Authenticated users can report as themselves"
  on public.reports for insert to authenticated
  with check (
    reported_by = auth.uid()
    and not public.is_banned()
  );

drop policy if exists "Admins can resolve reports" on public.reports;
create policy "Admins can resolve reports"
  on public.reports for update
  using (public.is_admin());

-- users: read/update own row; admin reads all
drop policy if exists "Users can read own profile, admins can read all" on public.users;
create policy "Users can read own profile, admins can read all"
  on public.users for select
  using (
    id = auth.uid()
    or public.is_admin()
  );

drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile"
  on public.users for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Column-level lockout: regular users may only change room_number.
-- is_banned / is_admin changes happen via the dashboard (bypasses RLS/grants).
revoke update on table public.users from authenticated, anon;
grant update (room_number) on public.users to authenticated;
