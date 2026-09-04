# UI/UX Design Brief

## Product: WorthIt

**Note:** the color palette and component styling below reflect the current warm/light theme. The live, enforced source of truth for the agent is the Antigravity workspace Rule at `.agents/rules/design-system.md` (content originally from `8-Antigravity-Design-Rule.md`) — if the two ever drift, the Rule wins since it's what actually governs generated code. This doc is the fuller reference for anyone reading `/docs` end to end. Typography, layout, mobile responsiveness, and UX principles below are unchanged since the original dark-theme version and remain accurate.

---

## 1. Design Style & Direction

**Overall personality:** playful, honest, "insider hostel app" — not a polished corporate food-delivery app. The product's value is unfiltered real opinions from people who live there, and the UI should feel like it belongs to the hostel, not to a company. Avoid anything that reads as generic SaaS or copies Zomato/Swiggy's visual language directly.

**Core UX principle:** every screen should support a **10-second decision** — a student standing at the tuck shop counter needs to glance, understand, and decide. Prioritize legibility and scan-ability over decorative detail.

**Mode:** Warm, light theme — cream background with a terracotta accent, photography-forward (real food photos, not stock imagery). Chosen over the original dark-mode direction for a more inviting, appetite-associated feel; the traffic-light rating system and scan-first UX principles carried over unchanged.

---

## 2. Color Palette

| Role | Color | Hex | Usage |
|---|---|---|---|
| Screen background | Warm cream | `#F7EFE3` | Base app background — never white or dark |
| Card/surface background | Off-white cream | `#FFFBF5` | Cards, input fields, chips (unselected) |
| Divider/border | Warm light beige | `#EAE0D0` | Hairline separators between list rows and sections |
| Primary text | Warm near-black | `#2B211B` | Item names, headings, primary content |
| Secondary text | Muted brown-gray | `#8C7F73` | Metadata, counts, timestamps |
| Accent (primary) | Terracotta | `#C1502E` (mid) / `#F4C9B4` (light tint) | Selected filter chip, primary CTA buttons, active states — the only accent color used, no other brights introduced |
| Rating: good/worth it | Green | bg `#E3F3E9`, text `#3F8F5F` | "Worth it" badge |
| Rating: bad/skip it | Red | bg `#FBE7E5`, text `#B23B3B` | "Skip it" badge, hygiene warning banner |
| Rating: mixed | Amber | bg `#FBF0DC`, text `#C98A26` | "Mixed" badge, star icon color |

**Rule:** badge/pill backgrounds use a light tint of the color family with a darker, saturated shade of the same hue for the text on top — the inverse of the old dark-theme approach (dark bg / light text), since the base is now light.

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

- **Cards:** 16–20px border radius, soft low-opacity warm-toned shadow (not harsh black — a light shadow reads naturally on a cream surface, unlike on the old dark theme).
- **Buttons:** primary CTA is a fully rounded (pill) filled terracotta button with cream text; secondary/ghost buttons use a transparent background with a thin terracotta border.
- **Chips/filters:** pill-shaped, unselected = cream surface with a border, selected = light terracotta tint fill with terracotta text.
- **Badges (worth-it/skip-it/mixed):** small rounded-rect pills, color-coded per the palette above — this remains the single most important visual element on each item row; scannable at a glance without reading text.
- **Icons:** simple outline-style icons (star, search, flag/report, user/profile) — consistent stroke weight throughout, no filled/solid icon variants mixed in.
- **Star rating display:** a single filled star icon + numeric rating (e.g. "★ 4.3") rather than 5 individual star icons — more compact and legible at small sizes on a list row. Item Detail screen can show the larger numeric rating prominently instead of a 5-star row.
- **Photography:** real food photos, 16–20px rounded-corner crop, consistent aspect ratio. Items with no photo yet get a soft category-tinted placeholder tile — never a broken image or plain gray box.

---

## 6. Dashboard Structure (future — owner-facing, not v1)

Not part of MVP, but noting direction for when it's built: a simple, non-punitive summary view — most-rated items, average rating trend, recent reviews — framed as "what students think," not a scoreboard against the shop. Same cream/terracotta theme should extend here for visual consistency, on a slightly wider (tablet-friendly) layout since an owner may check this on a larger device.

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
- **Warm, photography-forward food ordering apps** — for overall tonal/polish reference on color and imagery treatment only. Note: WorthIt is a rating app, not an ordering app — never carry over cart icons, add-to-cart buttons, checkout flows, or points/rewards mechanics from this kind of reference, even where they'd visually fit the layout.
- **Zomato/Swiggy's information density on a list row** (name, price, rating all visible without tapping in) — useful pattern to borrow for the Home list, even while avoiding their color/branding directly.

---

## 10. Building the UI

Screens are built directly in code (currently via Antigravity), not through a separate mockup tool. The palette/typography/component rules above are enforced automatically through the Antigravity workspace Rule (`.agents/rules/design-system.md`), which applies to all component files via glob matching — no need to restate this brief when prompting for each screen. Use the screen-specific layout described in `3-App-Flow.md` for structure. Suggested build order: Home → Item Detail → Rate & Review → Login (OTP) → Profile → Search → Report modal → Admin view (last, lowest priority for MVP).