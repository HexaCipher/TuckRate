-- TuckRate Row Level Security policies — per docs/5-Backend-Schema.md §5
-- RLS stays enabled on every table. Access control lives here, never in frontend logic.

alter table public.users enable row level security;
alter table public.items enable row level security;
alter table public.ratings enable row level security;
alter table public.reports enable row level security;

-- Helper: is the current user an admin? (select-wrapped so it's evaluated once per statement)
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

-- ─── items: public read; admin-only writes ─────────────────────────────

create policy "Items are readable by everyone"
  on public.items for select
  using (true);

create policy "Admins can insert items"
  on public.items for insert
  with check (public.is_admin());

create policy "Admins can update items"
  on public.items for update
  using (public.is_admin());

create policy "Admins can delete items"
  on public.items for delete
  using (public.is_admin());

-- ─── ratings: public read; users write only their own, unless banned ───

create policy "Ratings are readable by everyone"
  on public.ratings for select
  using (true);

create policy "Non-banned users can insert own ratings"
  on public.ratings for insert to authenticated
  with check (
    user_id = auth.uid()
    and not public.is_banned()
  );

create policy "Non-banned users can update own ratings"
  on public.ratings for update to authenticated
  using (
    user_id = auth.uid()
    and not public.is_banned()
  )
  with check (user_id = auth.uid());

create policy "Owners or admins can delete ratings"
  on public.ratings for delete
  using (
    user_id = auth.uid()
    or public.is_admin()
  );

-- ─── reports: admin reads/resolves; users submit about themselves ──────

create policy "Admins can read reports"
  on public.reports for select
  using (public.is_admin());

create policy "Authenticated users can report as themselves"
  on public.reports for insert to authenticated
  with check (
    reported_by = auth.uid()
    and not public.is_banned()
  );

create policy "Admins can resolve reports"
  on public.reports for update
  using (public.is_admin());

-- ─── users: read/update own row; admin reads all ───────────────────────

create policy "Users can read own profile, admins can read all"
  on public.users for select
  using (
    id = auth.uid()
    or public.is_admin()
  );

create policy "Users can update own profile"
  on public.users for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Column-level lockout: regular users may only change room_number.
-- is_banned / is_admin changes happen via the dashboard (bypasses RLS/grants).
revoke update on table public.users from authenticated, anon;
grant update (room_number) on public.users to authenticated;
