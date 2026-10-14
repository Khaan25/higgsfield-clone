import { z } from "zod";
import { ASPECT_RATIOS, COUNT_MAX, FREE_MODEL, PROMPT_MAX, PROMPT_MIN, STYLE_IDS } from "./catalog";

/**
 * Runtime contracts for everything Lumen receives from outside its own code:
 * request bodies on the server, API responses on the client, and anything read back from localStorage.
 * The TypeScript types are inferred from these schemas so the two can never drift apart.
 */

/**
 * The visitor's prompt, trimmed. The messages are shown verbatim under the prompt box,
 * so they are written as advice rather than as validation jargon.
 */
export const promptSchema = z
  .string()
  .trim()
  .min(1, "Describe the image you want first.")
  .min(PROMPT_MIN, `Add a little more detail (at least ${PROMPT_MIN} characters).`)
  .max(PROMPT_MAX, { error: (issue) => `Keep it under ${PROMPT_MAX} characters (now ${String(issue.input).length}).` });

export const aspectRatioSchema = z.enum(ASPECT_RATIOS, { error: "Unknown aspect ratio." });

/** Everything needed to reproduce a generation: what was asked for and with which settings. */
export const settingsSchema = z.object(
  {
    prompt: promptSchema,
    /** "free" runs on the server via Pollinations; any other value is a Gemini model id used with the visitor's own key. */
    modelId: z.string().min(1).default(FREE_MODEL),
    styleId: z.enum(STYLE_IDS, { error: "Unknown style." }),
    aspectRatio: aspectRatioSchema,
    count: z.number({ error: `Count must be 1-${COUNT_MAX}.` }).int().min(1).max(COUNT_MAX),
  },
  { error: "Request body must be a JSON object." },
);

/**
 * The half-typed composer state restored on reload. Unlike `settingsSchema` it accepts an empty or
 * unfinished prompt, and every field falls back to its default instead of failing, so a stale or
 * hand-edited draft can never block the app from starting.
 */
export const draftSchema = z.object({
  prompt: z.string().catch(""),
  modelId: z.string().min(1).catch(FREE_MODEL),
  styleId: z.enum(STYLE_IDS).catch("none"),
  aspectRatio: aspectRatioSchema.catch("1:1"),
  count: z.number().int().min(1).max(COUNT_MAX).catch(1),
});

export const generatedImageSchema = z.object({
  id: z.string(),
  /** A `data:` URL for live images (so history never depends on the provider staying up) or a `/demo/*` path. */
  src: z.string(),
  width: z.number(),
  height: z.number(),
  /** 0 when the provider has no seed concept (Gemini, demo images). */
  seed: z.number(),
});

/**
 * One finished request as stored in history. The `settings.prompt` is not re-validated here
 * because history should keep showing what was generated even if prompt rules tighten later.
 */
export const generationSchema = z.object({
  id: z.string(),
  settings: settingsSchema.extend({ prompt: z.string() }),
  images: z.array(generatedImageSchema).min(1),
  /** "demo" marks pre-generated sample images that were NOT generated from this prompt. */
  source: z.enum(["live", "demo"]),
  /** Human-readable model name shown in the result details. */
  model: z.string(),
  createdAt: z.string(),
  /** Explains partial batches or demo substitution to the visitor. */
  notice: z.string().optional(),
});

export const generateErrorSchema = z.object({
  /** `invalid` is the visitor's to fix in the form; every other kind is a provider problem. */
  kind: z.enum(["invalid", "auth", "rate_limited", "provider_error", "timeout"]),
  message: z.string(),
  /** Seconds the provider asked us to wait, when it said so. */
  retryAfter: z.number().optional(),
});

/** Body returned by `POST /api/generate`: exactly one of `generation` or `error`. */
export const generateResponseSchema = z.union([z.object({ generation: generationSchema }), z.object({ error: generateErrorSchema })]);

export type AspectRatio = z.infer<typeof aspectRatioSchema>;
export type GenerationSettings = z.infer<typeof settingsSchema>;
export type GeneratedImage = z.infer<typeof generatedImageSchema>;
export type Generation = z.infer<typeof generationSchema>;
export type GenerateError = z.infer<typeof generateErrorSchema>;
export type GenerateErrorKind = GenerateError["kind"];

/**
 * Returns the first problem with a prompt as a sentence for the composer, or null when it is usable.
 * The composer and the API route share it, so the visitor sees the same rule the server enforces.
 *
 * @param prompt - Raw text from the prompt box (untrimmed).
 * @returns The message to show under the prompt box, or null.
 */
export function getPromptError(prompt: string): string | null {
  const result = promptSchema.safeParse(prompt);
  return result.success ? null : result.error.issues[0].message;
}
