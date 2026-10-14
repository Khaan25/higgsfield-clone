# Product overview: Higgsfield AI

Observed 2026-10-14. I used the user's logged-in Chrome profile (account with 0 credits) for the logged-in screens, and a fresh Playwright Chromium for the logged-out ones. Screenshots are in `screenshots/`.

## What it is
Higgsfield is an "AI-native creative suite": one workspace that wraps many third-party image, video and audio models behind a single credit system. The site's own tagline is "Commercial-ready visuals in seconds… every leading model at your fingertips" (`screenshots/03-image-landing.png`).

## Surface area (top nav, desktop)
The top nav has about 25 items (`screenshots/04-image-workspace-empty.png`): Explore, Image, Video, Audio, MCP, API, Genjutsu, Katana, AI Influencer, ChatGPT Plugin, Ads Studio, Effects, Cinema Studio, Contests, Marketing Studio, Supercomputer, 3D Jutsu, Edit, Academy, Community, Plugins, Canvas and Originals, plus Pricing, Enterprise and Assets.
- Several items carry "New" or "Top" badges.
- At 1518px wide the nav overflows: it is cut off at "Supe…" (`screenshots/02-home-explore.png`).

## Core loop (image)
1. Write a prompt.
2. Pick a model (35 options) and settings (aspect ratio, quality, resolution, batch count).
3. Generate. This costs credits; the price is shown on the button, e.g. "6.5" for GPT Image 2.
4. See the result in the feed.
5. Assets library.
6. Optionally Recreate, Turn to video, Download or Share.

Evidence: `screenshots/04-image-workspace-empty.png`, `screenshots/17-shot-detail-result-view.png`, `screenshots/18-recreate-loads-settings.png`.

## Business model
Credits plus subscriptions:
- Basic: $9/mo billed annually, 120 credits.
- Pro: $20, 600 credits.
- Max: $50, 1,800 credits.

Upsell pressure is heavy and everywhere:
- A yellow countdown discount bar.
- A "Credits are running low!" toast on every page.
- "50% OFF" badges.
- A full-screen paywall when you generate without credits.

Evidence: `screenshots/11-generate-paywall-zero-credits.png`, `screenshots/19-pricing.png`.

## Primary user
Creators and marketers making social and ad visuals and short video. Signals: AI Influencer, Ads Studio, Marketing Studio, community "Shots" with prompts you can copy.

## Key observations for scope
- The image workspace is the simplest complete loop, and every other tool reuses its prompt box (`screenshots/14-video-landing.png` has the same box with video settings).
- A logged-out visitor can type a prompt and press Generate. They get a fake "In progress" animation, then "Create an account to see generated image". No generation request is ever sent (`screenshots/24-desktop-generate-logged-out-gate.png`, `screenshots/28-guest-generate-t50s.png`, `evidence/guest-network.txt`).
