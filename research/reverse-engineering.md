# Reverse engineering: higgsfield.ai (public pages plus my own logged-in session)

Captured 2026-10-14.

**Tools used:**
- REA (`rea-agents@latest`, MIT, https://github.com/morluto/rea), attached over CDP to a separate, logged-out Chrome 155 profile on loopback port 9222. REA only observes; it never drives the page.
- Playwright request and console logging, from a fresh logged-out context.
- Claude-in-Chrome DevTools network reads, from the user's own logged-in tab.

**Evidence files:**
- `evidence/rea-summary.json`: REA evidence IDs, storage keys, route and endpoint candidates.
- `evidence/guest-network.txt`: logged-out request log and console errors.
- `screenshots/29-rea-cdp-capture-image-logged-out.png`: REA's CDP screenshot.

**Tags:**
- **CONFIRMED**: seen directly in a request, a storage key, a computed style or a screenshot.
- **INFERRED**: a reasoned guess from indirect signals.

**Scope:** public pages and the user's own session only. No auth bypass, no private API calls, no credits spent.

## 1. Frontend stack
| Finding | Tag | Evidence |
|---|---|---|
| React SPA | CONFIRMED | REA `vendor_fingerprint=React` (`evidence/rea-summary.json`) |
| TanStack Router, with chunk-reload recovery | CONFIRMED | sessionStorage keys `tanstack_router_reload:Failed to fetch dynamically imported module: …` and `tsr-*` (REA inspect `storage.session_storage_keys`) |
| TanStack Start server functions | INFERRED | request `GET /_serverFn/{id}` (`evidence/guest-network.txt`); the `/_serverFn/` path is TanStack Start's convention |
| Vite build; chunks served from `assets.higgsfield.ai/tanstack/assets/868a8dba-*.js` | CONFIRMED | REA `bundle_runtime=Vite` on 64 chunks; about 60 chunk URLs in `evidence/guest-network.txt` |
| A Next.js runtime fingerprint is also present | INFERRED (conflicting) | REA `vendor_fingerprint=Next.js (high)`. Likely an embedded or legacy bundle; the routing evidence above points to TanStack, not Next.js |
| i18n route manifests | CONFIRMED | `GET /_i18n/routes/en/*.json` |
| Auth: Clerk (Google One Tap / FedCM) | CONFIRMED | `clerk.higgsfield.ai/v1/client`, `clerk-js@6.32.1`, `accounts.google.com/gsi/*`; localStorage `__clerk_environment` |
| Analytics and observability: PostHog (proxied under `/api/i/`), Datadog RUM, Cloudflare | CONFIRMED | `/api/i/static/…/posthog-recorder.js`, `dd.higgsfield.ai/js`, `cloudflareinsights` beacon, `cdn-cgi/challenge-platform` |
| Toasts via react-toastify | CONFIRMED | `--toastify-*` CSS variables on `:root` |
| Fonts: Inter (UI) and Space Grotesk (display) | CONFIRMED | computed styles (`design-system.md`) |

## 2. Routing
| Finding | Tag | Evidence |
|---|---|---|
| Model selection lives in the query string (`/ai/image?model=gpt_image_2`, `?model=nano-banana-pro`) | CONFIRMED | tab URLs (`screenshots/04-image-workspace-empty.png`, `screenshots/18-recreate-loads-settings.png`) |
| Marketing landing and workspace are separate routes (`/ai-image` vs `/ai/image`) | CONFIRMED | navigation in `user-flows.md` F1 |
| Mobile visitors are redirected to a different app: `/` → `/explore`, `/ai/image` → `/start/agent?model=imagegen_2_0&mode=image` | CONFIRMED | Playwright final URLs (`screenshots/21-…`, `screenshots/22-…`) |
| Community shot detail is a query-param modal (`/community/generations?shot={uuid}`) | CONFIRMED | `screenshots/17-shot-detail-result-view.png` URL |
| Recreate carries the source model in the URL (`recreateModel`) | INFERRED | `recreateModel` literal among REA endpoint candidates |
| The 20 REA "route" candidates are Clerk FAPI paths (`/me/sessions/active`, `/client`…), not app routes | CONFIRMED | `evidence/rea-summary.json` `route_candidates` |

## 3. Page structure and components
| Finding | Tag | Evidence |
|---|---|---|
| Workspace page has 2,535 DOM nodes at idle (logged out) | CONFIRMED | REA inspect `dom.total_nodes` |
| Layout: top nav, feed or hero canvas, bottom-docked prompt card (radius 24px) with a pill row | CONFIRMED | computed styles + `screenshots/04-image-workspace-empty.png` |
| Model picker is a popover with search, two sections and tags | CONFIRMED | `screenshots/05-model-picker.png`, `screenshots/06-model-picker-search.png` |
| Settings components are rendered per model (Quality hidden and Draw shown for Nano Banana Pro) | CONFIRMED | `screenshots/18-recreate-loads-settings.png` vs `screenshots/04-image-workspace-empty.png` |
| Reference picker is a tabbed library modal with skeleton tiles | CONFIRMED | `screenshots/09-reference-picker-loading.png` |

## 4. State and persistence
| Finding | Tag | Evidence |
|---|---|---|
| The prompt form draft is persisted to localStorage (`hf:image-form-upd`) | CONFIRMED (key) / INFERRED (purpose) | REA `local_storage_keys`; the draft survived navigation (`screenshots/20-workspace-loading-draft-persisted.png`) |
| Auth and tab state in sessionStorage (`hf:tab-auth-state`, `hf:auth-sessions`) | CONFIRMED | REA `session_storage_keys` |
| Generation history is server-side (`/fnf/media`, `/fnf/media/status`, `/fnf/trash/library/count`) | CONFIRMED (requests) | logged-in DevTools read: `POST /fnf/media/status` 200, `GET /fnf/trash/library/count` 200 |

## 5. Public requests and API shape
API gateway: `https://fnf-api-gw.higgsfield.ai/fnf/*`.

| Finding | Tag | Evidence |
|---|---|---|
| Generation is job-based, with an endpoint per model family: `/jobs/text2image`, `/jobs/text2image-gpt`, `/jobs/text2image-soul`, `/jobs/text2image-soul/batch`, `/jobs/flux-kontext`, `/jobs/canvas` | CONFIRMED (string literals) / INFERRED (POST + polling) | REA `path_endpoint_candidates` |
| Prices come from the server before you generate (`/fnf/job-sets/costs`) | CONFIRMED | logged-out and logged-in requests, 200 |
| Uploads use S3-style multipart (`/uploads/multipart/init`, `/part-urls`, `/complete`, `/abort`) | CONFIRMED (literals) | REA endpoint candidates |
| The client handles rate limiting via the `Retry-After` header | CONFIRMED (literal) / INFERRED (behaviour) | `Retry-After` and `retry-after` among REA candidates |
| About 8 of the 25 calls the logged-in workspace makes on load are promo or upsell (`/two-day-offer`, `/user/personal-promo`, `/banner/settings`, `/subscriptions/bundle/unlim-catalog`, `/concurrent-boost-credits/state`, `/paid-concurrency-ab`, `/subscriptions/v2/plans`, `/feedback/nps`) | CONFIRMED | logged-in DevTools read, 2026-10-14 |
| Logged-out page calls `/fnf/workspaces/settings` and `/subscription` and gets 401 (5 console errors on every guest load) | CONFIRMED | `evidence/guest-network.txt` |

## 6. Loading and error states
| Finding | Tag | Evidence |
|---|---|---|
| Guest "In progress" card with a pixel-mosaic shimmer; **no generation request is sent**; after about 8s it turns into a sign-up wall | CONFIRMED | `screenshots/25-…`, `26-…`, `28-…`, request log |
| Zero-credit Generate opens a full-screen paywall; the prompt is kept | CONFIRMED | `screenshots/11-generate-paywall-zero-credits.png`, `screenshots/12-workspace-after-paywall-prompt-kept.png` |
| Feed loading shows a centred spinner; library loading shows skeleton tiles | CONFIRMED | `screenshots/20-…`, `screenshots/09-…` |
| Chunk-load failures trigger an automatic router reload | INFERRED | `tanstack_router_reload:*` session keys |
| Real job progress, failure and moderation states | NOT TESTED | 0 credits (`research-limitations.md`) |

## 7. What this means for the clone
- **Mirror:**
  - a job-style API (`POST /api/generate` returns a result or a typed error)
  - server-side prices and capabilities per model
  - query-param model selection
  - a draft persisted in localStorage
  - `Retry-After`-aware rate-limit handling
- **Do not mirror:** fake progress, auth before first value, promo calls on load.
