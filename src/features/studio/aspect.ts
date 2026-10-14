import type { AspectRatio } from "@/lib/schema";

/**
 * Static Tailwind classes per aspect ratio. Written out in full (not built from strings) so Tailwind
 * can see them at build time and @shadcn/lint's require-static-classes rule can read them.
 */

/** Box shape for image placeholders and previews. */
export const ASPECT_BOX_CLASS: Record<AspectRatio, string> = {
  "1:1": "aspect-square",
  "4:3": "aspect-4/3",
  "3:4": "aspect-3/4",
  "16:9": "aspect-video",
  "9:16": "aspect-9/16",
};

/** Tiny outline drawn in the aspect-ratio menu so each option shows its shape at a glance. */
export const ASPECT_ICON_CLASS: Record<AspectRatio, string> = {
  "1:1": "size-3.5",
  "4:3": "h-2.5 w-3.5",
  "3:4": "h-3.5 w-2.5",
  "16:9": "h-2 w-3.5",
  "9:16": "h-3.5 w-2",
};
