-- Cleanup of objects left over from a previous, unrelated app that used this
-- Supabase project (a student/department app — see migration history versions
-- 20260316*). Its tables were already gone, but these functions remained and
-- were still exposed as PostgREST RPC endpoints to the anon role.
--
-- Applied 2026-08-27 via MCP as version 20260827135721.

drop function if exists public.get_email_by_student_id(text);
drop function if exists public.get_current_student_id();
drop function if exists public.get_student_stats(uuid);
drop function if exists public.get_department_stats();
drop function if exists public.update_updated_at_column();

-- Our own oversight: set_updated_at was missing a fixed search_path
-- (Supabase security advisor: function_search_path_mutable).
alter function public.set_updated_at() set search_path = '';
