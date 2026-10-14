import { aspectById, buildPrompt, modelLabel } from "./catalog";
import type { GenerateError, GeneratedImage, Generation, GenerationSettings } from "./types";

/**
 * Bring-your-own-key generation. Runs in the browser and calls Google directly (CORS verified 2026-10-14),
 * so the visitor's key never reaches our server or logs.
 */
const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/interactions";
const TIMEOUT_MS = 90_000;

export class GeminiError extends Error {
  constructor(public readonly info: GenerateError) {
    super(info.message);
  }
}

/** The REST response shape isn't spelled out in the docs (SDKs expose `output_image`), so find the last image block anywhere in it. */
export function findImage(json: unknown): { mime: string; data: string } | null {
  let found: { mime: string; data: string } | null = null;
  const walk = (v: unknown) => {
    if (!v || typeof v !== "object") return;
    if (Array.isArray(v)) return v.forEach(walk);
    const o = v as Record<string, unknown>;
    const mime = (o.mime_type ?? o.mimeType) as unknown;
    if (typeof mime === "string" && mime.startsWith("image/") && typeof o.data === "string" && o.data.length > 100) {
      found = { mime, data: o.data };
    }
    Object.values(o).forEach(walk);
  };
  walk(json);
  return found;
}

function toError(status: number, body: unknown): GenerateError {
  const err = (body as { error?: { message?: string; status?: string } })?.error;
  const detail = err?.message ? ` Google says: “${err.message}”` : "";
  if (status === 400 && /API key/i.test(err?.message ?? "")) return { kind: "auth", message: `Gemini rejected this API key.${detail}` };
  if (status === 401 || status === 403) return { kind: "auth", message: `This key can't use that model.${detail}` };
  if (status === 429)
    return { kind: "rate_limited", message: `Your key is out of quota for image generation (free-tier keys usually have none for image models).${detail}` };
  if (status === 404) return { kind: "provider_error", message: `That model isn't available for this key.${detail}` };
  return { kind: "provider_error", message: `Gemini returned an error (${status}).${detail}` };
}

async function generateOne(key: string, s: GenerationSettings, signal: AbortSignal): Promise<GeneratedImage> {
  const { width, height } = aspectById(s.aspectRatio)!;
  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        model: s.modelId,
        input: [{ type: "text", text: buildPrompt(s) }],
        response_format: { type: "image", mime_type: "image/jpeg", aspect_ratio: s.aspectRatio },
      }),
      signal: AbortSignal.any([signal, AbortSignal.timeout(TIMEOUT_MS)]),
    });
  } catch (e) {
    if (signal.aborted) throw e;
    const timedOut = e instanceof Error && e.name === "TimeoutError";
    throw new GeminiError(
      timedOut ? { kind: "timeout", message: "Gemini took too long to respond." } : { kind: "provider_error", message: "Could not reach Gemini." },
    );
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new GeminiError(toError(res.status, body));
  const img = findImage(body);
  if (!img) throw new GeminiError({ kind: "provider_error", message: "Gemini answered without an image (the prompt may have been blocked by its safety filter)." });
  return { id: crypto.randomUUID(), src: `data:${img.mime};base64,${img.data}`, width, height, seed: 0 };
}

export async function generateWithGemini(key: string, s: GenerationSettings, signal: AbortSignal): Promise<Generation> {
  const images: GeneratedImage[] = [];
  let lastError: GenerateError | undefined;
  for (let i = 0; i < s.count; i++) {
    try {
      images.push(await generateOne(key, s, signal));
    } catch (e) {
      if (!(e instanceof GeminiError)) throw e;
      lastError = e.info;
      break;
    }
  }
  if (!images.length) throw new GeminiError(lastError!);
  return {
    id: crypto.randomUUID(),
    settings: s,
    images,
    source: "live",
    model: modelLabel(s.modelId),
    createdAt: new Date().toISOString(),
    notice: images.length < s.count ? `${images.length} of ${s.count} generated. ${lastError?.message}` : undefined,
  };
}
