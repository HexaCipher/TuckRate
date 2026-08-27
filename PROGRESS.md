# PROGRESS

Live status per `docs/6-Implementation-Plan.md`. One phase at a time.

| Phase | Status |
|---|---|
| 0. Setup | ✅ Complete |
| 1. Database | 🟡 Migration written; awaiting deploy verification (see notes) |
| 2. Authentication | ⬜ Next |
| 3. Core UI | ⬜ Not started |
| 4. Main Features | ⬜ Not started |
| 5. Trust & Moderation | ⬜ Not started |
| 6. Nice-to-have Integrations | ⬜ Deferred until core loop is validated |
| 7. Testing | ⬜ Not started |
| 8. Deployment & Launch | ⬜ Not started |
| 9. Final Polish | ⬜ Not started |

## What was actually built

### Phase 0 — Setup (pre-session)
- Vite + React 19 + TypeScript scaffold, Tailwind v4 (CSS-first theme in `src/index.css`), `vite-plugin-pwa` configured with manifest + Supabase REST runtime caching
- All deps installed: supabase-js, TanStack Query, React Router, React Hook Form, Tabler Icons, oxlint
- Route shells for all 7 screens in `src/App.tsx` (placeholders)
- Hand-written DB types in `src/types/database.ts`

### Phase 1 — Database (this session)
- All schema now lives in a single migration `supabase/migrations/20260827000000_init.sql` (tables, indexes, triggers, RLS policies) per docs/5:
  - `users`, `items`, `ratings`, `reports` with all check/unique constraints (incl. `unique(user_id, item_id)` and `unique(rating_id, reported_by)`)
  - indexes from docs/5 §3
  - `on_auth_user_created` → auto-populate `public.users`; `updated_at` maintenance triggers for items/ratings
  - RLS enabled everywhere + policies from docs/5 §5, `is_admin()` / `is_banned()` helpers; column-level lockout so users can only UPDATE their own `room_number`
- Added minimal `supabase/config.toml` (required for the GitHub integration to recognize the project).
- Created `supabase/seed.sql` — 10 idempotent sample items (**must be run manually** in the SQL editor — the Git integration does not apply seed files).

**Correction this session:** first attempt put SQL in `supabase/schemas/`, which the GitHub deploy pipeline ignores (that folder is a local-CLI-only declarative layer that must be diffed into migrations). Pipeline only applies `supabase/migrations/`. Removed `supabase/schemas/`; migrations are now the single source of truth.

## Decisions / deviations from docs

- **Migration approach:** we use the Supabase GitHub integration's "Deploy to production" — it applies pending files in `supabase/migrations/` on push to the connected branch. Consequence: pushes to `main` mutate the live DB directly. Schema changes = add a new timestamped migration file (never edit an already-applied one).
- **Admin writes:** admins manage menu/reports via dashboard/service-role paths that bypass RLS; no separate admin client needed for MVP.

## Required manual steps before calling Phase 1 verified
1. In Supabase Dashboard → Project Settings → Integrations → GitHub: confirm **Working directory = `.`** and **"Deploy to production" is enabled**.
2. Push → watch the deploy status (PR check / dashboard). Confirm tables appear under Database → Tables.
3. Run `supabase/seed.sql` once in the SQL editor.
4. Verify RLS with an anon key: read `items` ✅, write ❌.
5. Sign up a test user → confirm `public.users` row appears via trigger; then set own account `is_admin = true` manually.

## Ideas not in scope

- (none yet)
