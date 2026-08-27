# AGENTS.md — TuckRate

## Project summary
TuckRate is a mobile-first PWA that lets hostel students rate and review individual tuck shop food items, so others can decide fast whether an item is worth buying. This is a **hobby project**, deliberately scoped small: one tuck shop, one boys' hostel, for v1. Validation and real usage matter more than feature completeness — do not build ahead of what's actually needed.

## Source of truth
Full specs live in `/docs`. Read the relevant doc before building in that area — don't guess at screen behavior, colors, or schema when it's already specified.

- `docs/1-PRD.md` — product scope, features, MVP boundaries, what to avoid
- `docs/2-TRD.md` — tech stack and architecture decisions, with reasoning
- `docs/3-App-Flow.md` — every screen, user action, navigation path, and state (success/error/empty/loading)
- `docs/4-UIUX-Brief.md` — design system: colors, typography, layout, component style
- `docs/5-Backend-Schema.md` — database tables, columns, relationships, indexes, RLS policies
- `docs/6-Implementation-Plan.md` — the phased build plan (see `PROGRESS.md` for live status)

## Stack (do not deviate without the user explicitly approving a change)
- Frontend: React + Vite + TypeScript + Tailwind CSS
- PWA: `vite-plugin-pwa`
- Routing: React Router v6
- Data fetching/cache: TanStack Query
- Forms: React Hook Form
- Icons: Tabler Icons
- Backend: Supabase — Postgres + Auth (email OTP) + Storage. No custom backend server.
- Deployment: Vercel (frontend) + Supabase Cloud (backend)

## Absolute rules
1. **MVP scope only.** Nothing outside `docs/1-PRD.md`'s "Must-have (MVP)" list unless the user explicitly asks for it in that session. Good ideas that come up mid-build go in `PROGRESS.md` under "Ideas not in scope" — not into the code.
2. **Row Level Security stays enabled on every table, always.** Never rely on frontend logic alone for access control. Match the policies in `docs/5-Backend-Schema.md` exactly.
3. **One rating per `(user_id, item_id)`** — enforced by a database unique constraint, not just app-level logic.
4. **Mobile-first only.** Target viewport 360–430px. No desktop-specific layout work for any v1 screen.
5. **Dark theme is the only theme for v1.** Use the exact palette and component styles in `docs/4-UIUX-Brief.md` — don't invent new colors or styles.
6. **Any-email + OTP auth only.** No college-email domain restriction, no password-based auth.
7. **Every screen must implement all four states** defined for it in `docs/3-App-Flow.md`: success, loading, empty, error. A screen isn't done until all four exist and have been checked.
8. **One phase at a time**, per `docs/6-Implementation-Plan.md`. Don't jump ahead to a later phase or silently merge two phases in one session.
9. **Don't mark a phase "Complete" in `PROGRESS.md`** until it's actually been tested against the relevant states in `docs/3-App-Flow.md` — not just "looks right."
10. **No unrelated refactors while working a phase.** Notice something else worth fixing? Log it in `PROGRESS.md` under "Ideas not in scope." Don't touch it in the current session.

## Session workflow
At the start of every session:
1. Read this file in full.
2. Read `PROGRESS.md` to see what's done and which phase is next.
3. If anything about the next phase is ambiguous given the docs, ask before writing code rather than guessing.
4. At the end of the session, update `PROGRESS.md`: set the phase status, note what was actually built, and record any decisions or deviations from the docs (and why).

## What NOT to build in v1
- Girls' hostel or any multi-vendor support
- Gamification, badges, leaderboards, points
- Recommendation engine
- Owner-facing dashboard
- Pre-ordering or payments
- Push notifications
- Native app — PWA only

TuckRate: a PWA for rating hostel tuck-shop food. Vite + React 19 + TypeScript SPA backed by Supabase, deployed to Vercel.

## Commands

- `npm run dev` — dev server
- `npm run build` — `tsc -b && vite build`; this is the only typecheck (no separate typecheck script). Run it to verify types.
- `npm run lint` — **oxlint** (config in `.oxlintrc.json`), not ESLint/Prettier
- No test framework is configured; there is no test command.

## Environment

- Requires `.env` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (see `.env.example`). Without it the app still boots but logs a console warning and data features fail — check for `[TuckRate] Missing Supabase environment variables` when debugging.

## Architecture

- Entry: `src/main.tsx` → `src/App.tsx` (all routes defined inline there).
- Backend is entirely Supabase (auth via email OTP, Postgres with RLS, REST). Client singleton in `src/lib/supabase.ts`; use `isSupabaseConfigured` before data calls.
- DB schema types in `src/types/database.ts` are maintained by hand to mirror `docs/5-Backend-Schema.md` — update them whenever the schema changes.
- Schema lives in `supabase/migrations/*.sql` (timestamped, run once each, tracked in the DB migration history). The Supabase GitHub integration's "Deploy to production" applies **pending migrations** on push to the connected branch — a push can mutate the live DB. Only `supabase/migrations/` is applied; there is no `supabase/schemas/` declarative layer. `supabase/seed.sql` is NOT applied by the pipeline; run it once via the Supabase SQL editor. `supabase/config.toml`'s `project_id` is a local-only identifier, not the remote project ref.
- Tailwind CSS v4 uses CSS-first config: theme tokens/colors live in `src/index.css` under `@theme`. There is no `tailwind.config.js`.
- PWA via `vite-plugin-pwa` (`vite.config.ts`): autoUpdate service worker caches built assets and runtime-caches Supabase REST responses (1h NetworkFirst) for offline menu browsing.

## Docs

`docs/*.md` (PRD, technical requirements, app flow, UI/UX brief, backend schema, implementation plan) are already loaded into OpenCode sessions as instructions via `opencode.json`. Consult them rather than re-deriving product decisions.
