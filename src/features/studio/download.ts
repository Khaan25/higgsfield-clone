import type { GeneratedImage } from "@/lib/schema";

/**
 * Saves an image with a readable file name built from its prompt (e.g. `a-lighthouse-on-a-cliff-528696.jpg`).
 * Works for both data URLs and same-origin demo paths without a server round-trip.
 */
export function downloadImage(image: GeneratedImage, prompt: string) {
  const slug = prompt.slice(0, 40).replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "image";
  const link = document.createElement("a");
  link.href = image.src;
  link.download = `${slug}-${image.seed}.jpg`;
  link.click();
}
