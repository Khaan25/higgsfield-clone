import { aspectById } from "../catalog";
import type { AspectRatio, Generation, GenerationSettings } from "../schema";

type Shape = "square" | "landscape" | "portrait";

/**
 * Real images pre-generated with the live free provider (Pollinations / sana, 2026-10-14) and committed
 * to `public/demo`. They are what visitors see when live generation is unavailable, so the app never
 * dead-ends, and they double as the example prompts on the empty screen.
 */
export const DEMO_IMAGES: { file: string; shape: Shape; prompt: string }[] = [
  { file: "square-1.jpg", shape: "square", prompt: "A handmade ceramic teapot on a linen tablecloth, studio product photo, soft daylight" },
  { file: "square-2.jpg", shape: "square", prompt: "Portrait of an elderly fisherman with a knitted cap, film grain, overcast light" },
  { file: "square-3.jpg", shape: "square", prompt: "A bowl of ramen on a wooden counter, steam rising, top-down food photography" },
  { file: "square-4.jpg", shape: "square", prompt: "Isometric tiny greenhouse full of plants, soft pastel 3D render" },
  { file: "landscape-1.jpg", shape: "landscape", prompt: "A lighthouse on a cliff at golden hour, waves crashing, cinematic wide shot" },
  { file: "landscape-2.jpg", shape: "landscape", prompt: "Neon-lit Tokyo alley in the rain at night, reflections on wet asphalt" },
  { file: "landscape-3.jpg", shape: "landscape", prompt: "Misty pine forest at sunrise with a lone hiker, atmospheric landscape" },
  { file: "landscape-4.jpg", shape: "landscape", prompt: "A vintage red convertible on a desert highway, 1970s film photo" },
  { file: "portrait-1.jpg", shape: "portrait", prompt: "A woman in a yellow raincoat on a city street, shallow depth of field, editorial" },
  { file: "portrait-2.jpg", shape: "portrait", prompt: "A towering waterfall in a lush jungle canyon, vertical travel photo" },
  { file: "portrait-3.jpg", shape: "portrait", prompt: "Astronaut floating in a flower field, surreal dreamy illustration" },
  { file: "portrait-4.jpg", shape: "portrait", prompt: "A cozy bookshop interior with warm lamps, vertical shot, evening" },
];

/** One-click starting points on the empty screen. Their exact prompts map to their own demo image. */
export const EXAMPLES: { prompt: string; aspectRatio: AspectRatio; file: string }[] = [
  { prompt: DEMO_IMAGES[4].prompt, aspectRatio: "16:9", file: DEMO_IMAGES[4].file },
  { prompt: DEMO_IMAGES[2].prompt, aspectRatio: "1:1", file: DEMO_IMAGES[2].file },
  { prompt: DEMO_IMAGES[10].prompt, aspectRatio: "9:16", file: DEMO_IMAGES[10].file },
  { prompt: DEMO_IMAGES[5].prompt, aspectRatio: "16:9", file: DEMO_IMAGES[5].file },
];

const SHAPE_SIZE: Record<Shape, [number, number]> = { square: [1024, 1024], landscape: [1024, 576], portrait: [576, 1024] };

function getShape(aspectRatio: AspectRatio): Shape {
  const { width, height } = aspectById(aspectRatio)!;
  if (width === height) return "square";
  return width > height ? "landscape" : "portrait";
}

/**
 * FNV-1a string hash. It makes the same prompt always map to the same demo image,
 * which keeps the e2e tests and repeated demos stable.
 */
export function hashPrompt(text: string) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 0x01000193);
  return hash >>> 0;
}

/**
 * Builds a labelled Demo generation to stand in for a failed live request.
 *
 * **How images are picked:** only demo images with the same shape as the requested aspect ratio are
 * candidates. An example prompt gets its own image; any other prompt is hashed to a stable starting
 * image, and a batch takes the next images in that pool.
 *
 * @param settings - What the visitor asked for (kept so "Reuse settings" still works).
 * @param notice - Sentence shown on the card explaining these are samples, not their prompt.
 * @returns A Generation with `source: "demo"`.
 */
export function createDemoGeneration(settings: GenerationSettings, notice: string): Generation {
  const shape = getShape(settings.aspectRatio);
  const pool = DEMO_IMAGES.filter((d) => d.shape === shape);
  const exactIndex = pool.findIndex((d) => d.prompt === settings.prompt.trim());
  const startIndex = exactIndex >= 0 ? exactIndex : hashPrompt(settings.prompt.trim().toLowerCase()) % pool.length;
  const [width, height] = SHAPE_SIZE[shape];
  const id = `demo-${Date.now().toString(36)}`;
  return {
    id,
    settings,
    source: "demo",
    model: "Demo sample (pre-generated)",
    createdAt: new Date().toISOString(),
    notice,
    images: Array.from({ length: settings.count }, (_, i) => {
      const image = pool[(startIndex + i) % pool.length];
      return { id: `${id}-${i}`, src: `/demo/${image.file}`, width, height, seed: 0 };
    }),
  };
}
