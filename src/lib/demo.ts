import { aspectById } from "./catalog";
import type { AspectRatio, Generation, GenerationSettings } from "./types";

type Shape = "square" | "landscape" | "portrait";

/** Real images pre-generated with the live provider (Pollinations / sana, 2026-10-14) and committed to public/demo. */
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

export const EXAMPLES: { prompt: string; aspectRatio: AspectRatio; file: string }[] = [
  { prompt: DEMO_IMAGES[4].prompt, aspectRatio: "16:9", file: DEMO_IMAGES[4].file },
  { prompt: DEMO_IMAGES[2].prompt, aspectRatio: "1:1", file: DEMO_IMAGES[2].file },
  { prompt: DEMO_IMAGES[10].prompt, aspectRatio: "9:16", file: DEMO_IMAGES[10].file },
  { prompt: DEMO_IMAGES[5].prompt, aspectRatio: "16:9", file: DEMO_IMAGES[5].file },
];

const SHAPE_SIZE: Record<Shape, [number, number]> = { square: [1024, 1024], landscape: [1024, 576], portrait: [576, 1024] };

function shapeOf(ar: AspectRatio): Shape {
  const a = aspectById(ar)!;
  return a.width === a.height ? "square" : a.width > a.height ? "landscape" : "portrait";
}

/** FNV-1a, so the same prompt always maps to the same demo image (stable e2e tests). */
export function hash(s: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
  return h >>> 0;
}

export function demoGeneration(settings: GenerationSettings, notice: string): Generation {
  const shape = shapeOf(settings.aspectRatio);
  const pool = DEMO_IMAGES.filter((d) => d.shape === shape);
  const exact = pool.findIndex((d) => d.prompt === settings.prompt.trim());
  const start = exact >= 0 ? exact : hash(settings.prompt.trim().toLowerCase()) % pool.length;
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
      const d = pool[(start + i) % pool.length];
      return { id: `${id}-${i}`, src: `/demo/${d.file}`, width, height, seed: 0 };
    }),
  };
}
