---
trigger: glob
globs: src/**/*.{tsx,jsx}
---

# TuckRate Design System Rule

Applies to all UI/component code in this project. This is a visual style rule only — feature scope and behavior are governed by `@docs/1-PRD.md` and `@docs/3-App-Flow.md`; don't infer functionality from this file.

## Calibration
Visual inspiration is a food ORDERING app's warmth/photography style — but TuckRate is a RATING app. Never add cart icons, add-to-cart buttons, checkout flows, or points/rewards mechanics, even if they'd visually fit the layout. Any banner/spotlight space shows rating content (e.g. "this week's top-rated item") or a plain community CTA, never a promo or rewards system.

## Color palette
- Background: `#F7EFE3` (warm cream — never white or dark)
- Card/surface: `#FFFBF5`
- Border/divider: `#EAE0D0`
- Primary text: `#2B211B`
- Secondary text: `#8C7F73`
- Primary accent (terracotta): `#C1502E`, light tint `#F4C9B4`
- Rating "worth it": bg `#E3F3E9`, text `#3F8F5F`
- Rating "skip it": bg `#FBE7E5`, text `#B23B3B`
- Rating "mixed": bg `#FBF0DC`, text `#C98A26`
- No other accent colors — terracotta is the only brand color used for interactive/active elements.

## Typography
Poppins (or Inter) only. SemiBold for headings/app name, Regular for body. Sentence case everywhere, no all-caps.

## Photography
Real food photos, 16–20px rounded-corner crop, consistent aspect ratio. If an item has no photo yet, render a soft category-tinted placeholder tile — never a broken image or plain gray box.

## Components
- Cards: `#FFFBF5` surface, 16–20px radius, soft low-opacity warm-toned shadow (not black/harsh)
- Primary buttons: filled terracotta `#C1502E`, cream text, fully rounded (pill)
- Secondary buttons: transparent, thin terracotta border, terracotta text
- Chips: pill-shaped; unselected = cream surface + border; selected = `#F4C9B4` bg + terracotta text
- Rating badges: rounded-rect pills using the exact tint/text pairs above — this is the primary at-a-glance scan element on every item row, keep it visually dominant
- Bottom nav: cream background, exactly 3 items (Home, Search, Profile), active item gets a soft rounded pill highlight behind the icon — never add a 4th/5th nav item
- Star icon: amber fill, shown as compact "★ 4.3" style, not five separate star icons on list rows

## Layout
Mobile-first only, 375–390px target viewport, single column, no desktop breakpoints for v1 screens.

## Tone
Playful, honest, student-written copy — not corporate marketing language. ("Don't waste your money on this," not "mixed feedback received.")

## Consistency check
Before considering any screen done, confirm: background is the cream hex above (not white/dark), only terracotta is used as the accent, rating badges use the exact palette pairs, no cart/checkout/rewards elements exist anywhere, typography is Poppins/Inter sentence-case only, and bottom nav has exactly 3 items.