"use client";

import { ExternalLink, KeyRound, ShieldCheck, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function KeyDialog({
  current,
  onSave,
  onClose,
}: {
  current: { key: string; remember: boolean } | null;
  onSave: (key: string | null, remember: boolean) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [key, setKey] = useState(current?.key ?? "");
  const [remember, setRemember] = useState(current?.remember ?? false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const k = key.trim();
    if (!k) return setError("Paste your Gemini API key first.");
    if (/\s/.test(k) || k.length < 20) return setError("That doesn't look like an API key. Copy it again from Google AI Studio.");
    onSave(k, remember);
    ref.current?.close();
  };

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
      aria-labelledby="key-title"
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-3xl border border-line bg-surface p-0 text-fg shadow-2xl backdrop:bg-black/70 backdrop:backdrop-blur-sm"
    >
      <form onSubmit={save} className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-accent/15 text-accent">
              <KeyRound className="size-4.5" aria-hidden />
            </span>
            <h2 id="key-title" className="font-display text-lg font-semibold">
              Use your own Gemini key
            </h2>
          </div>
          <button type="button" onClick={() => ref.current?.close()} aria-label="Close" className="grid size-9 place-items-center rounded-xl text-muted hover:bg-surface-2 hover:text-fg">
            <X className="size-5" />
          </button>
        </div>
        <p className="text-sm text-muted">
          Unlocks Google&apos;s Nano Banana image models. You pay Google directly at their per-image price. Image models need a key with billing enabled.
        </p>
        <div>
          <label htmlFor="gemini-key" className="mb-1.5 block text-sm font-medium">
            Gemini API key
          </label>
          <input
            id="gemini-key"
            type="password"
            autoComplete="off"
            spellCheck={false}
            value={key}
            onChange={(e) => {
              setKey(e.target.value);
              setError(null);
            }}
            placeholder="Paste your key"
            aria-invalid={!!error}
            aria-describedby="key-error"
            className="h-11 w-full rounded-xl border border-line bg-surface-2 px-3 font-mono text-sm placeholder:font-sans placeholder:text-muted/70 focus:border-accent/60 focus:outline-none"
          />
          <p id="key-error" className="mt-1.5 min-h-4 text-xs text-danger" aria-live="polite">
            {error}
          </p>
          <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-accent underline-offset-2 hover:underline">
            Get a key in Google AI Studio <ExternalLink className="size-3" aria-hidden />
          </a>
        </div>
        <label className="flex items-start gap-2.5 text-sm">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="mt-0.5 size-4 accent-[var(--accent)]" />
          <span>
            Remember on this device
            <span className="block text-xs text-muted">Off: the key is forgotten when you close this tab.</span>
          </span>
        </label>
        <p className="flex gap-2 rounded-xl bg-surface-2 p-3 text-xs text-muted">
          <ShieldCheck className="size-4 shrink-0 text-emerald-300" aria-hidden />
          Your key goes straight from this browser to Google. It is never sent to Lumen&apos;s server.
        </p>
        <div className="flex flex-wrap justify-end gap-2">
          {current && (
            <button
              type="button"
              onClick={() => {
                onSave(null, false);
                ref.current?.close();
              }}
              className="mr-auto h-10 rounded-xl px-3 text-sm text-danger hover:bg-danger/10"
            >
              Remove key
            </button>
          )}
          <button type="button" onClick={() => ref.current?.close()} className="h-10 rounded-xl border border-line px-4 text-sm hover:bg-surface-2">
            Cancel
          </button>
          <button type="submit" className="h-10 rounded-xl bg-accent px-4 text-sm font-semibold text-accent-fg hover:brightness-110">
            Save key
          </button>
        </div>
      </form>
    </dialog>
  );
}
