# Backend Schema

## Product: TuckRate
## Database: PostgreSQL (via Supabase)

---

## 1. Tables

### `users`
Supabase Auth manages the core `auth.users` table (email, hashed session tokens, etc.) automatically. This app-specific `public.users` table extends it with profile data via a 1:1 relationship on `id`.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, references `auth.users(id)` on delete cascade | Matches Supabase Auth user id |
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
| `created_at` | `timestamptz` | not null, default `now()` | |
| `updated_at` | `timestamptz` | not null, default `now()` | |

### `ratings`
The core content table — one row per (user, item) rating.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `user_id` | `uuid` | FK → `users(id)`, not null | Owner of the rating |
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
| `reported_by` | `uuid` | FK → `users(id)`, not null | |
| `reason` | `text` | not null, check in `('fake_spam','offensive','unrelated','other')` | |
| `comment` | `text` | nullable | Optional free-text elaboration |
| `status` | `text` | not null, default `'pending'`, check in `('pending','dismissed','removed')` | Set by admin action |
| `created_at` | `timestamptz` | not null, default `now()` | |
| `resolved_at` | `timestamptz` | nullable | |

---

## 2. Relationships

- `users.id` → `auth.users.id` (1:1, extends Supabase Auth)
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

- Authentication itself (email OTP verification, session/JWT issuance and refresh) is fully handled by **Supabase Auth** — no custom auth tables or logic needed beyond the `public.users` profile extension above.
- On first successful OTP verification for a new email, a trigger (`on_auth_user_created`) should auto-insert a corresponding row into `public.users` with defaults (`is_banned = false`, `is_admin = false`).
- Client SDK (`@supabase/supabase-js`) manages session token storage/refresh automatically; the frontend simply checks `supabase.auth.getSession()` on load.

---

## 5. Permissions & Row Level Security (RLS)

RLS must be **enabled on every table**. Policies below define enforcement at the database level (not just app logic):

### `items`
- `select`: allowed for everyone, including anonymous/unauthenticated users (public menu browsing).
- `insert` / `update` / `delete`: allowed only for `is_admin = true` users (menu management).

### `ratings`
- `select`: allowed for everyone, including anonymous users (public review reading).
- `insert`: allowed for authenticated, non-banned users only; must satisfy `user_id = auth.uid()`.
- `update`: allowed only where `user_id = auth.uid()` (users can only edit their own rating) and the user is not banned.
- `delete`: allowed for the owning user (`user_id = auth.uid()`) or an admin (for moderation removals).

### `reports`
- `select`: allowed only for `is_admin = true` (regular users don't need to browse others' reports).
- `insert`: allowed for authenticated users, must satisfy `reported_by = auth.uid()`.
- `update`: allowed only for `is_admin = true` (resolving/dismissing reports).

### `users`
- `select`: a user can read their own row (`id = auth.uid()`); admin can read all rows (for moderation/ban actions).
- `update`: a user can update their own `room_number`; only admin can update `is_banned` / `is_admin`.

---

## 6. Data Ownership Rules

- A rating is owned exclusively by the user who created it (`user_id`) — no other non-admin user can edit or delete it.
- Room number is self-declared and never used as an access-control mechanism — it's a soft trust signal only, not verified against any hostel record.
- Banned users (`is_banned = true`) retain read access (can still browse) but are blocked from `insert`/`update` on `ratings` and `reports` via RLS policy conditions.
- Admin role (`is_admin = true`) is manually granted directly in the database — no self-serve admin signup path exists, by design.
