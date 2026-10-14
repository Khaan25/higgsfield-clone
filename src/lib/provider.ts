import { aspectById, buildPrompt } from "./catalog";
import type { GenerateError, GeneratedImage, GenerationSettings } from "./types";

const ENDPOINT = "https://image.pollinations.ai/prompt/";

export class ProviderError extends Error {
  constructor(public readonly info: GenerateError) {
    super(info.message);
  }
}

/** Server-only (imported by the API route). One image from the keyless Pollinations endpoint, returned as a data URL so the browser never calls the provider. */
export async function generateOne(s: GenerationSettings, seed: number, timeoutMs: number): Promise<GeneratedImage> {
  const { width, height } = aspectById(s.aspectRatio)!;
  const url = `${ENDPOINT}${encodeURIComponent(buildPrompt(s))}?width=${width}&height=${height}&seed=${seed}&nologo=true`;
  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs), cache: "no-store" });
  } catch (e) {
    const timedOut = e instanceof Error && e.name === "TimeoutError";
    throw new ProviderError(
      timedOut
        ? { kind: "timeout", message: "The image provider took too long to respond." }
        : { kind: "provider_error", message: "Could not reach the image provider." },
    );
  }
  // Observed 2026-10-14: the anonymous tier answers bursts with 402 (and 429 is the standard signal).
  if (res.status === 402 || res.status === 429) {
    const retryAfter = Number(res.headers.get("retry-after")) || undefined;
    throw new ProviderError({ kind: "rate_limited", message: "The free image provider is rate-limiting requests.", retryAfter });
  }
  const type = res.headers.get("content-type") ?? "";
  if (!res.ok || !type.startsWith("image/")) {
    throw new ProviderError({ kind: "provider_error", message: `The image provider returned an error (${res.status}).` });
  }
  const bytes = Buffer.from(await res.arrayBuffer());
  return { id: crypto.randomUUID(), src: `data:${type};base64,${bytes.toString("base64")}`, width, height, seed };
}
