# Implementation Plan

## Product: WorthIt

Phased build plan for a solo developer working with an AI coding agent (Claude Code or similar). Each phase lists concrete deliverables so progress is checkable.

---

## Phase 0: Setup

**Goal:** working scaffold, deployable from day one.

- Initialize Vite + React + TypeScript project
- Install and configure Tailwind CSS
- Set up `vite-plugin-pwa` (manifest, icons, service worker config)
- Create Supabase project; obtain project URL + anon key
- Set up `.env` for Supabase credentials (never committed)
- Install `@supabase/supabase-js`, TanStack Query, React Router, React Hook Form, Tabler Icons
- Push initial repo to GitHub
- Connect repo to Vercel, confirm a blank deploy works end-to-end (HTTPS live URL)

**Deliverables:** empty app live on a Vercel URL, installable as a PWA, connected to a Supabase project.

---

## Phase 1: Database

**Goal:** schema in place before building UI against it.

- Write SQL migrations for `users`, `items`, `ratings`, `reports` tables per `5-Backend-Schema.md`
- Add all indexes and unique constraints
- Enable RLS on all tables and write the policies specified in the schema doc
- Create the `on_auth_user_created` trigger to auto-populate `public.users`
- Manually set your own account's `is_admin = true` after first signup
- Seed ~10 sample menu items in `items` for local development/testing

**Deliverables:** fully migrated Supabase database with RLS verified (test that an anonymous client can read `items`/`ratings` but not write; test that a user can't edit another user's rating).

---

## Phase 2: Authentication

**Goal:** working email OTP login end-to-end.

- Build Login screen (Step 1: email entry, Step 2: OTP entry) per `3-App-Flow.md`
- Wire up `supabase.auth.signInWithOtp()` and OTP verification
- Implement session check on app load, persist across refreshes
- Implement "resend code" cooldown behavior
- Implement redirect-after-login (return to the screen that triggered the login)
- Build basic Profile screen shell with "Log out" functionality

**Deliverables:** a user can sign up/log in with any email via OTP, stay logged in across sessions, and log out.

---

## Phase 3: Core UI

**Goal:** browsable app shell, no auth required to view.

- Build global layout: bottom navigation (Home, Search, Profile), header, dark theme applied per `4-UIUX-Brief.md`
- Build Home screen: item list, filter chips, loading/empty/error states
- Build Item Detail screen: rating summary, review list, loading/empty/error states
- Wire both screens to real Supabase data via TanStack Query
- Implement client-side routing between all screens

**Deliverables:** a logged-out user can browse the full menu and view item details with real data, matching the states specified in `3-App-Flow.md`.

---

## Phase 4: Main Features

**Goal:** the core value-generating loop — rating submission.

- Build Rate & Review screen (star selector, worth-it toggle, optional text, hygiene checkbox)
- Implement submit logic: insert or update (if a rating already exists for that user+item) via the unique constraint
- Implement all specified error/loading/success states for this screen
- Wire "Rate this item" CTA on Item Detail to check auth state and redirect to Login if needed
- Build My Reviews list on Profile screen
- Implement sort/filter logic on Home (top rated, under ₹50, worth it)
- Implement Search screen (client-side filter against loaded menu data)

**Deliverables:** a logged-in user can rate/edit ratings on any item, see their own review history, and filter/search the menu — the full MVP loop works end-to-end.

---

## Phase 5: Trust & Moderation

**Goal:** basic abuse handling before public launch.

- Build Report/flag modal, wire to `reports` table insert
- Build basic Admin moderation view (pending reports list, dismiss/remove/ban actions), gated by `is_admin` check
- Implement ban enforcement (banned users blocked from insert/update via RLS, confirmed with a test account)
- Add basic rate-limiting on rating submissions (e.g. a Postgres check or trigger blocking >5 submissions per minute per user)

**Deliverables:** you can review and act on flagged content; banned accounts are actually blocked; obvious spam patterns are throttled.

---

## Phase 6: Nice-to-have Integrations

**Goal:** the differentiating features from the PRD's "nice-to-have" list, only after MVP loop is proven.

- Student photo upload on rating submission (Supabase Storage, with basic file-type/size validation)
- "Today's specials" flag on `items` (simple boolean + UI badge)
- Compare two items side by side (basic screen, reuses Item Detail data)

**Deliverables:** optional — only build these if Phase 4's core loop shows real usage first. Don't front-load this phase before validating the MVP.

---

## Phase 7: Testing

**Goal:** confidence before real users touch it.

- Manual QA pass through every screen/state in `3-App-Flow.md` (success, error, empty, loading — for each)
- Test on at least 2 real Android phones (dominant device type for this audience) — check touch targets, PWA install flow, offline menu browsing
- Test RLS policies directly (attempt unauthorized writes via the Supabase client as a non-owner/non-admin user, confirm they're rejected)
- Test edge cases: rating an item twice (should update, not duplicate), submitting with no internet, OTP expiry, banned user attempting to submit

**Deliverables:** a written checklist of tested scenarios, all passing, before inviting real hostel users.

---

## Phase 8: Deployment & Launch

**Goal:** live, installable, in front of real users.

- Final production deploy to Vercel
- Confirm PWA installability (Add to Home Screen) on both Android and iOS Safari
- Seed the real tuck shop menu (~30–40 actual items, with real prices)
- Seed initial ratings yourself + a few friends (solves cold-start problem — an empty app has no value to a new visitor)
- Generate a QR code / shareable link, post it at the tuck shshop counter and in the hostel WhatsApp group

**Deliverables:** live app, real menu, seeded ratings, distributed to your hostel.

---

## Phase 9: Final Polish

**Goal:** cleanup based on real early usage.

- Fix any UX friction observed in first week of real usage (this is more valuable than pre-building more features)
- Tighten copy/microcopy based on actual confusion points
- Address any performance issues (slow loads, layout shifts) noticed on real devices
- Decide, based on real retention data, whether to proceed to Phase 6 features, girls' hostel expansion, or gamification — not before

**Deliverables:** a stable, real-world-tested v1, plus a clear, evidence-based decision on what (if anything) to build next.
