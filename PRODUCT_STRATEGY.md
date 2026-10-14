# Product strategy

Higgsfield is a 25-tool creative suite. In 24 hours the clone can only be excellent at one loop. Research shows that the loop Higgsfield itself gates hardest is the one a first-time user cares about most: **type an idea, see an image, iterate.**

## Brief questions
_Pending: the 7 questions from the 8x brief are not in this repo yet. They are answered here once the brief text is provided (see PROGRESS.md)._

## Prioritisation
Scores run 1–5. For effort, risk and dependencies, a higher score means less of it, which is better. Time to ship is my estimate.

| Candidate | User value | Demo impact | Effort | Risk | Dependencies | Time to ship | Total | Call |
|---|---|---|---|---|---|---|---|---|
| Image workspace: prompt → generate → result (no login) | 5 | 5 | 4 | 4 | 4 (keyless provider + demo) | 4h | **22** | **Primary** |
| Model and settings picker that explains trade-offs | 4 | 4 | 4 | 5 | 5 | 2h | **22** | Supporting |
| Session history: search, reuse settings, download, delete (localStorage) | 4 | 4 | 4 | 5 | 5 | 2h | **22** | Supporting |
| Result lightbox (prompt, details, actions) | 4 | 4 | 4 | 5 | 5 | 1.5h | **22** | Supporting |
| Example-prompt empty state ("Try a prompt") | 3 | 4 | 5 | 5 | 5 | 0.5h | **22** | Supporting (folded into the workspace) |
| Video generation | 4 | 5 | 1 | 1 | 1 (no free video API) | 8h+ | 12 | Excluded |
| Reference images / image-to-image | 3 | 3 | 2 | 2 | 2 (upload storage, edit model) | 5h | 12 | Excluded |
| Community feed (UGC) | 3 | 3 | 2 | 3 | 1 (backend, moderation) | 6h | 12 | Excluded |
| Accounts, credits, pricing | 1 | 1 | 2 | 2 | 1 | 6h | 7 | Excluded |

## Primary journey (one)
**A visitor lands on the workspace, writes or picks a prompt, chooses a model and aspect ratio, presses Generate, watches honest progress, gets an image, and can reuse or refine it, all without signing in.**

## Supporting features
1. **Model and settings controls that explain themselves.** Each model shows a "best for" line and its speed. Aspect ratios show a shape preview and a use case. Unsupported settings are disabled with a reason.
2. **History in the workspace.** Results persist across reloads (localStorage). History offers search by prompt, Reuse settings, Download and Delete.
3. **Result lightbox.** Full image, prompt with Copy, model / size / seed / created time, and Reuse, Download, Delete.

## Deliberately excluded
- **Video, audio, effects, AI Influencer, Ads/Cinema/Marketing studios, Canvas, MCP/API.** Each one is a whole product, and none has a free generation API I could rely on today.
- **Reference images, `@` elements, Draw/inpaint.** They need upload storage and edit-capable models, which doubles the surface for a fraction of first-run value.
- **Accounts, credits, pricing, paywall.** The evaluator test is "usable in 60 seconds without logging in". Auth only adds friction here.
- **Community feed and comments.** They need a backend and moderation. A curated "Try a prompt" set gives the inspiration part without that.
- **Promo banners, countdowns, upsell toasts.** I'm excluding these on purpose; see improvement 3.
- **A 35-model catalogue.** A few honest options beat a long list of PREMIUM tags.

## UX improvements over Higgsfield (each grounded in research)
1. **Show the result before asking for anything.** Higgsfield's guest Generate shows an "In progress" card, but no generation request is sent, and after about 8s it becomes "Create an account to see generated image" (`research/screenshots/25-guest-generate-t01s.png`, `research/screenshots/26-guest-generate-t08s.png`, `research/evidence/guest-network.txt`). The logged-in user with no credits hits a full-screen paywall (`research/screenshots/11-generate-paywall-zero-credits.png`).
   → The clone generates for real with no login. If the provider fails, it shows an instant result clearly labelled **Demo**. A progress state appears only while a real request is running.
2. **Model choice by intent, with consequences visible.** Higgsfield's picker has 35 models with marketing one-liners. Cost only appears after you pick, and choosing a model silently removes or adds settings (`research/screenshots/05-model-picker.png`, `research/screenshots/18-recreate-loads-settings.png`, `research/ux-opportunities.md` §2).
   → A short list with "best for" and speed, and settings that are disabled with a tooltip instead of disappearing.
3. **A quiet workspace with history in it.** Higgsfield stacks a countdown bar, a credits toast and a promo banner above the core loop. About 8 of the 25 calls the workspace makes on load are promo or upsell. History sits in a separate Assets area (`research/screenshots/04-image-workspace-empty.png`, `research/screenshots/13-assets-empty-state.png`, `research/reverse-engineering.md` §5).
   → One calm workspace where results stack under the prompt box, with search, reuse and delete in place, and no promos.

## Provider decision (checked 2026-10-14)
- **Gemini API:** the pricing page lists the image models (Nano Banana 2 / 2 Lite / Pro) with paid per-image prices only, e.g. $0.0336 per 1K image for Flash Lite Image. The footnote says "Can be tested in Google AI Studio", and the rate-limits page lists image models only in paid tiers (https://ai.google.dev/gemini-api/docs/pricing, https://ai.google.dev/gemini-api/docs/rate-limits; `research/screenshots/30-gemini-pricing-image-models-2026-10-14.png`). **There is no free API tier for image generation, so Gemini is not used.**
- **Chosen: Pollinations, legacy keyless endpoint** (`https://image.pollinations.ai/prompt/{prompt}?width&height&seed&nologo=true`).
  - Tested 2026-10-14: HTTP 200, `image/jpeg`, about 5s for 512×512.
  - The EXIF data says the anonymous tier served model `sana`.
  - Needs no account, card or key.
  - The newer `gen.pollinations.ai` endpoint returns 401 without a key.
- **Limits and risks:**
  - Anonymous use is rate-limited and has no SLA.
  - The anonymous tier picks the model.
  - The legacy endpoint could be retired.
  - Mitigation: the server route times out after 45s, maps 429/5xx/timeouts to a typed error, and the client falls back to the labelled Demo result. The primary journey never dead-ends.
- **Not chosen:**
  - Cloudflare Workers AI: has a free daily allocation, but needs a new account and token.
  - Hugging Face Inference: free credits, but needs a new account and token.
  - Both would need your approval to create an account, and Pollinations removes that step.
