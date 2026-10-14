import type { AspectRatio, GenerationSettings } from "./schema";

/**
 * Product constants shared by the composer, the API route and the providers.
 * Everything a visitor can pick lives here, so adding a style or a model is a one-line change.
 */

export const PROMPT_MIN = 3;
export const PROMPT_MAX = 1000;
export const COUNT_MAX = 4;

/** The keyless free tier; every other model id belongs to the visitor's own Gemini key. */
export const FREE_MODEL = "free";
export const FREE_MODEL_LABEL = "Sana via Pollinations (free tier)";

export const ASPECT_RATIOS = ["1:1", "4:3", "3:4", "16:9", "9:16"] as const;
export const STYLE_IDS = ["none", "photo", "cinematic", "illustration", "3d", "anime"] as const;

export interface StyleOption {
  id: (typeof STYLE_IDS)[number];
  label: string;
  /** One-line answer to "when should I pick this?", shown in the style menu. */
  bestFor: string;
  /** Appended to the visitor's prompt; styles are prompt engineering, not a different model. */
  promptSuffix: string;
}

export const STYLES: StyleOption[] = [
  { id: "none", label: "No style", bestFor: "Full control: your prompt is sent as written", promptSuffix: "" },
  { id: "photo", label: "Photo", bestFor: "Products, food, portraits", promptSuffix: "photorealistic, natural light, 35mm photo, sharp focus" },
  { id: "cinematic", label: "Cinematic", bestFor: "Moody scenes and wide shots", promptSuffix: "cinematic still, dramatic lighting, anamorphic, color graded" },
  { id: "illustration", label: "Illustration", bestFor: "Editorial art, posters", promptSuffix: "detailed digital illustration, clean linework, rich color" },
  { id: "3d", label: "3D render", bestFor: "Objects, icons, isometric scenes", promptSuffix: "3D render, soft studio lighting, octane, high detail" },
  { id: "anime", label: "Anime", bestFor: "Characters and stylised worlds", promptSuffix: "anime key visual, cel shading, vibrant" },
];

/** Pixel sizes requested from the free provider; the long side is capped at 1024 to keep generation fast. */
export const ASPECTS: { id: AspectRatio; label: string; use: string; width: number; height: number }[] = [
  { id: "1:1", label: "Square", use: "Feed post, avatar", width: 1024, height: 1024 },
  { id: "4:3", label: "Classic", use: "Blog, slides", width: 1024, height: 768 },
  { id: "3:4", label: "Portrait", use: "Pinterest, print", width: 768, height: 1024 },
  { id: "16:9", label: "Wide", use: "YouTube, desktop", width: 1024, height: 576 },
  { id: "9:16", label: "Story", use: "Reels, TikTok, Stories", width: 576, height: 1024 },
];

/**
 * Gemini image models available with the visitor's own key.
 * Ids and prices from ai.google.dev/gemini-api/docs/image-generation and /pricing, checked 2026-10-14.
 */
export const GEMINI_MODELS = [
  { id: "gemini-3.1-flash-lite-image", label: "Nano Banana 2 Lite", hint: "Cheapest and fastest · ~$0.034 per 1K image" },
  { id: "gemini-3.1-flash-image", label: "Nano Banana 2", hint: "Balanced quality and speed · ~$0.067 per 1K image" },
  { id: "gemini-nano-banana-2.1", label: "Nano Banana 2.1", hint: "Google's newest flagship image model" },
  { id: "gemini-3-pro-image", label: "Nano Banana Pro", hint: "Highest fidelity and text rendering, slowest" },
];

export const DEFAULT_SETTINGS: GenerationSettings = { prompt: "", modelId: FREE_MODEL, styleId: "none", aspectRatio: "1:1", count: 1 };

export const styleById = (id: string) => STYLES.find((s) => s.id === id);
export const aspectById = (id: string) => ASPECTS.find((a) => a.id === id);

/** Short model name for result cards ("Free · Sana", "Nano Banana 2 Lite"). */
export function getModelShortLabel(modelId: string) {
  if (modelId === FREE_MODEL) return "Free · Sana";
  return GEMINI_MODELS.find((m) => m.id === modelId)?.label ?? "Gemini";
}

/** Full model name stored on a generation and shown in the result details. */
export function getModelLabel(modelId: string) {
  if (modelId === FREE_MODEL) return FREE_MODEL_LABEL;
  return `${getModelShortLabel(modelId)} (${modelId}) · your Gemini key`;
}

/**
 * Builds the prompt actually sent to a model: the visitor's text plus the chosen style's suffix.
 * Both providers call this, so a style means the same thing on every engine.
 */
export function buildPrompt(settings: GenerationSettings) {
  const suffix = styleById(settings.styleId)?.promptSuffix;
  return suffix ? `${settings.prompt}, ${suffix}` : settings.prompt;
}
