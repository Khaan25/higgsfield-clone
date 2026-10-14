import { FREE_MODEL } from "../catalog";
import type { Generation, GenerationSettings } from "../schema";
import { createFreeGenerator } from "./free";
import { createGeminiGenerator } from "./gemini";

/**
 * One way of turning settings into images. The studio only talks to this contract,
 * so adding an engine means adding a generator here, not another branch in the UI.
 */
export interface Generator {
  /**
   * Produces a generation or throws.
   * Throws GenerationError for provider problems; rethrows the abort when the visitor presses Stop.
   */
  generate(settings: GenerationSettings, signal: AbortSignal): Promise<Generation>;
  /**
   * What the studio does when `generate` fails with a provider error:
   * `demo` substitutes labelled sample images, `report` shows the error so the visitor can fix it.
   */
  onFailure: "demo" | "report";
}

/**
 * Picks the generator for a model id.
 *
 * @param modelId - `"free"` or a Gemini model id from the catalog.
 * @param options.apiKey - The visitor's Gemini key; only needed for Gemini models.
 */
export function createGenerator(modelId: string, options: { apiKey?: string } = {}): Generator {
  return modelId === FREE_MODEL ? createFreeGenerator() : createGeminiGenerator(options.apiKey);
}

export { createDemoGeneration, EXAMPLES } from "./demo";
