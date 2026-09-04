# Product Requirements Document (PRD)

## Product name (working title)
**WorthIt** — a food rating PWA for hostel tuck shops

---

## 1. App Overview

WorthIt is a mobile-first Progressive Web App that lets hostel students rate and review individual food items sold at their hostel tuck shop, so other students can make a fast, informed decision ("is this worth my money?") before buying.

This is a **hobby project**, scoped intentionally small: **one tuck shop, one boys' hostel**, to start. It's built to be genuinely useful, not to be a startup from day one — validation and real usage matter more than feature completeness.

- **Platform:** PWA (installable on phone home screen, works in mobile browser, no app store needed)
- **Initial scope:** Single tuck shop, single boys' hostel
- **Future scope (not v1):** Girls' hostel tuck shop, other hostels, mess/canteen, multi-vendor support

---

## 2. Problem Statement

Hostel students routinely spend money on tuck shop food items without knowing in advance whether they're actually good, based purely on menu name and price. The informal word-of-mouth network (roommates, seniors, WhatsApp groups) partially solves this, but:

- **New students (freshers)** haven't built that network yet and have no reference point.
- Word-of-mouth is **unstructured and not aggregated** — one friend's opinion isn't the same as 40 students' consensus.
- There's **no easy way to discover** items you'd never have thought to ask about (hidden gems, best value-for-money items).

**Core problem statement:** Students have no fast, low-friction, aggregated way to know whether a specific tuck shop item is worth buying before they spend money on it.

---

## 3. Target Users

| User type | Description | Primary need |
|---|---|---|
| **New/fresher students** | Just arrived, no local food knowledge | Avoid wasting money while still figuring out the tuck shop |
| **Regular hostel residents** | Know the tuck shop reasonably well | Discover new/better items, avoid repeat mistakes, contribute opinions |
| **Tuck shop owner** (secondary, non-MVP) | Runs the shop | Understand what students actually think, non-adversarial signal |
| **App admin/moderator** | The builder (you), acting as sole moderator at this scale | Keep the platform clean and trustworthy |

Primary persona for v1: **a boys' hostel resident standing at the tuck shop counter, deciding what to order in the next 10 seconds.**

---

## 4. Core Features

### Must-have (MVP)
- Browse full tuck shop menu (name, price, category, photo)
- View item detail: average star rating, "worth it" percentage, review count, text reviews
- Sign up / log in via any email + OTP (magic link), no college ID required
- Submit a rating: 1–5 stars, "worth it" yes/no toggle, optional text review
- One rating per item per account (editable, not stackable)
- Sort/filter: highest rated, lowest rated, price (low to high)
- Browse without logging in; login required only to submit a rating
- Report/flag a review (manual moderation by admin)

### Nice-to-have
- Search menu by name
- "Best under ₹50" / "under ₹30" filter
- Student-uploaded photos of actual food (not just menu photos)
- "Today's specials" flag
- Compare two items side by side
- Public reviewer history (accountability + light social proof)

### Advanced / future (not v1)
- Recommendations based on rating history
- Multi-vendor support (girls' hostel, mess, canteens)
- Tuck shop owner dashboard (aggregated, non-punitive insights)
- Gamification (badges, leaderboards) — only if retention data shows it's needed
- Pre-order / skip-the-line ordering
- Push notifications (new items, specials)

---

## 5. User Stories

**As a student (not logged in)**
- I want to see the full menu with ratings so I can decide what to order without needing an account.
- I want to see the worst-rated items clearly flagged so I don't waste money.
- I want to sort by "best under ₹50" so I can find good cheap options fast.

**As a student (logged in)**
- I want to sign up with any email (not just college email) so I'm not blocked from using the app.
- I want to rate an item in under 15 seconds so it doesn't feel like a chore.
- I want to edit my rating if my opinion changes.
- I want to see my own review history so I know what I've already rated.
- I want to report a review that looks fake, offensive, or unrelated to the food.

**As the admin/moderator**
- I want to see flagged/reported reviews in one place so I can act on them quickly.
- I want to ban or restrict an account that's clearly abusing the system.
- I want to add/edit/remove menu items as the tuck shop menu changes.

---

## 6. MVP Scope

**In scope for MVP:**
- One tuck shop, one hostel, ~30–40 menu items
- Any-email + OTP signup, optional self-declared room number
- Star rating + worth-it toggle + optional text review
- Public browse, gated submission
- Sort/filter by rating and price
- Basic report/flag → manual admin review
- Seed data: you + a handful of friends rate the initial menu before public launch

**Explicitly out of scope for MVP:**
- Multiple vendors/hostels
- Gamification/badges/leaderboards
- Recommendations engine
- Owner-facing dashboard
- Pre-ordering or payments
- Push notifications
- Native app (PWA only)

---

## 7. Success Metrics

Since this is a hobby project, success should be measured by **real usage and validation signal**, not vanity metrics:

- % of hostel residents who create an account within first month
- Number of items with 5+ ratings within first 2 weeks of launch
- Ratio of ratings submitted vs. app opens (engagement depth, not just visits)
- Whether usage persists past week 2–3 (the real test — does it survive after novelty wears off, once the informal network "catches up")
- Qualitative: do students mention it unprompted in hostel group chats?

Vanity metrics to explicitly **not** over-index on: total signups, total page views — these don't tell you if the app is actually solving the problem.

---

## 8. Features to Avoid in Version 1

Explicitly avoid these, even if tempting, because they add complexity without proven value at this stage:

- **5-axis rating systems** (taste/quantity/value/hygiene/consistency as separate sliders) — too much friction for a ₹60 decision. Use one overall star + worth-it toggle instead.
- **Gamification/leaderboards** — solves a motivation problem you don't have evidence of yet.
- **College-email-only signup** — blocks real users unnecessarily; any-email + OTP is enough friction against abuse at this scale.
- **Owner dashboard / multi-vendor support** — build only after the core loop (browse → rate → browse) is proven to work with real users.
- **Complex fraud detection (ML-based, device fingerprinting, etc.)** — unnecessary at a few-hundred-user hostel scale; public review history + manual moderation is sufficient.
- **Native mobile app** — PWA is the right call: installable, no app store friction, faster to ship, appropriate for a hobby project.

---

## 9. Honest Framing

This is a hobby project meant to be genuinely useful, not a guaranteed startup. The core risk (small menu = thin content = short engagement lifespan) is real and acknowledged. The MVP is deliberately minimal so it can be validated fast and cheap before any further investment of time.
