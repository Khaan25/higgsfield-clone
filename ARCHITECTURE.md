# Architecture: Lumen Studio

The app is one page: a Next.js 16 App Router workspace plus one server route. There is no database and no auth.

## Folder map
```
src/app/layout.tsx               fonts, metadata, dark theme
src/app/page.tsx                 renders <Studio/>
src/app/api/generate/route.ts    POST: validate → provider → typed result or typed error
src/features/studio/             the workspace (composer, settings, feed, lightbox, history store)
src/lib/                         shared and server-safe code: types, catalogue, validation, provider, demo
src/components/ui/               shadcn primitives actually used
public/demo/                     pre-generated real images for Demo mode
e2e/                             Playwright specs (desktop 1440×900, mobile 390×844)
```

## Types (`src/lib/types.ts`)
```ts
type AspectRatio = "1:1" | "4:3" | "3:4" | "16:9" | "9:16";
interface StyleOption { id: string; label: string; bestFor: string; promptSuffix: string }
interface GenerationSettings { prompt: string; styleId: string; aspectRatio: AspectRatio; count: 1|2|3|4 }
interface GeneratedImage { id: string; src: string; width: number; height: number; seed: number }
interface Generation {
  id: string; settings: GenerationSettings; images: GeneratedImage[];
  source: "live" | "demo"; model: string; createdAt: string;
  notice?: string;                // e.g. "2 of 4 generated. The provider is rate-limiting."
}
type GenerateError = { kind: "invalid" | "rate_limited" | "provider_error" | "timeout"; message: string; retryAfter?: number };
```
The plan named a `ModelOption` type. I replaced it with `StyleOption` because the free provider serves only one model (`sana`); see "Provider" below. A model picker whose choice changes nothing would be dishonest.

## Server route `POST /api/generate`
1. Parse the JSON and validate the body:
   - prompt is 3–1000 chars after trim
   - known style and aspect ratio
   - count is 1–4
   - Failure returns `400 {kind:"invalid"}`.
2. For i in 1..count, **one at a time** (the anonymous provider rate-limits concurrent calls), call the provider with a random seed and a 45s `AbortSignal.timeout`.
3. Any image succeeded: return `200 Generation` with `source:"live"`. The images are base64 `data:` URLs, so the browser never calls the provider and nothing goes stale. A partial batch sets `notice`.
4. None succeeded: return a typed error.
   - 402/429 → `rate_limited`, passing `Retry-After` through if present.
   - Other non-2xx or a non-image body → `provider_error`.
   - Abort → `timeout`.
   - Status is 429, 502 or 504.
5. `GENERATION_MODE=demo` forces demo mode (used by the e2e tests and as an escape hatch).

## Provider (`src/lib/provider.ts`)
- **Endpoint:** Pollinations' legacy keyless endpoint, `GET https://image.pollinations.ai/prompt/{encoded prompt + style suffix}?width&height&seed&nologo=true`. Checked 2026-10-14: anonymous use serves model `sana` only, and returns 402 under burst.
- **Image size:** the long side is 1024px; the short side comes from the aspect ratio.
- **No secret exists.** If a key-based provider is added later, it stays in this server module and never gets the `NEXT_PUBLIC_` prefix.

## Demo fallback (`src/lib/demo.ts` + `public/demo/`)
- **When it triggers:** `GENERATION_MODE=demo`, or any `GenerateError` except `invalid`.
- **Where it runs:** the client builds a `Generation` with `source:"demo"` from the bundled images:
  - `shape = square | landscape | portrait` from the aspect ratio
  - index = `hash(prompt) % N` within that shape, so the result is deterministic for the tests
- **Exact match:** if the prompt is one of the example prompts, its own image is used.
- **UI:**
  - The result card shows a **Demo** badge.
  - A banner explains why: "Live generation is rate-limited right now. Showing a sample image, not one generated from your prompt." It offers a Retry action.
- Validation errors never fall back to demo. They are shown inline.

## State and persistence
- `useStudio` (React state):
  - the settings draft
  - the in-flight request: one at a time, with an `AbortController`
  - the error or demo banner
  - lightbox selection
- `localStorage`:
  - `lumen:draft`: the composer draft, mirroring Higgsfield's `hf:image-form-upd`
  - `lumen:history`: `Generation[]`, newest first
- On `QuotaExceededError` the oldest generations are evicted until the write fits. Every access is wrapped in try/catch, and the app works without storage.
- History actions: search by prompt, Reuse settings, Download, Delete, Clear all.
