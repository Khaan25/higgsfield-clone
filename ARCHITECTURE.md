# Architecture: Lumen Studio

The app is one page plus one server route. Built with Next.js 16 (App Router), React 19, Tailwind 4, shadcn/ui (Radix, `nova` style), zod and Motion. There is no database and no auth.

## Folder map
```
src/app/layout.tsx                 fonts (Inter, Sora), metadata, dark theme
src/app/page.tsx                   renders <Studio/>
src/app/api/generate/route.ts      POST: zod-validate → free provider batch → {generation} | {error}

src/lib/
  catalog.ts                       product constants: limits, styles, aspect ratios, Gemini models, buildPrompt
  schema.ts                        zod schemas = runtime contracts AND the TypeScript types (z.infer)
  batch.ts                         GenerationError + runSequentialBatch (one batch policy for every provider)
  pollinations.ts                  server-only free provider (keyless Pollinations → data URL)
  generators/                      factory: one Generator contract, one implementation per engine
    index.ts                       createGenerator(modelId, {apiKey}) → Generator {generate, onFailure}
    free.ts                        browser → /api/generate            onFailure: "demo"
    gemini.ts                      browser → Google (visitor's key)    onFailure: "report"
    demo.ts                        createDemoGeneration + EXAMPLES (pre-generated images in public/demo)
  utils.ts                         cn()

src/features/studio/               the workspace, by responsibility
  studio.tsx                       layout only: composes the parts below
  use-studio.ts                    state machine: settings, request, failure policy, retry, reuse
  use-history.ts / use-api-key.ts  persistence hooks
  storage.ts                       localStorage/sessionStorage with zod-validated reads
  header.tsx  status-banner.tsx  empty-state.tsx  history-feed.tsx  generation-card.tsx  pending-card.tsx
  composer.tsx                     prompt + SettingMenu (DropdownMenu radio) ×3 + count + Generate/Stop
  lightbox.tsx  key-dialog.tsx     shadcn Dialog
  aspect.ts  download.ts           static aspect classes, download helper

src/components/ui/                 shadcn-generated; Lumen variants marked "// Lumen:" (badge success,
                                   textarea ghost, empty-title hero, dialog-content fullscreen)
e2e/                               Playwright: studio.spec.ts (demo mode), production.spec.ts (deployed URL)
```

## Contracts (`src/lib/schema.ts`)
- **`settingsSchema` → `GenerationSettings`:** `{prompt, modelId, styleId, aspectRatio, count}`.
  - The prompt is trimmed and must be 3–1000 characters. Its error messages are the exact copy shown under the prompt box.
  - `styleId` and `aspectRatio` are closed enums from the catalog.
  - `count` is 1–4.
  - `modelId` defaults to `"free"`, which migrates history saved before the model picker existed.
- **`draftSchema`:** the composer draft. Each field `.catch()`es back to its default, so a stale draft can never block start-up.
- **`generationSchema` → `Generation`:** what history stores.
  - `source: "live" | "demo"`; demo images were not generated from the prompt.
  - `notice` explains partial batches or demo substitution.
- **`generateErrorSchema` → `GenerateError`:** `kind` is `invalid | auth | rate_limited | provider_error | timeout`, plus a visitor-safe `message` and an optional `retryAfter`.
- **`generateResponseSchema`:** `POST /api/generate` returns `{generation}` or `{error}`. The client parses it, so a proxy error page becomes a typed `provider_error`.

## Server route `POST /api/generate`
1. `settingsSchema.safeParse(body)`. Failure returns `400 {error: {kind: "invalid"}}`. The server forces `modelId: "free"`.
2. `GENERATION_MODE=demo` returns `200 {error: provider_error}` (used by e2e and as an escape hatch).
3. `runSequentialBatch` calls `generatePollinationsImage` with a 25s timeout per image and a 50s budget per batch (`maxDuration` is 60).
4. Success returns `200 {generation}`; a partial batch carries a `notice`. Provider failure returns `200 {error}`.

Provider failures are a 200 on purpose. The client handles them as an expected outcome (Demo fallback), and a 4xx/5xx would log a red console error for every visitor.

## Generator factory
`createGenerator(modelId, {apiKey})` returns a `Generator`. `useStudio` makes one dispatch call, then applies the generator's `onFailure` policy:
- **`free`** (`onFailure: "demo"`): the visitor can't fix a busy free tier, so they get labelled sample images plus a "Retry live" banner.
- **`gemini`** (`onFailure: "report"`): a bad key or missing quota is the visitor's to fix. They get a red banner with "Update key" and "Use free model instead".

Adding an engine means one new file in `generators/` and one branch in `createGenerator`; the UI doesn't change.

`runSequentialBatch` is shared by both live engines:
- One image at a time, because both providers punish bursts: 402 on the free tier, 429 on Gemini.
- It stops at the first failure or when the budget runs low.
- It keeps the partial results and only throws when nothing was produced.

## Providers
- **Free: Pollinations' keyless endpoint**, `GET https://image.pollinations.ai/prompt/{prompt + style}?width&height&seed&nologo=true`.
  - Checked 2026-10-14: anonymous use serves `sana` only, adds a watermark, and returns 402 under burst.
  - The image comes back as a `data:` URL, so the browser never calls the provider.
- **Bring your own key: Gemini Interactions API**, `POST https://generativelanguage.googleapis.com/v1beta/interactions`, called from the browser.
  - CORS was verified 2026-10-14, so the key never reaches our server.
  - The response shape isn't documented for REST, so `findImage()` takes the last `image/*` block with base64 `data`. This is unverified with a real key; the mocked shape is in e2e.

## Demo fallback
`createDemoGeneration(settings, notice)` picks pre-generated real images whose shape (square, landscape or portrait) matches the aspect ratio. An example prompt gets its own image; any other prompt maps to one by FNV-1a hash, so the result is deterministic for the tests. The result card shows a **Demo** badge, and the lightbox says "not generated from this prompt".

## State and persistence
- **`useStudio`** holds the settings draft, one in-flight request (with an `AbortController` for Stop), the prompt error, the status notice, and the key-dialog state.
- **localStorage keys:**
  - `lumen:draft`
  - `lumen:history` (newest first; the oldest entries are evicted on `QuotaExceededError`)
  - `lumen:gemini-key`, only when "Remember" is ticked
- **sessionStorage:** `lumen:gemini-key` by default.
- **Reads are validated with zod.** Invalid history entries are dropped and a bad draft falls back to defaults (covered by e2e).

## UI and lint conventions
- **Use shadcn components first.**
  - Menus are DropdownMenu with RadioGroup.
  - Overlays are Dialog and AlertDialog.
  - Notices are Alert, labels are Badge.
  - The first screen is Empty, loading is Skeleton.
  - Forms are Field, Input, InputGroup and Checkbox.
- **`@shadcn/lint`** (`eslint.config.mjs`, all six rules) applies to `src/**`, excluding the generated `src/components/ui`.
  - `no-restyle` allows layout classes only. A different look means a variant in `components/ui`, not a `className` override.
  - No raw colours, arbitrary values, inline styles or dynamic component classes.
- **Theme:** the Lumen palette is mapped onto shadcn semantic tokens in `globals.css` (dark only). Amber is `primary`, and `success` marks Live results.
