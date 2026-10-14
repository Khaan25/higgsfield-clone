"use client";

import { Check, Copy, Download, RotateCcw, Shuffle, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { styleById } from "@/lib/catalog";
import type { GeneratedImage, Generation } from "@/lib/types";
import { downloadImage } from "./feed";

export function Lightbox({
  gen,
  image,
  onClose,
  onReuse,
  onVary,
}: {
  gen: Generation;
  image: GeneratedImage;
  onClose: () => void;
  onReuse: () => void;
  onVary: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(gen.settings.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked: nothing to do */
    }
  };

  const rows: [string, string][] = [
    ["Source", gen.source === "demo" ? "Demo sample (not generated from this prompt)" : "Live generation"],
    ["Model", gen.model],
    ["Style", styleById(gen.settings.styleId)?.label ?? "-"],
    ["Aspect", gen.settings.aspectRatio],
    ["Size", `${image.width}×${image.height}`],
    ["Seed", gen.source === "demo" || !image.seed ? "-" : String(image.seed)],
    ["Created", new Date(gen.createdAt).toLocaleString()],
  ];

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
      aria-label="Image details"
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-black/90 p-0 text-fg backdrop:bg-black/80"
    >
      <div className="flex h-full flex-col lg:flex-row">
        <div className="relative flex min-h-0 flex-1 items-center justify-center p-4 lg:p-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.src} alt={gen.settings.prompt} className="max-h-full max-w-full rounded-xl object-contain" />
        </div>
        <aside className="flex max-h-[45dvh] w-full shrink-0 flex-col gap-4 overflow-y-auto border-t border-line bg-surface p-5 lg:max-h-none lg:w-96 lg:border-l lg:border-t-0">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Details</h2>
            <button type="button" onClick={() => ref.current?.close()} aria-label="Close" className="grid size-9 place-items-center rounded-xl hover:bg-surface-2">
              <X className="size-5" />
            </button>
          </div>
          <section>
            <div className="mb-1.5 flex items-center justify-between">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted">Prompt</h3>
              <button type="button" onClick={copy} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted hover:bg-surface-2 hover:text-fg">
                {copied ? <Check className="size-3.5 text-accent" /> : <Copy className="size-3.5" />} {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="rounded-xl bg-surface-2 p-3 text-sm leading-relaxed">{gen.settings.prompt}</p>
          </section>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            {rows.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-muted">{k}</dt>
                <dd className="text-right">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="sticky bottom-0 -mx-5 -mb-5 mt-auto grid grid-cols-2 gap-2 border-t border-line bg-surface p-5 lg:static lg:m-0 lg:border-0 lg:p-0">
            <button type="button" onClick={onVary} className="col-span-2 flex h-10 items-center justify-center gap-2 rounded-xl bg-accent text-sm font-semibold text-accent-fg hover:brightness-110">
              <Shuffle className="size-4" /> Make variations
            </button>
            <button type="button" onClick={onReuse} className="flex h-10 items-center justify-center gap-2 rounded-xl border border-line text-sm hover:bg-surface-2">
              <RotateCcw className="size-4" /> Reuse settings
            </button>
            <button type="button" onClick={() => downloadImage(image, gen.settings.prompt)} className="flex h-10 items-center justify-center gap-2 rounded-xl border border-line text-sm hover:bg-surface-2">
              <Download className="size-4" /> Download
            </button>
          </div>
        </aside>
      </div>
    </dialog>
  );
}
