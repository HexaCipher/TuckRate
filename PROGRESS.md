# PROGRESS

Live status per `docs/6-Implementation-Plan.md`. One phase at a time.

| Phase | Status |
|---|---|
| 0. Setup | ✅ Complete |
| 1. Database | ✅ Complete (verified in live DB) |
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

**Correction this session:** first attempt put SQL in `supabase/schemas/`, which the GitHub deploy pipeline ignores (that folder is a local-CLI-only declarative layer that must be diffed into migrations). Moved everything to `supabase/migrations/`. The pipeline then failed anyway with *"Remote migration versions not found in local migrations directory"* — the remote `supabase_migrations.schema_migrations` table held versions with no matching local files. Rather than repair migration history, we switched to applying SQL by hand in the SQL editor (see decisions).

**Verified in the live DB** via `select` against `pg_tables` / `pg_policies`: 4 tables, RLS enabled on all 4, 13 policies, 10 seeded items.

## Decisions / deviations from docs

- **Migration approach: manual.** TRD suggests Supabase CLI migrations, and we briefly tried the GitHub integration; both were dropped. Schema is applied by pasting SQL into the Supabase SQL editor. `supabase/migrations/20260827000000_init.sql` + `supabase/seed.sql` remain in the repo as the written record — they must be updated by hand alongside any editor change, or the repo drifts from the DB. Acceptable for a solo hobby project; revisit if a second developer joins.
- **Admin writes:** admins manage menu/reports via dashboard/service-role paths that bypass RLS; no separate admin client needed for MVP.
- **`supabase/config.toml`** is now vestigial (only the abandoned integration read it). Harmless; left in place.

## Remaining manual steps (do before Phase 2 auth testing)
1. Optional: disable the GitHub integration in Supabase (Project Settings → Integrations → GitHub) to stop the failing "Supabase Preview" check on every commit.
2. After first OTP signup: confirm a `public.users` row was auto-created by the `on_auth_user_created` trigger, then set that account's `is_admin = true` manually.
3. Verify RLS from the client with the anon key: read `items` ✅, write ❌.

## Ideas not in scope

- (none yet)
