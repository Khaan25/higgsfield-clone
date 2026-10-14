# Product strategy

Higgsfield is a 25-tool creative suite. In 24 hours the clone can only be excellent at one loop. Research shows that the loop Higgsfield itself gates hardest is the one a first-time user cares about most: **type an idea, see an image, iterate.**

## Questions from the brief
The 8x brief has no numbered questions. It judges three things: **speed**, **product judgement** (what was built first and what was left out) and **UX/UI**. It also says explicitly: "we are not looking for just a clone… please do not just copy the UI 1:1". These seven questions follow from that.

1. **What is Higgsfield, and who is it for?**
   - It is a credit-based creative suite that wraps about 35 third-party image models, plus video, audio and "studio" tools, behind one prompt box (`research/product-overview.md`).
   - Its users are creators and marketers making social and ad visuals.
2. **What did using it end to end show?**
   - The core loop is good: prompt, model, settings, generate, result, recreate.
   - It is buried under upsell: a countdown bar, a credits toast, promo banners, and about 8 of the 25 workspace calls on load are promo endpoints.
   - It is gated twice. A guest gets a fake "In progress" card and then a sign-up wall. A logged-in user with 0 credits gets a paywall.
   - Evidence: `research/user-flows.md`, `research/reverse-engineering.md`. Real generation on Higgsfield was **not tested**, because the account had 0 credits and I chose not to pay (`research/research-limitations.md`).
3. **What did I build first, and why?**
   - The prompt → image loop, working with no account, because that is exactly what Higgsfield withholds from a first-time visitor and what a reviewer tries first.
   - Then I made it impossible to dead-end: a keyless free model, a labelled Demo fallback, and history that survives reload.
4. **What did I leave out, and why?** See "Deliberately excluded" below. Video, studios, uploads, community, accounts and billing are each a product of their own. None improves the first 60 seconds.
5. **Where is it better than the original?** The three improvements below:
   - a result before any commitment
   - model choice that states its consequences
   - a quiet workspace with history in place

   Plus **bring-your-own-key**: power users get Google's real Nano Banana models at Google's price, with the key never leaving their browser. That replaces Higgsfield's credit markup.
6. **Does it work for someone who isn't signed in as me?**
   - Yes, by construction. There is no auth.
   - The free model needs no key.
   - Every provider failure falls back to clearly labelled Demo images.
   - This is verified on the production URL in a fresh, unauthenticated Playwright context (M8).
7. **What would come next with more time?**
   - Image-to-image with uploads, the most-used Higgsfield feature I skipped.
   - A server-side gallery so results can be shared by link.
   - Video through a BYOK provider.

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
1. **Model and settings controls that explain themselves.**
   - Each model states its trade-off and its price ("Cheapest and fastest · ~$0.034 per 1K image"; "No key needed · shared free tier, can be rate-limited").
   - Styles say what they're best for.
   - Aspect ratios show a shape preview and a use case.
   - The same controls apply to every model, so nothing silently appears or disappears.
2. **History in the workspace.** Results persist across reloads (localStorage). History offers search by prompt, Reuse settings, Download and Delete.
3. **Result lightbox.** Full image, prompt with Copy, model / size / seed / created time, and Reuse, Download, Delete.
4. **Bring your own Gemini key** (added at the user's request). This unlocks real Gemini image models with honest per-image prices. The key goes from the browser straight to Google. Without a key the app is fully usable on the free model.

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
   → A short list where every option states its price and trade-off up front, and one control set shared by every model. Gemini models say up front that they need your key, and picking one opens the key dialog.
3. **A quiet workspace with history in it.** Higgsfield stacks a countdown bar, a credits toast and a promo banner above the core loop. About 8 of the 25 calls the workspace makes on load are promo or upsell. History sits in a separate Assets area (`research/screenshots/04-image-workspace-empty.png`, `research/screenshots/13-assets-empty-state.png`, `research/reverse-engineering.md` §5).
   → One calm workspace where results stack under the prompt box, with search, reuse and delete in place, and no promos.

## Provider decision (checked 2026-10-14)
- **Gemini API (now available through BYOK):** the pricing page lists the image models (Nano Banana 2 / 2 Lite / Pro) with paid per-image prices only, e.g. $0.0336 per 1K image for Flash Lite Image. The footnote says "Can be tested in Google AI Studio", and the rate-limits page lists image models only in paid tiers (https://ai.google.dev/gemini-api/docs/pricing, https://ai.google.dev/gemini-api/docs/rate-limits; `research/screenshots/30-gemini-pricing-image-models-2026-10-14.png`). **There is no free API tier for image generation, so Gemini can't be the default.** It is offered as bring-your-own-key instead (see `ARCHITECTURE.md`).
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
