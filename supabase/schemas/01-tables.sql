-- TuckRate tables — per docs/5-Backend-Schema.md §1
-- Applied automatically by the Supabase Git integration (declarative schemas).

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
