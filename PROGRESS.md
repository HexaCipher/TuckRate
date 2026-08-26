# PROGRESS

Live status per `docs/6-Implementation-Plan.md`. One phase at a time.

| Phase | Status |
|---|---|
| 0. Setup | ✅ Complete |
| 1. Database | ✅ Complete (schema written; see notes) |
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
- Created `supabase/schemas/` (declarative SQL applied by the Supabase GitHub integration on push):
  - `01-tables.sql` — `users`, `items`, `ratings`, `reports` with all check/unique constraints from docs/5 (incl. `unique(user_id, item_id)` and `unique(rating_id, reported_by)`)
  - `02-indexes.sql` — indexes from docs/5 §3
  - `03-triggers.sql` — `on_auth_user_created` → auto-populate `public.users`; `updated_at` maintenance triggers for items/ratings
  - `04-policies.sql` — RLS enabled everywhere + policies from docs/5 §5, plus `is_admin()` / `is_banned()` helper functions; column-level lockout so users can only UPDATE their own `room_number`
- Created `supabase/seed.sql` — 10 idempotent sample items (**must be run manually** via the Supabase SQL editor — the Git integration does not apply seed files)

## Decisions / deviations from docs

- **Migration approach:** TRD mentions "Supabase CLI migrations," but we use the Supabase GitHub integration with declarative schemas (`supabase/schemas/*.sql`) instead — user's repo is already connected to it. Consequence: pushes to the connected branch mutate the live DB directly.
- **Admin writes:** admins manage menu/reports via dashboard/service-role paths that bypass RLS; no separate admin client needed for MVP.

## Required manual steps before calling Phase 1 verified
1. Push this branch → confirm the integration applies the schema without errors.
2. Run `supabase/seed.sql` once in the SQL editor.
3. Verify RLS with an anon key: read `items` ✅, write ❌.
4. Sign up a test user → confirm `public.users` row appears via trigger; then set own account `is_admin = true` manually.

## Ideas not in scope

- (none yet)
