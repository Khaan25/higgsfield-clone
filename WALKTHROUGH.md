# Walkthrough script (camera on, under 5 minutes)

**The 8 points this covers.** The brief doesn't number them; they come from its judging criteria and hand-in checklist.
1. Camera on, under 5:00
2. The live link works for a signed-out visitor
3. The public repo, with `.agent-logs/`
4. How I approached the problem: research before code, not a 1:1 clone
5. What I built first, and why
6. What I left out, and why
7. UX/UI quality
8. Speed: how much works, and how I worked with the agent

Set-up before recording:
- Open a fresh incognito window on https://higgsfield-clone-zeta.vercel.app.
- Have Higgsfield's sign-up wall screenshot ready (`research/screenshots/compare-2-guest-generate.png`).
- Keep the repo tab open.

---

**0:00 to 0:30 · The moment (strongest first) [points 1, 2]**
*(Camera on. Incognito window, not signed in.)*
"This is Lumen, my 24-hour take on Higgsfield. I'm not signed in. I'll click an example and press Generate…" *(click the lighthouse example → Generate)* "…and there's a real image in a few seconds. No account, no credits.
That one interaction is the whole thesis, so let me show you why."

**0:30 to 1:20 · What I found on Higgsfield [point 4]**
*(Show `compare-2-guest-generate.png`.)*
"I used Higgsfield first and screenshotted every step. As a guest, pressing Generate shows an 'In progress' card. I recorded the network traffic: no generation request is ever sent. Eight seconds later it becomes 'Create an account to see generated image'.
Signed in with no credits, you get a full-screen paywall. About a third of the API calls the workspace makes on load are promo endpoints.
The core loop is good; it's just gated. So I didn't clone the UI. I rebuilt the loop, ungated."
*(Optional: flash `research/reverse-engineering.md`. I used REA and DevTools, and each finding is tagged confirmed or inferred.)*

**1:20 to 2:40 · The product [points 5, 7]**
*(Back in Lumen.)*
- "**Settings explain themselves.** Every model states its price and trade-off. Styles say what they're best for, and aspect ratios show a shape and a use case: 9:16 is 'Reels, Stories'." *(Open the Model, Style and Aspect menus. Escape closes them.)*
- "**Honest progress.** A real timer and a Stop button, never a fake bar." *(Generate 2 images.)*
- "**When the free provider is busy,** and it's rate-limited, you don't hit a wall. You get real sample images clearly marked **Demo**, with the reason and a Retry button." *(If a Demo result appears naturally, point at it; otherwise show `compare-5-provider-busy.png`.)*
- "**Click any image:** the prompt with Copy, the model, seed and size, then Make variations, Reuse settings or Download." *(Open the lightbox and press Reuse settings.)*
- "**History lives in the workspace.** Search it, reload the page, and it's still there." *(Search, then reload.)*
- *(Resize to mobile or show `compare-4-mobile.png`.)* "Same workspace on a phone. Higgsfield sends mobile users to a different app."

**2:40 to 3:20 · Bring your own key [points 5, 7]**
*(Click "Use your Gemini key".)*
"Power users can paste their own Gemini key and get Google's Nano Banana models at Google's price instead of a credit markup.
The key stays in this tab unless you opt in to remembering it, and the request goes from the browser straight to Google; my server never sees it. A bad or quota-less key gets a fixable error, not a dead end." *(Don't paste a real key on camera.)*

**3:20 to 4:00 · What I left out [point 6]**
*(Show the "Deliberately excluded" section of `PRODUCT_STRATEGY.md`.)*
"I left out video, uploads, the community feed, accounts and billing on purpose. Each is a product on its own, and none improves a first-time visitor's first minute. Image-to-image would be next."

**4:00 to 4:45 · Speed and how I worked [points 3, 8]**
*(Show the GitHub repo, then `.agent-logs/`, then `git log`.)*
- "The repo is public. Every prompt and response with the agent is captured automatically by hooks into `.agent-logs`, and committed alongside the code it produced. `CAPTURE-TEST.md` shows the setup was verified before any app code."
- "The order of the work was: capture gate, research, reverse engineering, strategy, then build.
  - I changed course when the free provider turned out to serve only one model: I swapped a fake model picker for honest styles.
  - I made fallbacks return typed responses, so visitors never see console errors."
- "There are 14 Playwright tests across desktop and mobile, plus a production check on the live URL."

**4:45 to 5:00 · Close**
"So: a real image in seconds with no sign-up, honest about what's live and what's a demo, and it gets better if you bring your own key. Links are in the submission. Thanks."
