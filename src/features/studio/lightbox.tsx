"use client";

import { Check, Copy, Download, RotateCcw, Shuffle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { styleById } from "@/lib/catalog";
import type { GeneratedImage, Generation } from "@/lib/schema";
import { downloadImage } from "./download";

interface LightboxProps {
  /** The generation the image belongs to (prompt, settings, source). */
  generation: Generation;

  /** The image to show full size. */
  image: GeneratedImage;

  /** Called when the visitor closes the lightbox. */
  onClose: () => void;

  /** Loads this generation's settings into the composer. */
  onReuseSettings: () => void;

  /** Generates new images with the same settings. */
  onMakeVariations: () => void;
}

/**
 * Lightbox shows one image full size with everything needed to reuse it: the prompt (copyable), where it
 * came from, the model and seed, and actions for variations, reusing settings and downloading.
 * Demo images say plainly that they were not generated from this prompt.
 */
export function Lightbox({ generation, image, onClose, onReuseSettings, onMakeVariations }: LightboxProps) {
  const [isCopied, setIsCopied] = useState(false);
  const { settings, source } = generation;

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(settings.prompt);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1500);
    } catch {
      // Clipboard blocked by the browser: the prompt is still selectable in the panel.
    }
  };

  const details: [string, string][] = [
    ["Source", source === "demo" ? "Demo sample (not generated from this prompt)" : "Live generation"],
    ["Model", generation.model],
    ["Style", styleById(settings.styleId)?.label ?? "-"],
    ["Aspect", settings.aspectRatio],
    ["Size", `${image.width}×${image.height}`],
    ["Seed", source === "demo" || !image.seed ? "-" : String(image.seed)],
    ["Created", new Date(generation.createdAt).toLocaleString()],
  ];

  return (
    <Dialog open onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent variant="fullscreen">
        <div className="flex min-h-0 flex-1 items-center justify-center bg-background p-4 lg:p-8">
          {/* eslint-disable-next-line @next/next/no-img-element -- data: URLs can't go through next/image */}
          <img src={image.src} alt={settings.prompt} className="max-h-full max-w-full rounded-xl object-contain" />
        </div>
        <aside className="flex max-h-96 w-full shrink-0 flex-col gap-4 overflow-y-auto border-t p-5 lg:max-h-none lg:w-96 lg:border-t-0 lg:border-l">
          <DialogTitle>Image details</DialogTitle>
          <DialogDescription className="sr-only">Prompt, source and settings for this image, with actions to reuse it.</DialogDescription>
          <section className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Prompt</h3>
              <Button variant="ghost" size="xs" onClick={copyPrompt}>
                {isCopied ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}
                {isCopied ? "Copied" : "Copy"}
              </Button>
            </div>
            <p className="rounded-xl bg-muted p-3 text-sm leading-relaxed">{settings.prompt}</p>
          </section>
          <dl className="flex flex-col gap-1.5 text-sm">
            {details.map(([term, value]) => (
              <div key={term} className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{term}</dt>
                <dd className="text-right">{value}</dd>
              </div>
            ))}
          </dl>
          {/* Pinned to the bottom of the panel so the actions stay visible on small screens. */}
          <div className="sticky bottom-0 -mx-5 -mb-5 mt-auto grid grid-cols-2 gap-2 border-t bg-popover p-5 lg:static lg:m-0 lg:border-0 lg:p-0">
            <Button size="lg" className="col-span-2" onClick={onMakeVariations}>
              <Shuffle data-icon="inline-start" /> Make variations
            </Button>
            <Button size="lg" variant="outline" onClick={onReuseSettings}>
              <RotateCcw data-icon="inline-start" /> Reuse settings
            </Button>
            <Button size="lg" variant="outline" onClick={() => downloadImage(image, settings.prompt)}>
              <Download data-icon="inline-start" /> Download
            </Button>
          </div>
        </aside>
      </DialogContent>
    </Dialog>
  );
}
