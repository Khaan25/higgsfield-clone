import { GenerationError, runSequentialBatch } from "@/lib/batch";
import { FREE_MODEL, getModelLabel } from "@/lib/catalog";
import { generatePollinationsImage } from "@/lib/pollinations";
import { settingsSchema, type GenerateError, type Generation } from "@/lib/schema";

export const maxDuration = 60;

const IMAGE_TIMEOUT_MS = 25_000;
// Leaves headroom under maxDuration even for a batch of 4.
const BATCH_BUDGET_MS = 50_000;

/**
 * Provider failures are an expected outcome (the client falls back to labelled Demo images), so they
 * return 200 with a typed `error` body: a 4xx/5xx would print a red "Failed to load resource" in every
 * visitor's console. Only malformed requests, which the composer already prevents, get a real 400.
 */
const respondWithError = (error: GenerateError) => Response.json({ error }, { status: error.kind === "invalid" ? 400 : 200 });

/**
 * POST /api/generate runs the free model for a batch of images.
 * Body: GenerationSettings. Response: `{ generation }` or `{ error }` (see generateResponseSchema).
 * Gemini (bring-your-own-key) never comes through here; it runs in the browser so the key stays there.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) return respondWithError({ kind: "invalid", message: parsed.error.issues[0].message });
  // The server only runs the free model, whatever the client sent.
  const settings = { ...parsed.data, modelId: FREE_MODEL };

  if (process.env.GENERATION_MODE === "demo") {
    return respondWithError({ kind: "provider_error", message: "Live generation is switched off on this deployment." });
  }

  try {
    const { images, notice } = await runSequentialBatch({
      count: settings.count,
      imageTimeoutMs: IMAGE_TIMEOUT_MS,
      budgetMs: BATCH_BUDGET_MS,
      generateImage: (timeoutMs) => generatePollinationsImage(settings, Math.floor(Math.random() * 1_000_000), timeoutMs),
    });
    const generation: Generation = {
      id: crypto.randomUUID(),
      settings,
      images,
      source: "live",
      model: getModelLabel(FREE_MODEL),
      createdAt: new Date().toISOString(),
      notice,
    };
    return Response.json({ generation });
  } catch (e) {
    if (e instanceof GenerationError) return respondWithError(e.info);
    throw e;
  }
}
