# App Flow Document

## Product: WorthIt

This document specifies every screen, user action, navigation path, and state (success/error/empty) needed to build the app without guessing. Written for direct use by an AI coding agent.

---

## Screen inventory

1. Splash / initial load
2. Home (browse menu)
3. Item detail
4. Login / signup (email OTP)
5. Rate & review (submit/edit)
6. My profile / my reviews
7. Search
8. Report/flag modal
9. Admin moderation view (basic, admin-only)

---

## 1. Splash / initial load

**Purpose:** Loading shell while the app fetches the menu and checks auth session.

- **On load:** check for existing Supabase session (silent, no user action).
- **Success state:** session found or not — either way, proceed to Home. Logged-in state is reflected in the header (avatar/initial vs. "Log in" button).
- **Loading state:** simple centered spinner/skeleton, under 1 second target.
- **Error state:** if Supabase is unreachable, show "Couldn't connect. Check your internet and retry." with a retry button. Do not block indefinitely.

---

## 2. Home (browse menu)

**Purpose:** Primary screen — most usage happens here. Must work without login.

**Layout:**
- Header: app name, item count, rating count summary (e.g. "42 items rated by 118 students")
- Search bar (tap → navigates to Search screen)
- Filter chips: "Top rated," "Under ₹50," "Worth it," (horizontally scrollable)
- Scrollable list of item cards: name, price, star rating + count, worth-it/skip-it/mixed badge

**User actions:**
- Tap filter chip → re-sorts/filters the list in place (no navigation)
- Tap search bar → navigate to Search screen
- Tap an item card → navigate to Item Detail
- Tap login/profile icon (header, top-right) → navigate to Login (if logged out) or Profile (if logged in)
- Pull-to-refresh → re-fetches menu + rating data

**States:**
- **Success:** list renders with items sorted by selected filter (default: top rated first)
- **Empty (no items yet):** "No items rated yet — be the first to rate something." with a CTA that opens the first item in the list, or (if literally zero menu items exist) an admin-only message
- **Loading:** skeleton cards (3–5 gray placeholder rows) while data fetches
- **Error:** "Couldn't load the menu. Retry." button; keep last cached data visible if available (offline-friendly via service worker cache)

---

## 3. Item detail

**Purpose:** Core decision screen — "should I buy this?"

**Layout:**
- Item name, price, category, photo (student-uploaded if available, else placeholder)
- Large average star rating + total rating count
- "Worth it" percentage (e.g. "78% say worth it")
- Hygiene flag banner (only shown if any hygiene reports exist — red, prominent)
- List of text reviews (most recent first), each showing: star rating, worth-it badge, review text, reviewer's review count (for social accountability), report/flag icon
- Sticky bottom CTA: "Rate this item" (or "Edit your rating" if the logged-in user already rated it)

**User actions:**
- Tap "Rate this item" → if not logged in, navigate to Login first (with a return-to-this-screen redirect); if logged in, navigate to Rate & Review screen
- Tap report/flag icon on a review → open Report modal
- Tap back → return to Home (preserving previous scroll position/filter state)

**States:**
- **Success:** full detail renders as above
- **Empty (no reviews yet):** star rating area shows "Not yet rated" instead of a number; reviews list shows "No reviews yet — be the first." with the rate CTA emphasized
- **Loading:** skeleton for image, rating, and review list
- **Error:** "Couldn't load this item. Retry." — with back navigation still available

---

## 4. Login / signup (email OTP)

**Purpose:** Single unified flow — no separate "signup" vs. "login," since email OTP naturally handles both (new email = new account created implicitly).

**Layout — Step 1 (email entry):**
- Email input field
- Optional room number field (labeled clearly as optional, used only for community trust, not verified)
- "Send code" button

**Layout — Step 2 (OTP entry):**
- 6-digit code input
- "Verify" button
- "Resend code" link (disabled for 30s cooldown after send)

**User actions:**
- Submit email → triggers OTP send → advance to Step 2
- Submit OTP → verify → on success, create session, navigate back to the screen the user came from (e.g. Item Detail), or Home if no redirect context
- Tap "Resend code" → re-triggers OTP send, resets cooldown

**States:**
- **Success:** session created, redirect as above
- **Error (invalid email format):** inline error under the field, "Enter a valid email," submit disabled until fixed
- **Error (OTP incorrect):** inline error, "That code's not right. Try again," code field cleared, cursor refocused
- **Error (OTP expired):** "That code expired. Resend a new one." with resend CTA emphasized
- **Loading:** button shows a spinner/disabled state while OTP is sent or verified; no double-submit allowed

---

## 5. Rate & review (submit/edit)

**Purpose:** The core content-generation action. Must be fast — target under 15 seconds to complete.

**Layout:**
- Item name + price shown at top for context
- Star selector (1–5, tap to select, required)
- "Worth the price?" — Yes/No toggle (required)
- Optional text review field (placeholder: "What did you think?")
- Optional "Report a hygiene issue" checkbox (separate from star rating — see PRD rating system design)
- "Submit" button (disabled until star rating + worth-it toggle are both set)

If the user already rated this item, the form pre-fills with their existing rating and the submit button reads "Update rating" instead of "Submit."

**User actions:**
- Select stars → updates local state, no navigation
- Select worth-it toggle → updates local state
- Type review text → updates local state
- Tap submit → validates required fields → writes to database → navigate back to Item Detail with the new/updated rating visible immediately

**States:**
- **Success:** brief confirmation (e.g. a toast: "Rating saved") then navigate back to Item Detail, scrolled to show the user's own review at the top of the list
- **Error (missing required fields):** inline error, "Add a star rating and let us know if it's worth it," submit stays disabled
- **Error (network/save failure):** "Couldn't save your rating. Retry." — form data is preserved, not lost, so the user doesn't have to retype
- **Loading:** submit button shows spinner, disabled during save

---

## 6. My profile / my reviews

**Purpose:** Lets a logged-in user see their own contribution history; supports the "public review history" trust mechanism from the PRD.

**Layout:**
- Email (or masked version) + optional room number
- Count of reviews contributed
- List of the user's own ratings (item name, stars, worth-it, date), each tappable → Item Detail
- "Log out" button

**User actions:**
- Tap a past review → navigate to that Item Detail
- Tap "Log out" → clears session, navigate to Home (logged-out state)

**States:**
- **Success:** list of past reviews renders
- **Empty:** "You haven't rated anything yet." with a CTA back to Home
- **Loading:** skeleton list
- **Error:** "Couldn't load your reviews. Retry."

---

## 7. Search

**Purpose:** Fast lookup by item name.

**Layout:**
- Search input (auto-focused on screen entry)
- Live-filtered results list (same card style as Home)

**User actions:**
- Type query → filters in real time (client-side filter against already-loaded menu data; no separate API call needed given small menu size)
- Tap a result → navigate to Item Detail
- Tap back/cancel → return to Home

**States:**
- **Success:** filtered list renders as user types
- **Empty (no matches):** "No items match '<query>'." 
- **Empty (no query yet):** show full menu list by default, or a placeholder "Start typing to search"

---

## 8. Report/flag modal

**Purpose:** Lets any logged-in user flag a review for admin attention.

**Layout:**
- Modal/bottom sheet over current screen
- Reason selector: "Fake/spam," "Offensive," "Unrelated to food," "Other"
- Optional short comment field
- "Submit report" button

**User actions:**
- Select reason → enables submit
- Tap submit → writes report to database, closes modal, shows confirmation
- Tap outside modal / close icon → dismiss without submitting

**States:**
- **Success:** toast "Report submitted — thanks for flagging this," modal closes
- **Error:** "Couldn't submit report. Retry." — modal stays open, selections preserved
- **Loading:** submit button disabled/spinner during save

---

## 9. Admin moderation view (basic, admin-only)

**Purpose:** Lets you (the sole moderator) review flagged content and act on it. Not visible/accessible to regular students.

**Layout:**
- List of pending reports: reported review text, reason, reporter, item, date
- Actions per report: "Dismiss," "Remove review," "Ban user"

**User actions:**
- Tap "Dismiss" → marks report resolved, no content change
- Tap "Remove review" → deletes the flagged rating from the database, marks report resolved
- Tap "Ban user" → sets the offending account's status to banned (blocks future submissions), marks report resolved

**States:**
- **Success:** list updates immediately after action, item removed from pending list
- **Empty:** "No pending reports."
- **Error:** "Action failed. Retry."

**Access control note:** this screen must check the logged-in user's role (admin flag on the `users` table — see Backend Schema) before rendering; non-admins attempting to access the route should be redirected to Home.

---

## Global navigation notes

- **Bottom nav (mobile):** Home, Search, Profile — 3 items, always visible except during Rate & Review and Login flows (which are focused, single-task screens).
- **Back behavior:** Android hardware/gesture back and in-app back buttons should always return to the previous logical screen, preserving scroll position and filter state on Home.
- **Auth-gated actions:** any action requiring login (submitting a rating, reporting) triggers the Login flow with a return-to redirect, rather than blocking the action outright — users should always be able to browse first.
