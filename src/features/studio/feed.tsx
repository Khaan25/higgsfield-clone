"use client";

import { Download, RotateCcw, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { aspectById, getModelShortLabel, styleById } from "@/lib/catalog";
import { EXAMPLES } from "@/lib/generators";
import type { GeneratedImage, Generation, GenerationSettings } from "@/lib/schema";

export function downloadImage(img: GeneratedImage, prompt: string) {
  const a = document.createElement("a");
  a.href = img.src;
  a.download = `${prompt.slice(0, 40).replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "image"}-${img.seed}.jpg`;
  a.click();
}

export function EmptyState({ onPick }: { onPick: (prompt: string, aspectRatio: GenerationSettings["aspectRatio"]) => void }) {
  return (
    <section className="mx-auto max-w-3xl pt-6 text-center sm:pt-14" aria-labelledby="empty-title">
      <h1 id="empty-title" className="font-display text-3xl font-semibold tracking-tight sm:text-5xl">
        Type an idea. <span className="text-accent">Get an image.</span>
      </h1>
      <p className="mx-auto mt-3 max-w-md text-sm text-muted sm:text-base">No sign-up and no credits. Write a prompt below, or start from one of these.</p>
      <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {EXAMPLES.map((ex) => (
          <li key={ex.file}>
            <button
              type="button"
              onClick={() => onPick(ex.prompt, ex.aspectRatio)}
              className="group block w-full overflow-hidden rounded-2xl border border-line bg-surface text-left transition hover:border-accent/60"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/demo/${ex.file}`} alt="" className="aspect-square w-full object-cover transition duration-500 group-hover:scale-105" />
              <span className="line-clamp-2 block p-2.5 text-xs leading-snug text-muted group-hover:text-fg">{ex.prompt}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function PendingCard({ settings }: { settings: GenerationSettings }) {
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(startedAt);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);
  const secs = Math.max(0, Math.floor((now - startedAt) / 1000));
  const a = aspectById(settings.aspectRatio)!;
  return (
    <article className="rounded-3xl border border-line bg-surface/60 p-3 sm:p-4" aria-busy="true" aria-label="Generating">
      <header className="mb-3 flex items-baseline justify-between gap-3">
        <p className="line-clamp-1 text-sm text-fg/90">{settings.prompt}</p>
        <p className="shrink-0 text-xs tabular-nums text-muted" role="status">
          Generating {settings.count > 1 ? `${settings.count} images` : "image"} · {secs}s
        </p>
      </header>
      <div className={`grid gap-2 ${settings.count > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
        {Array.from({ length: settings.count }, (_, i) => (
          <div key={i} className="shimmer max-h-[60vh] w-full rounded-2xl" style={{ aspectRatio: `${a.width}/${a.height}` }} />
        ))}
      </div>
      <p className="mt-3 text-xs text-muted">
        Usually 5–20s per image on the free tier. {secs > 20 && "The provider is slow right now. If it fails you'll get labelled sample images, never a dead end."}
      </p>
    </article>
  );
}

export function GenerationCard({
  gen,
  onOpen,
  onReuse,
  onDelete,
}: {
  gen: Generation;
  onOpen: (img: GeneratedImage) => void;
  onReuse: () => void;
  onDelete: () => void;
}) {
  const style = styleById(gen.settings.styleId);
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="rounded-3xl border border-line bg-surface/60 p-3 sm:p-4"
      data-testid="generation"
    >
      <header className="mb-3 flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm text-fg">{gen.settings.prompt}</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
            {gen.source === "demo" ? (
              <span className="rounded-md bg-accent/15 px-1.5 py-0.5 font-semibold uppercase tracking-wide text-accent">Demo</span>
            ) : (
              <span className="rounded-md bg-emerald-400/10 px-1.5 py-0.5 font-semibold uppercase tracking-wide text-emerald-300">Live</span>
            )}
            {gen.source === "live" && (
              <>
                <span>{getModelShortLabel(gen.settings.modelId)}</span>·
              </>
            )}
            <span>{style?.label}</span>·<span>{gen.settings.aspectRatio}</span>·
            <time dateTime={gen.createdAt}>{new Date(gen.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time>
          </p>
        </div>
        <div className="flex gap-1">
          <IconButton label="Reuse these settings" onClick={onReuse}>
            <RotateCcw className="size-4" />
          </IconButton>
          <IconButton label="Delete generation" onClick={onDelete}>
            <Trash2 className="size-4" />
          </IconButton>
        </div>
      </header>
      {gen.notice && <p className="mb-3 rounded-xl bg-surface-2 px-3 py-2 text-xs text-muted">{gen.notice}</p>}
      <div className={`grid gap-2 ${gen.images.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
        {gen.images.map((img, i) => (
          <div key={img.id} className="group relative overflow-hidden rounded-2xl bg-surface-2">
            <button type="button" onClick={() => onOpen(img)} className="block w-full" aria-label={`Open image ${i + 1}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.src}
                alt={gen.settings.prompt}
                width={img.width}
                height={img.height}
                className="max-h-[70vh] w-full object-contain transition duration-300 group-hover:brightness-110"
              />
            </button>
            <button
              type="button"
              onClick={() => downloadImage(img, gen.settings.prompt)}
              aria-label={`Download image ${i + 1}`}
              className="absolute right-2 top-2 grid size-9 place-items-center rounded-xl bg-black/60 text-white opacity-100 backdrop-blur transition sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
            >
              <Download className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </motion.article>
  );
}

export function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="grid size-9 place-items-center rounded-xl text-muted transition hover:bg-surface-2 hover:text-fg"
    >
      {children}
    </button>
  );
}

