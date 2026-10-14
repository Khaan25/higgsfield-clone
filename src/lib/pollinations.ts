import { aspectById, buildPrompt } from "./catalog";
import { GenerationError } from "./batch";
import type { GeneratedImage, GenerationSettings } from "./schema";

const ENDPOINT = "https://image.pollinations.ai/prompt/";

/**
 * Generates one image with Pollinations' keyless free tier. Server-only: the API route calls it.
 *
 * **Provider behavior observed 2026-10-14:** the anonymous tier always serves the `sana` model,
 * adds a small watermark, and answers bursts with HTTP 402 (429 is also handled as the standard
 * rate-limit signal). The image comes back as a `data:` URL so the browser never talks to the
 * provider and saved history keeps working if the provider's cache expires.
 *
 * @param settings - Validated generation settings.
 * @param seed - Random seed; different seeds give different images for the same prompt.
 * @param timeoutMs - Abort the request after this long.
 * @returns The image, sized from the chosen aspect ratio.
 * @throws GenerationError with kind `rate_limited`, `timeout` or `provider_error`.
 */
export async function generatePollinationsImage(settings: GenerationSettings, seed: number, timeoutMs: number): Promise<GeneratedImage> {
  const { width, height } = aspectById(settings.aspectRatio)!;
  const url = `${ENDPOINT}${encodeURIComponent(buildPrompt(settings))}?width=${width}&height=${height}&seed=${seed}&nologo=true`;

  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs), cache: "no-store" });
  } catch (e) {
    const isTimeout = e instanceof Error && e.name === "TimeoutError";
    throw new GenerationError(
      isTimeout
        ? { kind: "timeout", message: "The image provider took too long to respond." }
        : { kind: "provider_error", message: "Could not reach the image provider." },
    );
  }

  if (res.status === 402 || res.status === 429) {
    const retryAfter = Number(res.headers.get("retry-after")) || undefined;
    throw new GenerationError({ kind: "rate_limited", message: "The free image provider is rate-limiting requests.", retryAfter });
  }
  // A 200 with an HTML or JSON body is an error page, not an image.
  const contentType = res.headers.get("content-type") ?? "";
  if (!res.ok || !contentType.startsWith("image/")) {
    throw new GenerationError({ kind: "provider_error", message: `The image provider returned an error (${res.status}).` });
  }

  const bytes = Buffer.from(await res.arrayBuffer());
  return { id: crypto.randomUUID(), src: `data:${contentType};base64,${bytes.toString("base64")}`, width, height, seed };
}
