-- ─────────────────────────────────────────────────────────────────────
-- Clerk Auth Migration
--
-- Migrates authentication from Supabase Auth (email OTP) to Clerk.
-- Key changes:
--   • users.id, ratings.user_id, reports.reported_by: uuid → text
--   • FK from users.id → auth.users dropped (Clerk IDs are not in auth.users)
--   • All RLS policies rewritten from auth.uid() to (select auth.jwt() ->> 'sub')
--   • on_auth_user_created trigger dropped (replaced by client-side provisioning)
--   • is_admin() / is_banned() helpers updated to use JWT sub claim
--   • admin_ban_user() param changed from uuid to text
--   • New users INSERT policy for self-provisioning
--
-- ⚠ DESTRUCTIVE: This truncates users, ratings, and reports. Only safe because
--   the app hasn't launched to real users yet (test data only).
-- ─────────────────────────────────────────────────────────────────────

-- ======================================================================
-- 1. Drop dependent views
-- ======================================================================
DROP VIEW IF EXISTS public.item_stats;

-- ======================================================================
-- 2. Drop the auth trigger & function (Clerk users don't go into auth.users)
-- ======================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- ======================================================================
-- 3. Drop rate-limiting trigger (references user_id, will be recreated)
-- ======================================================================
DROP TRIGGER IF EXISTS check_rating_rate_limit_trigger ON public.ratings;

-- ======================================================================
-- 4. Drop helper functions (will be recreated with JWT pattern)
-- ======================================================================
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_banned() CASCADE;
DROP FUNCTION IF EXISTS public.admin_ban_user(uuid) CASCADE;

-- ======================================================================
-- 5. Drop ALL existing RLS policies
-- ======================================================================
-- items
DROP POLICY IF EXISTS "Items are readable by everyone" ON public.items;
DROP POLICY IF EXISTS "Admins can insert items" ON public.items;
DROP POLICY IF EXISTS "Admins can update items" ON public.items;
DROP POLICY IF EXISTS "Admins can delete items" ON public.items;

-- ratings
DROP POLICY IF EXISTS "Ratings are readable by everyone" ON public.ratings;
DROP POLICY IF EXISTS "Non-banned users can insert own ratings" ON public.ratings;
DROP POLICY IF EXISTS "Non-banned users can update own ratings" ON public.ratings;
DROP POLICY IF EXISTS "Owners or admins can delete ratings" ON public.ratings;

-- reports
DROP POLICY IF EXISTS "Admins can read reports" ON public.reports;
DROP POLICY IF EXISTS "Authenticated users can report as themselves" ON public.reports;
DROP POLICY IF EXISTS "Admins can resolve reports" ON public.reports;
DROP POLICY IF EXISTS "Admins can delete reports" ON public.reports;

-- users
DROP POLICY IF EXISTS "Users can read own profile, admins can read all" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- ======================================================================
-- 6. Truncate all user-related tables (no production data)
-- ======================================================================
TRUNCATE public.reports, public.ratings, public.users CASCADE;

-- ======================================================================
-- 7. Alter column types: uuid → text
-- ======================================================================

-- 7a. users.id
-- Drop PK (CASCADE drops FK references from ratings and reports)
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_pkey CASCADE;
-- Drop FK to auth.users (Clerk users don't live in auth.users)
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;
ALTER TABLE public.users ALTER COLUMN id TYPE text USING id::text;
ALTER TABLE public.users ADD PRIMARY KEY (id);

-- 7b. ratings.user_id
ALTER TABLE public.ratings ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE public.ratings ADD CONSTRAINT ratings_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 7c. reports.reported_by
ALTER TABLE public.reports ALTER COLUMN reported_by TYPE text USING reported_by::text;
ALTER TABLE public.reports ADD CONSTRAINT reports_reported_by_fkey
  FOREIGN KEY (reported_by) REFERENCES public.users(id) ON DELETE CASCADE;

-- 7d. Recreate unique constraint on ratings (user_id, item_id)
-- The original was created in init.sql; DROP CASCADE may have removed it
ALTER TABLE public.ratings DROP CONSTRAINT IF EXISTS ratings_user_id_item_id_key;
ALTER TABLE public.ratings ADD CONSTRAINT ratings_user_id_item_id_key UNIQUE (user_id, item_id);

-- ======================================================================
-- 8. Recreate item_stats view (unchanged content, needed after column type changes)
-- ======================================================================
CREATE VIEW public.item_stats AS
SELECT
  i.id,
  i.name,
  i.price,
  i.category,
  i.photo_url,
  i.is_active,
  i.is_veg,
  coalesce(r.rating_count, 0)::int        AS rating_count,
  coalesce(r.avg_stars, 0)::numeric(3,1)   AS avg_stars,
  coalesce(r.worth_it_count, 0)::int       AS worth_it_count,
  CASE WHEN coalesce(r.rating_count, 0) > 0
       THEN round(coalesce(r.worth_it_count, 0)::numeric / r.rating_count * 100, 0)
       ELSE 0
  END::int                                 AS worth_it_pct,
  coalesce(r.hygiene_flag_count, 0)::int   AS hygiene_flag_count
FROM public.items i
LEFT JOIN (
  SELECT
    item_id,
    count(*)                              AS rating_count,
    avg(stars)                            AS avg_stars,
    count(*) FILTER (WHERE worth_it)      AS worth_it_count,
    count(*) FILTER (WHERE hygiene_flag)  AS hygiene_flag_count
  FROM public.ratings
  GROUP BY item_id
) r ON r.item_id = i.id
WHERE i.is_active = true;

GRANT SELECT ON public.item_stats TO anon, authenticated;

-- ======================================================================
-- 9. Recreate helper functions with JWT pattern
--    Uses (select auth.jwt() ->> 'sub') in a subselect for per-statement eval
-- ======================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = (select auth.jwt() ->> 'sub')
      AND is_admin = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_banned()
RETURNS boolean
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = (select auth.jwt() ->> 'sub')
      AND is_banned = true
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_banned() TO authenticated;

-- ======================================================================
-- 10. Recreate admin_ban_user RPC (param type now text)
-- ======================================================================
CREATE OR REPLACE FUNCTION public.admin_ban_user(target_user_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: admin privilege required'
      USING ERRCODE = '42501';
  END IF;

  UPDATE public.users
  SET is_banned = true
  WHERE id = target_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_ban_user(text) TO authenticated;

-- ======================================================================
-- 11. Recreate rate-limiting trigger (unchanged logic, just needs recreation)
-- ======================================================================
CREATE OR REPLACE FUNCTION public.check_rating_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  recent_count int;
BEGIN
  SELECT count(*) INTO recent_count
  FROM public.ratings
  WHERE user_id = new.user_id
    AND created_at > (now() - interval '1 minute');

  IF recent_count >= 5 THEN
    RAISE EXCEPTION 'Rate limit exceeded: maximum 5 ratings per minute allowed'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN new;
END;
$$;

CREATE TRIGGER check_rating_rate_limit_trigger
  BEFORE INSERT ON public.ratings
  FOR EACH ROW EXECUTE FUNCTION public.check_rating_rate_limit();

-- ======================================================================
-- 12. Recreate ALL RLS policies with auth.jwt() ->> 'sub'
-- ======================================================================

-- ── items ─────────────────────────────────────────────────
-- Public read (anon + authenticated)
CREATE POLICY "Anyone can read active items"
  ON public.items FOR SELECT
  USING (is_active = true);

-- Admin writes
CREATE POLICY "Admins can insert items"
  ON public.items FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update items"
  ON public.items FOR UPDATE TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can delete items"
  ON public.items FOR DELETE TO authenticated
  USING (public.is_admin());

-- ── ratings ───────────────────────────────────────────────
-- Public read
CREATE POLICY "Anyone can read ratings"
  ON public.ratings FOR SELECT
  USING (true);

-- Insert: own row only, not banned
CREATE POLICY "Authenticated non-banned users can insert their own rating"
  ON public.ratings FOR INSERT TO authenticated
  WITH CHECK (
    (select auth.jwt() ->> 'sub') = user_id
    AND NOT public.is_banned()
  );

-- Update: own row only, not banned
CREATE POLICY "Users can update their own rating"
  ON public.ratings FOR UPDATE TO authenticated
  USING (
    (select auth.jwt() ->> 'sub') = user_id
    AND NOT public.is_banned()
  )
  WITH CHECK (
    (select auth.jwt() ->> 'sub') = user_id
  );

-- Delete: own row or admin
CREATE POLICY "Owner or admin can delete a rating"
  ON public.ratings FOR DELETE TO authenticated
  USING (
    (select auth.jwt() ->> 'sub') = user_id
    OR public.is_admin()
  );

-- ── reports ───────────────────────────────────────────────
-- Select: admin only
CREATE POLICY "Only admins can view reports"
  ON public.reports FOR SELECT TO authenticated
  USING (public.is_admin());

-- Insert: own report, not banned
CREATE POLICY "Authenticated non-banned users can insert reports"
  ON public.reports FOR INSERT TO authenticated
  WITH CHECK (
    (select auth.jwt() ->> 'sub') = reported_by
    AND NOT public.is_banned()
  );

-- Update: admin only (resolve/dismiss)
CREATE POLICY "Only admins can update reports"
  ON public.reports FOR UPDATE TO authenticated
  USING (public.is_admin());

-- Delete: admin only
CREATE POLICY "Admins can delete reports"
  ON public.reports FOR DELETE TO authenticated
  USING (public.is_admin());

-- ── users ─────────────────────────────────────────────────
-- Select: own row or admin
CREATE POLICY "Users can read own row, admins can read all"
  ON public.users FOR SELECT TO authenticated
  USING (
    (select auth.jwt() ->> 'sub') = id
    OR public.is_admin()
  );

-- Insert: self-provisioning (Phase 4 — client creates profile on first sign-in)
CREATE POLICY "Users can create their own profile"
  ON public.users FOR INSERT TO authenticated
  WITH CHECK (
    (select auth.jwt() ->> 'sub') = id
  );

-- Update: own row only
CREATE POLICY "Users can update their own row"
  ON public.users FOR UPDATE TO authenticated
  USING (
    (select auth.jwt() ->> 'sub') = id
  )
  WITH CHECK (
    (select auth.jwt() ->> 'sub') = id
  );

-- ======================================================================
-- 13. Column-level grants on users
-- ======================================================================
REVOKE UPDATE ON TABLE public.users FROM authenticated, anon;
GRANT UPDATE (room_number) ON TABLE public.users TO authenticated;
GRANT INSERT ON TABLE public.users TO authenticated;
