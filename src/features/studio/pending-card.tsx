"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { GenerationSettings } from "@/lib/schema";
import { ASPECT_BOX_CLASS } from "./aspect";

interface PendingCardProps {
  /** The request in flight; sets the placeholder count and shape. */
  settings: GenerationSettings;
}

/**
 * PendingCard is the honest loading state: real elapsed seconds and placeholders in the requested shape.
 * There is deliberately no fake percentage, since neither provider reports progress.
 */
export function PendingCard({ settings }: PendingCardProps) {
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(startedAt);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, []);

  const elapsedSeconds = Math.max(0, Math.floor((now - startedAt) / 1000));
  const isSlow = elapsedSeconds > 20;

  return (
    <article className="rounded-3xl border bg-card/60 p-3 sm:p-4" aria-busy="true" aria-label="Generating">
      <header className="mb-3 flex items-baseline justify-between gap-3">
        <p className="line-clamp-1 text-sm">{settings.prompt}</p>
        <p className="shrink-0 text-xs text-muted-foreground tabular-nums" role="status">
          Generating {settings.count > 1 ? `${settings.count} images` : "image"} · {elapsedSeconds}s
        </p>
      </header>
      <div className={cn("grid gap-2", settings.count > 1 ? "grid-cols-2" : "grid-cols-1")}>
        {Array.from({ length: settings.count }, (_, i) => (
          <Skeleton key={i} className={cn("max-h-150 w-full rounded-2xl", ASPECT_BOX_CLASS[settings.aspectRatio])} />
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Usually 5–20s per image. {isSlow && "The provider is slow right now. If it fails you'll get labelled sample images, never a dead end."}
      </p>
    </article>
  );
}
