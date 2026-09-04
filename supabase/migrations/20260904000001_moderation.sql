-- ─────────────────────────────────────────────────────────────────────
-- Phase 5 Migration: Trust & Moderation
-- 1. Rate-limiting trigger on rating submissions (max 5 per minute)
-- 2. Security definer admin function to ban users
-- 3. Delete policy for admins on reports
-- ─────────────────────────────────────────────────────────────────────

-- 1. Rating rate-limiting trigger (docs/6-Implementation-Plan.md Phase 5)
create or replace function public.check_rating_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  recent_count int;
begin
  select count(*) into recent_count
  from public.ratings
  where user_id = new.user_id
    and created_at > (now() - interval '1 minute');

  if recent_count >= 5 then
    raise exception 'Rate limit exceeded: maximum 5 ratings per minute allowed'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists check_rating_rate_limit_trigger on public.ratings;
create trigger check_rating_rate_limit_trigger
  before insert on public.ratings
  for each row execute function public.check_rating_rate_limit();

-- 2. Admin ban user RPC (bypasses column-level lockout safely for verified admins)
create or replace function public.admin_ban_user(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Unauthorized: admin privilege required'
      using errcode = '42501';
  end if;

  update public.users
  set is_banned = true
  where id = target_user_id;
end;
$$;

grant execute on function public.admin_ban_user(uuid) to authenticated;

-- 3. Delete policy for admins on reports (allows report cleanup)
drop policy if exists "Admins can delete reports" on public.reports;
create policy "Admins can delete reports"
  on public.reports for delete
  using (public.is_admin());
