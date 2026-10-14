# Lumen Studio

**Type an idea, get an image, with no sign-up.** This is an 8x challenge rebuild of [Higgsfield](https://higgsfield.ai)'s image workspace, made in a tracked 24-hour window. It is *inspired by* Higgsfield, not a 1:1 copy.

- **Live:** https://higgsfield-clone-zeta.vercel.app
- **Repo:** https://github.com/Khaan25/higgsfield-clone (agent logs in [`.agent-logs/`](.agent-logs), capture proof in [`CAPTURE-TEST.md`](CAPTURE-TEST.md))

## Why this slice
Higgsfield's core loop (prompt, model, settings, generate, result) is good, but a new visitor never gets to finish it:
- A guest who presses Generate sees an "In progress" card, but **no generation request is sent**. About 8 seconds later it turns into "Create an account to see generated image".
- A signed-in user with no credits hits a full-screen paywall.

Lumen builds that one loop and makes it impossible to dead-end. Evidence and reasoning are in [`PRODUCT_STRATEGY.md`](PRODUCT_STRATEGY.md) and [`research/`](research).

## Features
- **Prompt composer** with validation (empty, under 3 characters, over 1000, with a live counter). Enter submits and Shift+Enter adds a new line. The draft is saved across reloads.
- **Model picker**:
  - **Free · Sana** via Pollinations' keyless endpoint. It needs no account.
  - **Bring your own Gemini key** for Nano Banana 2 Lite, Nano Banana 2, Nano Banana 2.1 and Nano Banana Pro. Each option shows its price and trade-off.
- **Style presets** that say what they're best for, **aspect ratios** with shape previews and use cases, and **1–4 images** per run.
- **Honest progress:** an elapsed-time counter and a Stop button. Progress only shows while a real request is running.
- **Labelled Demo fallback:** if the free provider is rate-limited, slow or down, you get real, pre-generated sample images marked **Demo**, with the reason and a "Retry live" button.
- **Result lightbox:**
  - prompt with Copy
  - source, model, style, size, seed and time
  - Make variations, Reuse settings, Download
- **History on this device:** search by prompt, reuse, download, delete, clear all. It survives reloads.
- **Responsive** layout with a dark theme, keyboard support (menus close on Escape or outside click and use arrow keys), visible focus states, and `prefers-reduced-motion` respected.

## Bring your own key (Gemini)
- Click **Use your Gemini key** and paste a key from [Google AI Studio](https://aistudio.google.com/apikey).
- The key is kept for this tab only, unless you tick "Remember on this device".
- Requests go **from your browser straight to Google**; the key never touches Lumen's server.
- Gemini image models need a key with billing enabled. Free-tier keys get a clear "out of quota" message rather than a broken state.

## Run locally
```bash
npm install
npm run dev            # http://localhost:3000
```
No environment variables are needed.

| Variable | Default | Effect |
|---|---|---|
| `GENERATION_MODE` | unset | `demo` switches off live generation; every request returns labelled demo images (used by e2e tests) |

## Checks
```bash
npm run typecheck && npm run lint && npm run build && npm run test:e2e
```
- `test:e2e` runs 8 Playwright tests at 1440×900 and 390×844 (16 runs) against a production build in demo mode. It covers navigation, validation, demo generation, the result view, history after reload, migration of corrupted or old saved history, the fallback banner and BYOK (with a mocked Google API). Every test fails on any unexpected console error.
- `lint` includes `@shadcn/lint`'s six design-system rules.
- The deployed URL check: `E2E_BASE_URL=https://higgsfield-clone-zeta.vercel.app npx playwright test e2e/production.spec.ts`

## Stack
Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · shadcn/ui (Radix) · zod · Motion · lucide-react · Playwright · `@shadcn/lint`. See [`ARCHITECTURE.md`](ARCHITECTURE.md).

Code layout:
- zod schemas are the single source of types and validate every untrusted input (the API body and localStorage).
- A generator factory gives the free, Gemini and demo engines one contract.
- The studio UI is composed from small shadcn-based parts, with state in hooks.

## Known limitations
- **The free provider is shared and rate-limited.** In testing, about every second burst request got HTTP 402/429. The Demo fallback covers this, but live results aren't guaranteed on the free model.
- **Free images carry a small "pollinations.ai" watermark** that the anonymous tier adds. The free model is `sana`; the anonymous tier ignores model selection.
- **The Gemini BYOK response parsing is unverified with a real key.** It is tested against mocked responses shaped like Google's docs.
- **History lives in `localStorage`** (about 5MB, roughly 40 images). The oldest entries are evicted when it's full, and nothing syncs across devices.
- **Not built, by choice:** video, uploads / image-to-image, community feed, accounts and billing. See the excluded list in `PRODUCT_STRATEGY.md`.
- **Higgsfield research limits:** real generation on Higgsfield wasn't tested (the account had 0 credits). See [`research/research-limitations.md`](research/research-limitations.md).

## Docs
- [`PRODUCT_STRATEGY.md`](PRODUCT_STRATEGY.md): questions, prioritisation, primary journey, exclusions, improvements
- [`ARCHITECTURE.md`](ARCHITECTURE.md): folder map, types, API route, provider, fallback, BYOK
- [`research/`](research): product overview, flows, feature inventory, design system, UX opportunities, reverse engineering, 38 screenshots
- [`WALKTHROUGH.md`](WALKTHROUGH.md): the 5-minute demo script
- [`PROGRESS.md`](PROGRESS.md): milestone log
