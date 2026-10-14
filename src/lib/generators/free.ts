import { GenerationError } from "../batch";
import { generateResponseSchema } from "../schema";
import type { Generator } from ".";

/**
 * Keyless free generator. The browser asks Lumen's own `/api/generate`, which calls Pollinations
 * server-side. Failures fall back to labelled Demo images, because the visitor can't fix a busy
 * free tier and the primary journey must never dead-end.
 */
export function createFreeGenerator(): Generator {
  return {
    onFailure: "demo",
    async generate(settings, signal) {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(settings),
        signal,
      });
      const parsed = generateResponseSchema.safeParse(await res.json().catch(() => null));
      // Anything we can't read (a proxy error page, a deploy mid-flight) is treated as a provider problem.
      if (!parsed.success) throw new GenerationError({ kind: "provider_error", message: `Unexpected response from the server (${res.status}).` });
      if ("error" in parsed.data) throw new GenerationError(parsed.data.error);
      return parsed.data.generation;
    },
  };
}
