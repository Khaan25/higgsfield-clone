# User flows (observed 2026-10-14)

"Not tested" means the flow was blocked; the reason is given each time.

## F1. Image generation, logged in (account has 0 credits)
- **Entry:** nav "Image" goes to the marketing landing `/ai-image`, which has a hero and a mini prompt box (`screenshots/03-image-landing.png`). "Create Image Now" leads to the workspace `/ai/image?model=gpt_image_2` (`screenshots/04-image-workspace-empty.png`).
- **Screens:**
  - Empty workspace: hero "Start creating with Higgsfield Soul Cinema" and a promo banner. The prompt box is docked at the bottom centre.
- **Controls in the prompt box, left to right:**
  - `+` opens the reference picker: Uploads / AI Influencer / Elements / Generations / Liked tabs (`screenshots/09-reference-picker-loading.png`, `screenshots/10-reference-picker-uploads.png`).
  - `@` mentions an element.
  - Model pill (`screenshots/05-model-picker.png`).
  - Aspect ratio: Auto, 1:1, 3:2, 2:3, 16:9, 9:16, 4:3, 3:4, 21:9 (`screenshots/07-aspect-ratio-menu.png`).
  - Quality: Low "Fastest And Cheapest" / Medium / High "Best Visual Fidelity" (`screenshots/08-quality-menu.png`).
  - Resolution: 2K.
  - Batch: `− 1/4 +`.
  - Generate button with the credit cost (old price struck through: ~~8.5~~ 6.5).
- **Model picker:**
  - A popover with a search box, "Featured models" (14) and "All models" (about 21).
  - Each row has a name, a one-line description, and a PREMIUM or NEW tag.
  - Typing "seed" filters the list live (`screenshots/06-model-picker-search.png`).
  - Credit costs are not shown in the picker; you only see them on the Generate button after choosing.
- **Settings depend on the model.** Nano Banana Pro shows 1K and a "Draw" tool, with no Quality control, and costs 2 credits (`screenshots/18-recreate-loads-settings.png`).
- **Generate with 0 credits:** a full-screen "Unlock GPT Image 2.0" paywall with plan cards and a countdown (`screenshots/11-generate-paywall-zero-credits.png`). Closing it returns to the workspace with the prompt kept (`screenshots/12-workspace-after-paywall-prompt-kept.png`).
- **Loading, success and error states for a real generation: not tested.** The account has 0 credits and the user chose not to pay (decision recorded in PROGRESS.md).
- **Persistence:** after navigating away and back, the recreated prompt and settings were still in the box (`screenshots/20-workspace-loading-draft-persisted.png`). That page first shows a centred spinner while the feed loads.

## F2. Image generation, logged out (guest)
- **Entry:** `/ai/image`, 200 OK, same workspace, with Login / Sign up in the nav (`screenshots/23-desktop-image-workspace-logged-out.png`).
- **Flow:**
  - Type a prompt and press Generate.
  - About 1s: an "In progress" card with an animated pixel-mosaic placeholder at the top of the feed (`screenshots/24-desktop-generate-logged-out-gate.png`, `screenshots/25-guest-generate-t01s.png`).
  - About 8s: the card becomes a blurred colour field with the modal "Create an account to see generated image", a "Sign up for free" button and "Already have an account? Sign in" (`screenshots/26-guest-generate-t08s.png`).
  - 50s: unchanged (`screenshots/28-guest-generate-t50s.png`).
- **Network:** no generation request was sent. The only API calls were 401s on `/fnf/workspaces/*` plus public GETs (`/fnf/job-sets/costs`, `/fnf/subscriptions/v2/plans`) (`evidence/guest-network.txt`). The progress state is decoration in front of a sign-up wall.

## F3. Browse, inspect, recreate (community)
- **Entry:** nav "Community", then the Discovery tab (`screenshots/15-community-discovery.png`), then the Shots tab `/community/generations`. Shots is a masonry grid of images and videos; video tiles have a ▶ badge. It has a "All shots" filter and a search box (`screenshots/16-community-shots-grid.png`).
- **Shot detail:** the image fills a blurred backdrop. A right panel has:
  - Author, plus Info and Comments tabs.
  - PROMPT with a Copy button, and the reference images.
  - DETAILS: Model, Quality, Size, Created.
  - Actions: Turn to video (primary), Recreate, Download, like, share, ⋯ (`screenshots/17-shot-detail-result-view.png`).
- **Recreate:** opens `/ai/image?model=nano-banana-pro` with the prompt, model, aspect ratio, resolution and references already filled in (`screenshots/18-recreate-loads-settings.png`).

## F4. History / Assets
- **Entry:** nav "Assets", `/asset/all`.
- **Left rail:** Assets, Projects, Favourites, Elements, Trash; then Tools: Images, Video, Audio, Enhanced.
- **Empty state:** "Nothing here yet", an illustration, and a "Start generating" button. A tooltip says "Now you can search by date and prompt" (`screenshots/13-assets-empty-state.png`).
- **A populated history view: not tested** (the account has no generations).

## F5. Video
- **Entry:** nav "Video", `/create/video`, which redirects to a landing page with the same mini prompt box.
- **Settings:** Seedance 2.0 · 8s · Auto · sound On (`screenshots/14-video-landing.png`).
- **Generation: not tested** (credits).

## F6. Mobile (390×844, logged out)
- `/` redirects to `/explore`: a carousel, Image/Video/Assets/MCP tiles and "Community presets" (`screenshots/21-mobile-home-logged-out.png`).
- `/ai/image` redirects to `/start/agent?model=imagegen_2_0&mode=image`, a different, chat-style prompt box. Settings collapse into a sliders icon and the Generate button shows the cost "11" (`screenshots/22-mobile-image-workspace-logged-out.png`).
- The cookie notice covers about 40% of the viewport on first load.
