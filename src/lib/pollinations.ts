import { aspectById, buildPrompt } from "./catalog";
import { GenerationError } from "./batch";
import type { GeneratedImage, GenerationSettings } from "./schema";

const ENDPOINT = "https://image.pollinations.ai/prompt/";
const RETRY_DELAY_MS = 1_500;

/** One request to Pollinations; throws GenerationError with a visitor-safe message. */
async function requestImage(url: string, timeoutMs: number) {
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
  // Observed 2026-10-15: Pollinations answers 500 when its own Sana backend is overloaded (upstream 503).
  if (res.status >= 500) {
    throw new GenerationError({ kind: "provider_error", message: "The free image provider's backend is overloaded right now." });
  }
  // A 200 with an HTML or JSON body is an error page, not an image.
  const contentType = res.headers.get("content-type") ?? "";
  if (!res.ok || !contentType.startsWith("image/")) {
    throw new GenerationError({ kind: "provider_error", message: `The image provider returned an error (${res.status}).` });
  }
  return { bytes: Buffer.from(await res.arrayBuffer()), contentType };
}

/**
 * Generates one image with Pollinations' keyless free tier. Server-only: the API route calls it.
 *
 * **Provider behavior observed 2026-10-14/15:** the anonymous tier always serves the `sana` model,
 * adds a small watermark, answers bursts with HTTP 402, and intermittently returns 500 when its
 * backend is overloaded. Overload is usually gone within seconds, so it gets one retry when the time
 * allows; rate limits are not retried (retrying immediately only extends the limit).
 * The image comes back as a `data:` URL so the browser never talks to the provider.
 *
 * @param settings - Validated generation settings.
 * @param seed - Random seed; different seeds give different images for the same prompt.
 * @param timeoutMs - Total time allowed for this image, including the retry.
 * @returns The image, sized from the chosen aspect ratio.
 * @throws GenerationError with kind `rate_limited`, `timeout` or `provider_error`.
 */
export async function generatePollinationsImage(settings: GenerationSettings, seed: number, timeoutMs: number): Promise<GeneratedImage> {
  const { width, height } = aspectById(settings.aspectRatio)!;
  const url = `${ENDPOINT}${encodeURIComponent(buildPrompt(settings))}?width=${width}&height=${height}&seed=${seed}&nologo=true`;
  const deadline = Date.now() + timeoutMs;

  let image: { bytes: Buffer; contentType: string };
  try {
    image = await requestImage(url, timeoutMs);
  } catch (e) {
    const isOverload = e instanceof GenerationError && e.info.kind === "provider_error";
    const remainingMs = deadline - Date.now() - RETRY_DELAY_MS;
    // Only a backend hiccup is worth a second try, and only if there is time for a real attempt.
    if (!isOverload || remainingMs < 8_000) throw e;
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    image = await requestImage(url, remainingMs);
  }

  return { id: crypto.randomUUID(), src: `data:${image.contentType};base64,${image.bytes.toString("base64")}`, width, height, seed };
}
