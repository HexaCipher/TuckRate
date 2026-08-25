# Technical Requirements Document (TRD)

## Product: TuckRate (hostel tuck shop rating PWA)

This TRD is written for a **solo hobby-project build**, intended to be executed with an AI coding agent (Claude Code or similar). Stack choices prioritize: low setup overhead, minimal backend code to write/maintain, strong defaults for auth and security, and PWA installability.

---

## 1. Frontend Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | React + Vite (TypeScript) | Fast dev server, minimal config, agent-friendly (small, well-known patterns) |
| Styling | Tailwind CSS | Matches the dark-theme + utility-first workflow already scoped in the UI/UX brief; fast for an AI agent to generate consistent styles |
| Routing | React Router v6 | Standard, simple client-side routing for a handful of screens |
| Data fetching/cache | TanStack Query (React Query) | Handles loading/error/empty states cleanly, caches menu + rating data, avoids manual fetch boilerplate |
| PWA tooling | `vite-plugin-pwa` | Generates manifest + service worker, enables "Add to Home Screen," offline shell caching |
| Forms | React Hook Form | Lightweight form state for the rating/review submission flow |
| Icons | Tabler Icons (React) | Free, consistent outline icon set matching the UI/UX brief |

**Why not Next.js:** No SSR/SEO requirement here (it's a private, install-based PWA for a closed hostel audience) — Vite is simpler to configure for a pure client-side PWA and faster to iterate on for a hobby project.

---

## 2. Backend Stack

**Choice: Supabase** (Postgres + Auth + Storage + auto-generated APIs, all managed/hosted)

| Need | Supabase component |
|---|---|
| Database | Managed Postgres |
| Authentication | Supabase Auth — email OTP / magic link, built-in, passwordless |
| File storage | Supabase Storage (for student-uploaded food photos) |
| API layer | Auto-generated REST (PostgREST) + realtime subscriptions, accessed via `@supabase/supabase-js` client SDK |
| Authorization | Postgres Row Level Security (RLS) policies |

**Why Supabase over a custom Node/Express backend:**
- No custom backend server to write, host, or maintain — critical for a hobby project with limited time.
- Built-in passwordless email OTP auth matches the exact auth requirement from the PRD (any email, no password, low friction).
- Row Level Security lets you enforce "users can only edit their own rating" directly in the database, rather than writing custom authorization middleware.
- Free tier is more than sufficient for hostel-scale usage (a few hundred users).
- Very agent-friendly: Claude Code can scaffold Supabase schema + client calls quickly since it's a well-documented, widely-used pattern.

**If you outgrow Supabase later** (multi-vendor, owner dashboards, heavier custom logic), Supabase Edge Functions (Deno-based serverless functions) can be added incrementally without a full backend rewrite.

---

## 3. Database

- **Engine:** PostgreSQL (via Supabase)
- See `5-Backend-Schema.md` for full table definitions, relationships, and indexes.
- Migrations managed via Supabase CLI (`supabase migration new`, version-controlled SQL files in the repo).

---

## 4. Authentication

- **Method:** Email OTP / magic link via Supabase Auth — no passwords stored or managed.
- **Flow:** User enters any email → receives a 6-digit OTP or magic link → verified → session issued (JWT, handled automatically by Supabase client SDK).
- **Identity fields collected at signup:** email (required), room number (optional, self-declared, unverified — social/trust signal only, not used for access control).
- **No college-domain restriction** — any email is accepted, per product decision (see PRD).
- **Session handling:** Supabase client SDK manages JWT storage and refresh automatically (uses secure local storage under the hood); no custom session logic needed.

---

## 5. APIs

- No custom REST API needs to be hand-built for MVP — Supabase's auto-generated PostgREST API (via the JS client SDK) covers all CRUD operations (`select`, `insert`, `update`, `delete` on `items`, `ratings`, `reports` tables), scoped by RLS policies.
- If custom server-side logic is needed later (e.g. aggregating trending items, sending admin notifications), use **Supabase Edge Functions** rather than standing up a separate backend service.

---

## 6. Architecture

```
┌─────────────────────────┐
│   React + Vite PWA      │  (installed on student phones)
│  - Home / browse         │
│  - Item detail            │
│  - Rate/review form       │
│  - Auth (OTP)              │
└───────────┬──────────────┘
            │  supabase-js client SDK (HTTPS)
            ▼
┌─────────────────────────┐
│        Supabase          │
│  - Auth (email OTP)       │
│  - Postgres DB + RLS      │
│  - Storage (food photos)  │
│  - Auto REST API          │
└─────────────────────────┘
```

- **No custom backend server** in the MVP architecture — the frontend talks directly to Supabase, secured by RLS policies (not by trusting the client).
- Service worker (from `vite-plugin-pwa`) caches the app shell for fast repeat loads and basic offline support (menu browsing works offline if previously loaded; submitting ratings requires connectivity).

---

## 7. Deployment Plan

| Component | Where | Notes |
|---|---|---|
| Frontend (PWA) | Vercel (free tier) | Auto-deploy from GitHub main branch; HTTPS by default (required for PWA installability) |
| Backend | Supabase Cloud (free tier) | Hosted Postgres + Auth + Storage; no server to manage |
| Domain | Vercel-provided subdomain initially; custom domain optional later | Not required for MVP — a shared link/QR code is enough for a single-hostel audience |
| Environment config | `.env` for Supabase URL + anon key, never commit secrets to git | Standard practice |

**Distribution to users:** No app store needed. Share the link via hostel WhatsApp group / QR code at the tuck shop counter → "Add to Home Screen" prompt on mobile.

---

## 8. Security Requirements

- **Row Level Security (RLS) enabled on all tables** — never rely on frontend logic alone to restrict access.
  - Users can `insert`/`update` only their own rows in `ratings` (matched on `auth.uid()`).
  - Everyone (including anonymous/unauthenticated) can `select` from `items` and `ratings` (public read).
  - Only admin role can `update`/`delete` rows in `reports`, or moderate/remove ratings.
- **Rate limiting:** basic submission rate-limiting (e.g. via a Postgres trigger or Edge Function check) to block rapid repeat submissions from one account.
- **Input validation:** sanitize/limit review text length client- and server-side; validate star rating is 1–5; validate uploaded images are actual image types and under a size limit (handled via Supabase Storage policies).
- **No sensitive data stored:** no passwords, no payment info, minimal PII (just email + optional room number).
- **Unique constraint** on `(user_id, item_id)` in `ratings` — enforced at the database level, not just app logic, to guarantee "one rating per item per account" even under race conditions.

---

## 9. Technical Decisions Summary (with reasoning)

| Decision | Reason |
|---|---|
| Vite + React over Next.js | Simpler PWA setup, no SSR needed for a closed-audience install app |
| Supabase over custom Node backend | Eliminates backend hosting/maintenance; built-in OTP auth matches exact product requirement; RLS gives real security without custom middleware |
| Postgres (via Supabase) | Relational data (users ↔ ratings ↔ items) fits relational model naturally; strong constraint support (unique keys, foreign keys) |
| Email OTP over college-email-restricted signup | Matches product decision to not exclude students without institutional email |
| PWA over native app | No app store friction, installable directly, appropriate scope/effort for a hobby project |
| TanStack Query for data fetching | Clean handling of loading/error/empty states, which the App Flow doc requires to be explicit for every screen |
| No custom backend server at MVP | Minimizes what a solo developer (with an AI coding agent) has to build and maintain; add Edge Functions only when a real need arises |
