import type { AspectRatio, GenerationSettings, StyleOption } from "./types";

export const PROMPT_MIN = 3;
export const PROMPT_MAX = 1000;
export const COUNT_MAX = 4;
export const LIVE_MODEL = "Sana via Pollinations (free tier)";

export const STYLES: StyleOption[] = [
  { id: "none", label: "No style", bestFor: "Full control: your prompt is sent as written", promptSuffix: "" },
  { id: "photo", label: "Photo", bestFor: "Products, food, portraits", promptSuffix: "photorealistic, natural light, 35mm photo, sharp focus" },
  { id: "cinematic", label: "Cinematic", bestFor: "Moody scenes and wide shots", promptSuffix: "cinematic still, dramatic lighting, anamorphic, color graded" },
  { id: "illustration", label: "Illustration", bestFor: "Editorial art, posters", promptSuffix: "detailed digital illustration, clean linework, rich color" },
  { id: "3d", label: "3D render", bestFor: "Objects, icons, isometric scenes", promptSuffix: "3D render, soft studio lighting, octane, high detail" },
  { id: "anime", label: "Anime", bestFor: "Characters and stylised worlds", promptSuffix: "anime key visual, cel shading, vibrant" },
];

export const ASPECTS: { id: AspectRatio; label: string; use: string; width: number; height: number }[] = [
  { id: "1:1", label: "Square", use: "Feed post, avatar", width: 1024, height: 1024 },
  { id: "4:3", label: "Classic", use: "Blog, slides", width: 1024, height: 768 },
  { id: "3:4", label: "Portrait", use: "Pinterest, print", width: 768, height: 1024 },
  { id: "16:9", label: "Wide", use: "YouTube, desktop", width: 1024, height: 576 },
  { id: "9:16", label: "Story", use: "Reels, TikTok, Stories", width: 576, height: 1024 },
];

export const DEFAULT_SETTINGS: GenerationSettings = { prompt: "", styleId: "none", aspectRatio: "1:1", count: 1 };

export const styleById = (id: string) => STYLES.find((s) => s.id === id);
export const aspectById = (id: string) => ASPECTS.find((a) => a.id === id);
