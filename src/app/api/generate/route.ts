import { LIVE_MODEL } from "@/lib/catalog";
import { generateOne, ProviderError } from "@/lib/provider";
import type { GenerateError, GeneratedImage, Generation } from "@/lib/types";
import { parseSettings } from "@/lib/validate";

export const maxDuration = 60;
const IMAGE_TIMEOUT_MS = 25_000;
const BUDGET_MS = 50_000; // stays under maxDuration even for a batch of 4

/**
 * Provider failures are an expected outcome (the client falls back to Demo), so they return 200 with a typed
 * `error` body: a 4xx/5xx would print a red "Failed to load resource" in every visitor's console.
 * Only malformed requests, which the composer already prevents, get a real 400.
 */
const fail = (error: GenerateError) => Response.json({ error }, { status: error.kind === "invalid" ? 400 : 200 });

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = parseSettings(body);
  if (!parsed.ok) return fail({ kind: "invalid", message: parsed.message });
  const { settings } = parsed;

  if (process.env.GENERATION_MODE === "demo") {
    return fail({ kind: "provider_error", message: "Live generation is switched off on this deployment." });
  }

  // Sequential on purpose: the anonymous provider tier rejects concurrent requests from one IP.
  const images: GeneratedImage[] = [];
  let lastError: GenerateError | undefined;
  const deadline = Date.now() + BUDGET_MS;
  for (let i = 0; i < settings.count; i++) {
    const remaining = deadline - Date.now();
    if (remaining < 5_000) {
      lastError = { kind: "timeout", message: "Ran out of time for the rest of the batch." };
      break;
    }
    try {
      images.push(await generateOne(settings, Math.floor(Math.random() * 1_000_000), Math.min(IMAGE_TIMEOUT_MS, remaining)));
    } catch (e) {
      if (!(e instanceof ProviderError)) throw e;
      lastError = e.info;
      break;
    }
  }
  if (!images.length) return fail(lastError!);

  const generation: Generation = {
    id: crypto.randomUUID(),
    settings,
    images,
    source: "live",
    model: LIVE_MODEL,
    createdAt: new Date().toISOString(),
    notice: images.length < settings.count ? `${images.length} of ${settings.count} generated. ${lastError?.message}` : undefined,
  };
  return Response.json({ generation });
}
