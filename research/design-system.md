# Design system (as observed)

Values were read with `getComputedStyle` in the logged-in `/ai/image` workspace on 2026-10-14, unless marked as estimated from screenshots.

## Colour
| Token (my name) | Value | Where |
|---|---|---|
| bg | `rgb(15,17,19)` (#0F1113) | `body` background |
| fg | `rgb(247,247,248)` | body text |
| accent (lime) | `rgb(209,254,23)` (#D1FE17) | Generate button bg and border, active nav item, highlighted headline text |
| on-accent | `rgb(20,21,26)` | Generate label |
| surface-2 | `rgb(34,34,34)` | control pills |
| muted text | `rgba(255,255,255,0.6)` | pill labels |
| hairline | `rgba(209,254,23,0.05)` | pill border |
| promo pink | about #FF2D7A (estimated) | "50% OFF", PREMIUM / TOP badges, Max plan (`screenshots/19-pricing.png`) |

The interface is dark-only. I saw no light theme.

## Type
- UI font: **Inter** (body 16px/400; buttons 14px/600).
- Display font: **Space Grotesk**, 700, uppercase, letter-spacing −0.56px, 36px on the workspace hero ("START CREATING WITH…").
- Marketing headlines use a condensed, all-caps display face in two tones, white and lime (`screenshots/03-image-landing.png`).

## Radius and spacing
- Control pills: radius 12px, padding 12px, height 40px.
- Generate button: radius 12px.
- Prompt box: radius 24px, padding 22px.
- Popovers and menus: about 12–16px radius, 1px hairline border, dark surface (estimated, `screenshots/05-model-picker.png`).
- The prompt box is centred and about 680px wide, docked about 12px from the bottom (estimated).

## Components seen
- Prompt box card with a row of pills.
- Searchable model popover with sections and tags (PREMIUM in lime, NEW in lime, TOP in pink).
- Single-select menus with a check mark.
- Stepper.
- Full-screen modal (paywall).
- Tabbed library modal with skeleton loading tiles (`screenshots/09-reference-picker-loading.png`).
- Masonry grid with video badges.
- Lightbox with a side panel.
- Toasts: react-toastify CSS variables are present on `:root`.
- Countdown promo bar.
- Empty state with illustration and a single CTA (`screenshots/13-assets-empty-state.png`).

## Motion
- Pixel-mosaic shimmer on in-progress cards (`screenshots/25-guest-generate-t01s.png`).
- Hero imagery fans out in a stack.
- Skeleton tiles while libraries load.
- I could not check reduced-motion behaviour (not tested).

## What the clone takes vs changes
- **Take:** dark neutral base, one loud accent for the primary action, Inter for UI, a pill row in a docked prompt box.
- **Change:** our own name and logo; a different accent hue (no brand reuse); no promo pink; settings labels that state their trade-off in plain words.
