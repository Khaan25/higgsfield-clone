# UX opportunities

Each item cites what was observed. Ordered by the value to a first-time user.

## 1. Let people see a result before they commit
- **Observed:** a guest who presses Generate sees an "In progress" card for about 8s. It then turns into "Create an account to see generated image". No generation request is ever made (`screenshots/25-guest-generate-t01s.png`, `screenshots/26-guest-generate-t08s.png`, `evidence/guest-network.txt`). A logged-in user with no credits hits a full-screen paywall instead (`screenshots/11-generate-paywall-zero-credits.png`).
- **Friction:** the first-run promise ("generate for free") is broken twice, and the fake progress bar teaches users not to trust the loading state.
- **Clone:** no login. A real generation when the provider key and quota allow it. Otherwise an instant, clearly labelled **Demo** result, so the loop always closes. The progress state is only shown while a real request is running.

## 2. Model choice by intent, not by brand
- **Observed:** 35 models in two flat lists. Descriptions are marketing lines ("Exceptional quality, precise edits"), and most models are tagged PREMIUM. Cost is hidden until after selection, on the Generate button (`screenshots/05-model-picker.png`, `screenshots/06-model-picker-search.png`). Picking a model silently changes which settings exist: Nano Banana Pro drops Quality and adds Draw (`screenshots/18-recreate-loads-settings.png`).
- **Clone:** a small set of options, each with a "best for" line and a speed hint. Settings a model doesn't support are visibly disabled with a reason, not removed.

## 3. Settings that explain their trade-off
- **Observed:** the quality menu is good ("Low: Fastest And Cheapest"). But resolution and aspect ratio are bare values (`screenshots/07-aspect-ratio-menu.png`, `screenshots/08-quality-menu.png`). The quality menu also stayed open after an outside click while I tried to open the next menu (`screenshots/08-quality-menu.png`, observed once).
- **Clone:** aspect ratio shows a shape preview and a use case ("9:16 Story"). Menus close on outside click and Escape.

## 4. History is a first-class part of the workspace
- **Observed:** history lives in a separate "Assets" area with an empty state and a Projects / Favourites / Elements / Trash rail (`screenshots/13-assets-empty-state.png`). On the workspace itself, the feed area showed only a hero or spinner for this account (`screenshots/20-workspace-loading-draft-persisted.png`).
- **Clone:** results stack in the workspace feed under the prompt box, with search, reuse settings, download and delete in the same place. The empty state offers clickable example prompts instead of a marketing hero.

## 5. Reduce noise around the core loop
- **Observed:** about 25 nav items that overflow at 1518px. A countdown discount bar, a "Credits are running low!" toast and a promo banner were all on screen at once (`screenshots/02-home-explore.png`, `screenshots/04-image-workspace-empty.png`). On mobile, the cookie notice covers about 40% of the first screen (`screenshots/21-mobile-home-logged-out.png`).
- **Clone:** one nav with only the routes that exist, no promos, and a quiet one-line notice in demo mode.

## 6. Mobile parity
- **Observed:** mobile redirects to a different product, a chat-style agent at `/start/agent`, where settings sit behind a sliders icon (`screenshots/22-mobile-image-workspace-logged-out.png`).
- **Clone:** the same workspace, responsive. The settings row wraps or scrolls instead of disappearing.
