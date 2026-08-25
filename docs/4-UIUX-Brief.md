# UI/UX Design Brief

## Product: TuckRate

This brief is written to be used directly as design input for an AI UI builder (e.g. Stitch), one screen at a time. Global style guide first, then per-screen notes.

---

## 1. Design Style & Direction

**Overall personality:** playful, honest, "insider hostel app" — not a polished corporate food-delivery app. The product's value is unfiltered real opinions from people who live there, and the UI should feel like it belongs to the hostel, not to a company. Avoid anything that reads as generic SaaS or copies Zomato/Swiggy's visual language directly.

**Core UX principle:** every screen should support a **10-second decision** — a student standing at the tuck shop counter needs to glance, understand, and decide. Prioritize legibility and scan-ability over decorative detail.

**Mode:** Dark mode as the default and primary theme (not just supported — designed for). Reasoning: primary usage moment is evening/night at the counter, feels distinct from institutional light-mode apps, easier on eyes, better battery on OLED phones.

---

## 2. Color Palette

| Role | Color | Hex | Usage |
|---|---|---|---|
| Screen background | Near-black charcoal | `#17181C` | Base app background |
| Card/surface background | Slightly lighter charcoal | `#202127` | Cards, input fields, chips (unselected) |
| Divider/border | Subtle dark gray | `#232329` / `#2C2D33` | Hairline separators between list rows and sections |
| Primary text | Off-white | `#F5F5F0` | Item names, headings, primary content |
| Secondary text | Muted gray | `#9B9A94` | Metadata, counts, timestamps |
| Placeholder/disabled text | Dim gray | `#6F6E68` | Search placeholder, disabled states |
| Accent (primary) | Warm coral/orange | `#D85A30` (mid) / `#F0997B` (light) / `#4A1B0C` (dark, for text-on-accent) | Selected filter chip, primary CTA buttons, active states — appetite-associated, food-app convention, but distinct from Zomato red |
| Rating: good/worth it | Green | bg `#173404`, text `#97C459` | "Worth it" badge |
| Rating: bad/skip it | Red | bg `#501313`, text `#F09595` | "Skip it" badge, hygiene warning banner |
| Rating: mixed | Amber | bg `#412402`, text `#FAC775` | "Mixed" badge, star icon color |

**Rule:** badge/pill backgrounds always use the darkest shade of a color family with the lighter/mid shade for the text on top — never plain black or white text on a colored fill.

---

## 3. Typography

- **Typeface:** a friendly, rounded sans-serif — Inter or Poppins are good defaults (both free, widely available, install cleanly in a Vite/Tailwind project).
- **Weights:** two weights only — regular (400) for body text, medium (500) for headings/emphasis. Avoid heavy/bold weights — they feel too corporate against the dark, casual aesthetic.
- **Sizes (mobile-first):**
  - Screen title: 16–18px, medium
  - Item name (card/detail): 14–16px, medium
  - Body/review text: 14px, regular
  - Metadata (counts, dates): 12px, regular, secondary color
  - Large rating number (item detail): 28–32px, medium
- **Case:** sentence case everywhere — no ALL CAPS, no Title Case except proper nouns.

---

## 4. Layout Direction

- **Mobile-first, single column.** This is a phone-in-hand app; no desktop layout needed for v1.
- **Bottom navigation** (3 items: Home, Search, Profile) for primary navigation — thumb-reachable, always visible except during focused flows (rating submission, login).
- **List-based content, not grid-based.** Item cards stack vertically with clear price/rating alignment on the right edge, name/rating-count on the left — supports fast vertical scanning.
- **Sticky elements:** search bar and filter chips stay pinned near the top of Home during scroll; "Rate this item" CTA stays sticky at the bottom of Item Detail.
- **Generous tap targets:** minimum 44px touch height on all interactive elements (filter chips, buttons, list rows) — this will often be used one-handed, sometimes while walking.

---

## 5. Component Style

- **Cards:** 12px border radius, no shadows (flat dark surfaces, distinguished by subtle background contrast and hairline borders — not elevation shadows, which read oddly on dark backgrounds).
- **Buttons:** primary CTA uses the coral accent fill with dark text; secondary/ghost buttons use transparent background with a subtle border.
- **Chips/filters:** pill-shaped (fully rounded), unselected = card-background gray, selected = coral accent fill.
- **Badges (worth-it/skip-it/mixed):** small rounded-rect pills, color-coded per the palette above — this is the single most important visual element on each item row; it should be scannable at a glance without reading text.
- **Icons:** simple outline-style icons (star, search, flag/report, user/profile) — consistent stroke weight throughout, no filled/solid icon variants mixed in.
- **Star rating display:** a single filled star icon + numeric rating (e.g. "★ 4.3") rather than 5 individual star icons — more compact and legible at small sizes on a list row. Item Detail screen can show the larger numeric rating prominently instead of a 5-star row.

---

## 6. Dashboard Structure (future — owner-facing, not v1)

Not part of MVP, but noting direction for when it's built: a simple, non-punitive summary view — most-rated items, average rating trend, recent reviews — framed as "what students think," not a scoreboard against the shop. Same dark theme and coral accent should extend here for visual consistency, on a slightly wider (tablet-friendly) layout since an owner may check this on a larger device.

---

## 7. Mobile Responsiveness

- Design and build for a **360–430px wide viewport** as the primary target (typical Android phone width — the dominant device type in this context).
- Avoid any layout that assumes hover states (no hover-dependent tooltips or interactions) — this is a touch-only context.
- Ensure the PWA install prompt / "Add to Home Screen" flow is visually supported (a brief in-app banner or instruction, since browser-native prompts vary by platform).
- Safe-area padding for bottom nav on notched/gesture-nav phones.

---

## 8. UX Principles

1. **Speed over completeness.** Every flow should be doable in seconds, not minutes — this is a snack decision, not a big purchase.
2. **Browse before login.** Never gate viewing content behind a login wall — only gate the act of contributing.
3. **Traffic-light scanability.** Color coding (green/red/amber) should let a student understand an item's standing without reading any text.
4. **Honest, not corporate.** Copy tone should feel like a student wrote it — direct, a little blunt, no marketing language ("Don't waste your money on this" is more on-brand than "This item has received mixed feedback").
5. **Low-stakes design matches low-stakes content.** Don't over-engineer flows for what is fundamentally a ₹30–100 decision — friction anywhere in the core loop (browse → rate) should be treated as a bug.

---

## 9. Visual References (for direction, not literal copying)

- **Traffic-light rating systems** (like Uber driver ratings, but simplified to 3 states) — for the worth-it/skip-it/mixed badge convention.
- **Dark-mode-first consumer apps** aimed at a college-age audience — for overall tonal reference (not any specific branded app).
- **Zomato/Swiggy's information density on a list row** (name, price, rating all visible without tapping in) — useful pattern to borrow for the Home list, even while avoiding their color/branding directly.

---

## 10. Per-screen notes for UI generation (Stitch prompts)

When generating each screen individually, carry the palette/typography/component rules above as a consistent system prompt, and use the screen-specific layout described in `3-App-Flow.md` for structure. Suggested order to generate: Home → Item Detail → Rate & Review → Login (OTP) → Profile → Search → Report modal → Admin view (last, lowest priority for MVP).
