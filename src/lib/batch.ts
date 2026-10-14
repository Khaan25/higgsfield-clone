import type { GenerateError, GeneratedImage } from "./schema";

/**
 * A provider failure the visitor should hear about. `info` is the safe, typed version that
 * crosses the network or reaches the UI; the provider's raw response never does.
 */
export class GenerationError extends Error {
  constructor(public readonly info: GenerateError) {
    super(info.message);
    this.name = "GenerationError";
  }
}

interface BatchOptions {
  /** How many images the visitor asked for (1-4). */
  count: number;
  /** Upper bound for one image, so a single stuck request cannot eat the whole budget. */
  imageTimeoutMs: number;
  /** Upper bound for the whole batch (Vercel functions stop at 60s). */
  budgetMs: number;
  /** Produces one image within `timeoutMs`; throws GenerationError on provider failure. */
  generateImage: (timeoutMs: number) => Promise<GeneratedImage>;
}

/**
 * Generates a batch one image at a time and keeps whatever succeeded.
 *
 * **Why sequential:** both providers punish bursts (the free tier answers parallel calls with 402,
 * Gemini with 429), so parallel requests would usually return fewer images, not faster ones.
 *
 * **Partial results:** the batch stops at the first failure or when the time budget runs low.
 * If at least one image exists the visitor gets it plus a `notice` explaining the shortfall;
 * only an empty batch is treated as a failure (the last error is rethrown).
 *
 * @returns The images produced and, for a short batch, a sentence explaining why.
 */
export async function runSequentialBatch({ count, imageTimeoutMs, budgetMs, generateImage }: BatchOptions) {
  const images: GeneratedImage[] = [];
  const deadline = Date.now() + budgetMs;
  let lastError: GenerateError | undefined;

  for (let i = 0; i < count; i++) {
    const remainingMs = deadline - Date.now();
    // Starting an image with only seconds left would just time out, so stop and keep what we have.
    if (remainingMs < 5_000) {
      lastError = { kind: "timeout", message: "Ran out of time for the rest of the batch." };
      break;
    }
    try {
      images.push(await generateImage(Math.min(imageTimeoutMs, remainingMs)));
    } catch (e) {
      if (!(e instanceof GenerationError)) throw e;
      lastError = e.info;
      break;
    }
  }

  if (!images.length) throw new GenerationError(lastError ?? { kind: "provider_error", message: "No image was generated." });
  const notice = images.length < count ? `${images.length} of ${count} generated. ${lastError?.message ?? ""}`.trim() : undefined;
  return { images, notice };
}
