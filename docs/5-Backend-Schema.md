# Backend Schema

## Product: WorthIt
## Database: PostgreSQL (via Supabase)

---

## 1. Tables

### `users`
Clerk handles authentication and user identity. This `public.users` table stores app-specific profile data, keyed by the Clerk user ID (a text string like `user_2abc123...`). The row is created client-side on first sign-in via `useEnsureProfile`.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `text` | PK | Clerk user ID (e.g. `user_2abc123...`) — not a UUID, no FK to `auth.users` |
| `room_number` | `text` | nullable | Self-declared, optional, unverified — trust signal only |
| `is_banned` | `boolean` | not null, default `false` | Set by admin via moderation actions |
| `is_admin` | `boolean` | not null, default `false` | Manually set for the app owner's account only |
| `created_at` | `timestamptz` | not null, default `now()` | |

### `items`
The tuck shop menu.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `name` | `text` | not null | |
| `description` | `text` | nullable | |
| `price` | `numeric(6,2)` | not null | In ₹ |
| `category` | `text` | nullable | e.g. "snacks," "beverages," "meals" |
| `photo_url` | `text` | nullable | Menu/reference photo (Supabase Storage URL) |
| `is_active` | `boolean` | not null, default `true` | Soft-delete/hide items no longer sold |
| `is_veg` | `boolean` | not null, default `true` | True = vegetarian, false = non-veg (egg/meat) |
| `created_at` | `timestamptz` | not null, default `now()` | |
| `updated_at` | `timestamptz` | not null, default `now()` | |

### `ratings`
The core content table — one row per (user, item) rating.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `user_id` | `text` | FK → `users(id)`, not null | Owner of the rating (Clerk user ID) |
| `item_id` | `uuid` | FK → `items(id)`, not null | |
| `stars` | `smallint` | not null, check `stars between 1 and 5` | |
| `worth_it` | `boolean` | not null | Yes/no toggle |
| `review_text` | `text` | nullable, max length enforced at app + check constraint level (~500 chars) | |
| `hygiene_flag` | `boolean` | not null, default `false` | Separate, rare, serious flag — not averaged into star rating |
| `photo_url` | `text` | nullable | Optional student-uploaded photo of the actual item (nice-to-have feature) |
| `created_at` | `timestamptz` | not null, default `now()` | |
| `updated_at` | `timestamptz` | not null, default `now()` | Updated on edit |

**Unique constraint:** `unique (user_id, item_id)` — enforces "one rating per item per account" at the database level (edits update the existing row rather than creating a new one).

### `reports`
Flags raised against a specific rating/review.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `rating_id` | `uuid` | FK → `ratings(id)`, not null | The flagged review |
| `reported_by` | `text` | FK → `users(id)`, not null | Clerk user ID of the reporter |
| `reason` | `text` | not null, check in `('fake_spam','offensive','unrelated','other')` | |
| `comment` | `text` | nullable | Optional free-text elaboration |
| `status` | `text` | not null, default `'pending'`, check in `('pending','dismissed','removed')` | Set by admin action |
| `created_at` | `timestamptz` | not null, default `now()` | |
| `resolved_at` | `timestamptz` | nullable | |

---

## 2. Relationships

- `users.id` = Clerk user ID (text, no FK to `auth.users` — Clerk owns identity externally)
- `ratings.user_id` → `users.id` (many ratings per user)
- `ratings.item_id` → `items.id` (many ratings per item)
- `reports.rating_id` → `ratings.id` (many reports possible per rating, though UI should discourage duplicate reports from the same user via a secondary unique constraint on `(rating_id, reported_by)`)
- `reports.reported_by` → `users.id`

---

## 3. Indexes

| Table | Index | Reason |
|---|---|---|
| `ratings` | `index on (item_id)` | Fast lookup of all ratings for a given item (Item Detail screen) |
| `ratings` | `index on (user_id)` | Fast lookup of a user's own review history (Profile screen) |
| `ratings` | `unique index on (user_id, item_id)` | Enforces one rating per item per user; also speeds up "does this user already have a rating for this item" checks |
| `items` | `index on (is_active)` | Fast filtering of active menu items |
| `reports` | `index on (status)` | Fast lookup of pending reports for the admin moderation view |
| `reports` | `unique index on (rating_id, reported_by)` | Prevents the same user from reporting the same review multiple times |

---

## 4. Authentication & Session Handling

- **Identity provider:** Clerk (Pro plan) — email verification code, passwordless. Clerk manages user accounts, email delivery, and session tokens.
- **Supabase integration:** Supabase validates Clerk-signed JWTs via its native Third-Party Auth integration. The `@supabase/supabase-js` client receives the Clerk token through the `accessToken` callback option — no `supabase.auth.getSession()` calls.
- **User ID format:** Clerk IDs are text strings (e.g. `user_2abc123...`), not UUIDs. All `id`/`user_id`/`reported_by` columns that reference users are `text`.
- **RLS identity:** Policies use `(select auth.jwt() ->> 'sub')` (wrapped in a subselect for per-statement evaluation) instead of `auth.uid()` (which casts to UUID and fails on Clerk IDs).
- **Profile provisioning:** On first sign-in, the `useEnsureProfile` hook inserts a `public.users` row for the Clerk user (gated by the `users` INSERT RLS policy). This replaces the old `on_auth_user_created` trigger, which only worked for Supabase Auth users.
- **Admin check:** `is_admin` remains a column on `public.users`, checked via a `SECURITY DEFINER` helper function `is_admin()` that queries `public.users WHERE id = (select auth.jwt() ->> 'sub') AND is_admin = true`.

---

## 5. Permissions & Row Level Security (RLS)

RLS must be **enabled on every table**. Policies below define enforcement at the database level (not just app logic):

### `items`
- `select`: allowed for everyone, including anonymous/unauthenticated users (public menu browsing).
- `insert` / `update` / `delete`: allowed only for `is_admin = true` users (menu management).

### `ratings`
- `select`: allowed for everyone, including anonymous users (public review reading).
- `insert` (to `authenticated`): must satisfy `(select auth.jwt() ->> 'sub') = user_id` and `NOT is_banned()`.
- `update` (to `authenticated`): `USING` and `WITH CHECK` both require `(select auth.jwt() ->> 'sub') = user_id`; USING also checks `NOT is_banned()`.
- `delete` (to `authenticated`): owning user `(select auth.jwt() ->> 'sub') = user_id` OR `is_admin()`.

### `reports`
- `select` (to `authenticated`): `is_admin()` only.
- `insert` (to `authenticated`): `(select auth.jwt() ->> 'sub') = reported_by` and `NOT is_banned()`.
- `update` / `delete` (to `authenticated`): `is_admin()` only.

### `users`
- `select` (to `authenticated`): `(select auth.jwt() ->> 'sub') = id` OR `is_admin()`.
- `insert` (to `authenticated`): `(select auth.jwt() ->> 'sub') = id` — self-provisioning on first Clerk sign-in.
- `update` (to `authenticated`): `(select auth.jwt() ->> 'sub') = id`. Column-level: only `room_number` is updatable; `is_banned`/`is_admin` are admin-managed directly in DB.

---

## 6. Data Ownership Rules

- A rating is owned exclusively by the user who created it (`user_id`) — no other non-admin user can edit or delete it.
- Room number is self-declared and never used as an access-control mechanism — it's a soft trust signal only, not verified against any hostel record.
- Banned users (`is_banned = true`) retain read access (can still browse) but are blocked from `insert`/`update` on `ratings` and `reports` via RLS policy conditions.
- Admin role (`is_admin = true`) is manually granted directly in the database — no self-serve admin signup path exists, by design.
