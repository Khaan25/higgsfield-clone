"use client";

import { Minus, Palette, Plus, Sparkles, Square } from "lucide-react";
import { useEffect, useRef } from "react";
import { Menu } from "@/components/ui/menu";
import { ASPECTS, COUNT_MAX, PROMPT_MAX, STYLES } from "@/lib/catalog";
import type { AspectRatio, GenerationSettings } from "@/lib/types";

function RatioIcon({ ratio }: { ratio: AspectRatio }) {
  const a = ASPECTS.find((x) => x.id === ratio)!;
  const scale = 14 / Math.max(a.width, a.height);
  return (
    <span className="grid size-4 place-items-center" aria-hidden>
      <span className="rounded-[3px] border-[1.5px] border-current" style={{ width: a.width * scale, height: a.height * scale }} />
    </span>
  );
}

export function Composer({
  settings,
  onChange,
  onSubmit,
  onCancel,
  busy,
  error,
}: {
  settings: GenerationSettings;
  onChange: (patch: Partial<GenerationSettings>) => void;
  onSubmit: () => void;
  onCancel: () => void;
  busy: boolean;
  error: string | null;
}) {
  const ta = useRef<HTMLTextAreaElement>(null);
  const len = settings.prompt.trim().length;
  const over = len > PROMPT_MAX;

  // Auto-grow up to ~6 lines.
  useEffect(() => {
    const el = ta.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [settings.prompt]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="rounded-3xl border border-line bg-surface/95 p-3 shadow-2xl shadow-black/50 backdrop-blur sm:p-4"
      aria-label="Image prompt"
    >
      <label htmlFor="prompt" className="sr-only">
        Describe your image
      </label>
      <textarea
        id="prompt"
        ref={ta}
        rows={2}
        value={settings.prompt}
        onChange={(e) => onChange({ prompt: e.target.value })}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            onSubmit();
          }
        }}
        placeholder="Describe an image… e.g. a lighthouse on a cliff at golden hour"
        aria-invalid={!!error || over}
        aria-describedby="prompt-help"
        className="block w-full resize-none bg-transparent px-1 text-[15px] leading-relaxed text-fg placeholder:text-muted/70 focus:outline-none"
      />
      <div id="prompt-help" className="flex min-h-5 items-center justify-between gap-3 px-1 pt-1 text-xs" aria-live="polite">
        <span className="text-danger">{error}</span>
        <span className={`tabular-nums ${over ? "text-danger" : len > PROMPT_MAX * 0.9 ? "text-accent" : "text-muted/60"}`}>
          {len}/{PROMPT_MAX}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Menu
          label="Style"
          heading="Style · adds to your prompt"
          value={settings.styleId}
          onChange={(styleId) => onChange({ styleId })}
          icon={<Palette className="size-4 text-muted" aria-hidden />}
          options={STYLES.map((s) => ({ id: s.id, label: s.label, hint: s.bestFor }))}
        />
        <Menu
          label="Aspect ratio"
          heading="Aspect ratio"
          value={settings.aspectRatio}
          onChange={(id) => onChange({ aspectRatio: id as AspectRatio })}
          icon={<RatioIcon ratio={settings.aspectRatio} />}
          options={ASPECTS.map((a) => ({ id: a.id, label: `${a.id} · ${a.label}`, hint: a.use, icon: <RatioIcon ratio={a.id} /> }))}
        />
        <div className="flex h-9 items-center rounded-xl border border-line bg-surface-2" role="group" aria-label="Number of images">
          <button
            type="button"
            aria-label="Fewer images"
            disabled={settings.count <= 1}
            onClick={() => onChange({ count: settings.count - 1 })}
            className="grid h-full w-8 place-items-center text-muted hover:text-fg disabled:opacity-30"
          >
            <Minus className="size-3.5" />
          </button>
          <span className="w-10 text-center text-sm tabular-nums" aria-live="polite">
            {settings.count}/{COUNT_MAX}
          </span>
          <button
            type="button"
            aria-label="More images"
            disabled={settings.count >= COUNT_MAX}
            onClick={() => onChange({ count: settings.count + 1 })}
            className="grid h-full w-8 place-items-center text-muted hover:text-fg disabled:opacity-30"
          >
            <Plus className="size-3.5" />
          </button>
        </div>

        <div className="ml-auto">
          {busy ? (
            <button
              type="button"
              onClick={onCancel}
              className="flex h-10 items-center gap-2 rounded-xl border border-line bg-surface-2 px-4 text-sm font-semibold text-fg hover:border-muted/40"
            >
              <Square className="size-3.5 fill-current" aria-hidden /> Stop
            </button>
          ) : (
            <button
              type="submit"
              className="flex h-10 items-center gap-2 rounded-xl bg-accent px-5 text-sm font-semibold text-accent-fg transition hover:brightness-110 active:scale-[0.98]"
            >
              <Sparkles className="size-4" aria-hidden /> Generate
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
