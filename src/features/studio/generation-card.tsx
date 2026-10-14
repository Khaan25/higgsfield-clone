"use client";

import { Download, RotateCcw, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getModelShortLabel, styleById } from "@/lib/catalog";
import type { GeneratedImage, Generation } from "@/lib/schema";
import { cn } from "@/lib/utils";
import { downloadImage } from "./download";

interface GenerationCardProps {
  /** The saved generation to show. */
  generation: Generation;

  /** Opens one of its images in the lightbox. */
  onOpenImage: (image: GeneratedImage) => void;

  /** Loads this generation's settings back into the composer. */
  onReuseSettings: () => void;

  /** Removes this generation from history. */
  onDelete: () => void;
}

/**
 * GenerationCard shows one request in the history feed: the prompt, a Live or Demo label (so sample images
 * are never mistaken for the visitor's own), the settings used, and the images with quick actions.
 */
export function GenerationCard({ generation, onOpenImage, onReuseSettings, onDelete }: GenerationCardProps) {
  const { settings, images, source } = generation;
  const isLive = source === "live";
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="rounded-3xl border bg-card/60 p-3 sm:p-4"
      data-testid="generation"
    >
      <header className="mb-3 flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm">{settings.prompt}</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <Badge variant={isLive ? "success" : "default"}>{isLive ? "Live" : "Demo"}</Badge>
            {isLive && <span>{getModelShortLabel(settings.modelId)} ·</span>}
            <span>{styleById(settings.styleId)?.label} ·</span>
            <span>{settings.aspectRatio} ·</span>
            <time dateTime={generation.createdAt}>{new Date(generation.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time>
          </p>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" aria-label="Reuse these settings" title="Reuse these settings" onClick={onReuseSettings}>
            <RotateCcw />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Delete generation" title="Delete generation" onClick={onDelete}>
            <Trash2 />
          </Button>
        </div>
      </header>
      {generation.notice && <p className="mb-3 rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">{generation.notice}</p>}
      <div className={cn("grid gap-2", images.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
        {images.map((image, i) => (
          <div key={image.id} className="group relative overflow-hidden rounded-2xl bg-muted">
            <button type="button" onClick={() => onOpenImage(image)} className="block w-full" aria-label={`Open image ${i + 1}`}>
              {/* eslint-disable-next-line @next/next/no-img-element -- data: URLs and demo assets; next/image can't optimise data URLs */}
              <img
                src={image.src}
                alt={settings.prompt}
                width={image.width}
                height={image.height}
                className="max-h-175 w-full object-contain transition duration-300 group-hover:brightness-110"
              />
            </button>
            <Button
              variant="secondary"
              size="icon"
              aria-label={`Download image ${i + 1}`}
              onClick={() => downloadImage(image, settings.prompt)}
              className="absolute top-2 right-2 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
            >
              <Download />
            </Button>
          </div>
        ))}
      </div>
    </motion.article>
  );
}
