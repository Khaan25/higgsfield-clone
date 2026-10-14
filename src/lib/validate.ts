import { aspectById, COUNT_MAX, PROMPT_MAX, PROMPT_MIN, styleById } from "./catalog";
import type { AspectRatio, GenerationSettings } from "./types";

/** Returns an error message, or null when the prompt is usable. Shared by the composer and the API. */
export function promptError(prompt: string): string | null {
  const p = prompt.trim();
  if (!p) return "Describe the image you want first.";
  if (p.length < PROMPT_MIN) return `Add a little more detail (at least ${PROMPT_MIN} characters).`;
  if (p.length > PROMPT_MAX) return `Keep it under ${PROMPT_MAX} characters (now ${p.length}).`;
  return null;
}

export function parseSettings(body: unknown): { ok: true; settings: GenerationSettings } | { ok: false; message: string } {
  if (!body || typeof body !== "object") return { ok: false, message: "Request body must be a JSON object." };
  const b = body as Record<string, unknown>;
  const prompt = typeof b.prompt === "string" ? b.prompt : "";
  const err = promptError(prompt);
  if (err) return { ok: false, message: err };
  if (typeof b.styleId !== "string" || !styleById(b.styleId)) return { ok: false, message: "Unknown style." };
  if (typeof b.aspectRatio !== "string" || !aspectById(b.aspectRatio)) return { ok: false, message: "Unknown aspect ratio." };
  const count = Number(b.count);
  if (!Number.isInteger(count) || count < 1 || count > COUNT_MAX) return { ok: false, message: `Count must be 1–${COUNT_MAX}.` };
  return { ok: true, settings: { prompt: prompt.trim(), styleId: b.styleId, aspectRatio: b.aspectRatio as AspectRatio, count } };
}
