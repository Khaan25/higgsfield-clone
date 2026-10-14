import { aspectById, buildPrompt, getModelLabel } from "../catalog";
import { GenerationError, runSequentialBatch } from "../batch";
import type { GenerateError, GeneratedImage, GenerationSettings } from "../schema";
import type { Generator } from ".";

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/interactions";
const IMAGE_TIMEOUT_MS = 90_000;
const BATCH_BUDGET_MS = 180_000;

/**
 * Finds the generated image in a Gemini Interactions response.
 * The REST shape isn't documented beyond the SDK's `output_image` helper, so this deliberately walks the
 * whole JSON and takes the last block with an `image/*` mime type and base64 `data`, accepting both
 * snake_case and camelCase field names. Unverified against a real key; mocked shapes are covered in e2e.
 *
 * @returns The image's mime type and base64 bytes, or null when the response has no image.
 */
export function findImage(json: unknown): { mime: string; data: string } | null {
  let found: { mime: string; data: string } | null = null;
  const walk = (value: unknown) => {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) return value.forEach(walk);
    const record = value as Record<string, unknown>;
    const mime = record.mime_type ?? record.mimeType;
    // The length check skips small metadata strings that happen to sit next to a mime type.
    if (typeof mime === "string" && mime.startsWith("image/") && typeof record.data === "string" && record.data.length > 100) {
      found = { mime, data: record.data };
    }
    Object.values(record).forEach(walk);
  };
  walk(json);
  return found;
}

/** Turns Google's HTTP error into a sentence the visitor can act on, quoting Google's own message. */
function toGenerateError(status: number, body: unknown): GenerateError {
  const googleMessage = (body as { error?: { message?: string } } | null)?.error?.message;
  const detail = googleMessage ? ` Google says: "${googleMessage}"` : "";
  if (status === 400 && /API key/i.test(googleMessage ?? "")) return { kind: "auth", message: `Gemini rejected this API key.${detail}` };
  if (status === 401 || status === 403) return { kind: "auth", message: `This key can't use that model.${detail}` };
  if (status === 429) {
    return { kind: "rate_limited", message: `Your key is out of quota for image generation (free-tier keys usually have none for image models).${detail}` };
  }
  if (status === 404) return { kind: "provider_error", message: `That model isn't available for this key.${detail}` };
  return { kind: "provider_error", message: `Gemini returned an error (${status}).${detail}` };
}

async function generateGeminiImage(apiKey: string, settings: GenerationSettings, signal: AbortSignal, timeoutMs: number): Promise<GeneratedImage> {
  const { width, height } = aspectById(settings.aspectRatio)!;
  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        model: settings.modelId,
        input: [{ type: "text", text: buildPrompt(settings) }],
        response_format: { type: "image", mime_type: "image/jpeg", aspect_ratio: settings.aspectRatio },
      }),
      // Stops on whichever comes first: the visitor pressing Stop, or the per-image timeout.
      signal: AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)]),
    });
  } catch (e) {
    // A visitor-initiated stop is not an error to report; let the caller see the abort.
    if (signal.aborted) throw e;
    const isTimeout = e instanceof Error && e.name === "TimeoutError";
    throw new GenerationError(isTimeout ? { kind: "timeout", message: "Gemini took too long to respond." } : { kind: "provider_error", message: "Could not reach Gemini." });
  }

  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) throw new GenerationError(toGenerateError(res.status, body));
  const image = findImage(body);
  if (!image) {
    throw new GenerationError({ kind: "provider_error", message: "Gemini answered without an image (the prompt may have been blocked by its safety filter)." });
  }
  return { id: crypto.randomUUID(), src: `data:${image.mime};base64,${image.data}`, width, height, seed: 0 };
}

/**
 * Bring-your-own-key generator. Runs in the browser and calls Google directly (CORS verified 2026-10-14),
 * so the visitor's key never reaches Lumen's server or logs. Failures are reported to the visitor
 * instead of being replaced by demo images, because a bad key or missing quota is theirs to fix.
 *
 * @param apiKey - The visitor's Gemini API key, or undefined when none is saved yet.
 */
export function createGeminiGenerator(apiKey: string | undefined): Generator {
  return {
    onFailure: "report",
    async generate(settings, signal) {
      if (!apiKey) throw new GenerationError({ kind: "auth", message: "Add your Gemini API key to use Gemini models." });
      const { images, notice } = await runSequentialBatch({
        count: settings.count,
        imageTimeoutMs: IMAGE_TIMEOUT_MS,
        budgetMs: BATCH_BUDGET_MS,
        generateImage: (timeoutMs) => generateGeminiImage(apiKey, settings, signal, timeoutMs),
      });
      return { id: crypto.randomUUID(), settings, images, source: "live", model: getModelLabel(settings.modelId), createdAt: new Date().toISOString(), notice };
    },
  };
}
