# Feature inventory

How to read this:
- **Complexity** is to rebuild in the clone (S / M / L).
- **Value** is to a first-time evaluator in a 60-second session.
- **Implement** is the scope decision, with the reasoning in `../PRODUCT_STRATEGY.md`.

| # | Feature | Goal | Entry | Workflow | Components | Interactions | Dependencies | Complexity | Value | Implement |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Prompt composer | Describe the image | Workspace bottom dock | type → Generate | textarea, docked card, cost button | auto-grow, Enter to submit, prompt kept after paywall | none | S | High | **yes** |
| 2 | Model picker | Choose a model | Model pill | open → search/scroll → pick | popover, search, grouped list, tags | live filter, keyboard | model catalogue | M | High | **yes** (fewer models, honest capabilities) |
| 3 | Aspect ratio | Output shape | Ratio pill | pick from 9 options | menu with shape icons | check mark on current | model support | S | High | **yes** |
| 4 | Quality / resolution | Fidelity vs speed | Quality and 2K pills | pick | menu with hints | settings change per model | model support | S | Med | **partial** (one "quality" control) |
| 5 | Batch count | Several variations | `− 1/4 +` | step | stepper | cost scales | provider quota | S | Med | **yes** (1–4) |
| 6 | Credit cost on button | Price before you commit | Generate button | read | badge | strike-through promo price | billing | S | Low (no billing in clone) | no; replaced by a free/demo label |
| 7 | Reference images (`+`) | Image-to-image | `+` | upload / pick from library | modal with 5 tabs | upload | storage, edit models | L | Med | **no** |
| 8 | `@` elements | Reuse characters | `@` | mention | autocomplete | — | Elements library | L | Low | no |
| 9 | Generation loading state | Feedback while waiting | after Generate | card with "In progress" and mosaic | placeholder card | animated | job API | S | High | **yes** (truthful progress) |
| 10 | Result detail / lightbox | Inspect and reuse output | click result | full view + side panel | lightbox, prompt with Copy, details, actions | Copy, Recreate, Download | — | M | High | **yes** |
| 11 | Recreate | Reuse prompt and settings | detail panel | click → composer filled in | — | — | — | S | High | **yes** ("Reuse settings") |
| 12 | Turn to video | Animate an image | detail panel | — | — | — | video models | L | Med | no |
| 13 | History / Assets | Find past work | nav Assets | library with folders and search | grid, side rail, search | filter by type and date | storage | M | High | **yes** (local history with search and delete) |
| 14 | Community Shots | Inspiration | nav Community | masonry, search, detail | grid, filters | Copy prompt / Recreate | UGC backend | L | Med | **partial** (curated "Try a prompt" examples) |
| 15 | Video generation | Text to video | nav Video | same composer | — | duration, sound | video models, cost | L | Med | no |
| 16 | Paywall / pricing | Monetise | Generate at 0 credits, nav Pricing | plan cards, countdown | modal | — | billing | M | None for the evaluator | no |
| 17 | Auth (Clerk) | Accounts | Login / Sign up | — | — | — | Clerk | M | Negative for the 60s test | no |
| 18 | Guest teaser | Convert guests | Generate while logged out | fake progress → sign-up wall | modal | — | — | S | Negative | no; replaced by a real demo result |
| 19 | Promo banners / toasts | Upsell | every page | — | banners, toasts | dismiss | — | S | Negative | no |
| 20 | Mobile agent composer | Mobile creation | `/start/agent` | chat-like | sliders sheet | — | — | M | Med | **partial** (responsive version of the same workspace) |
