"use client";

import { Code2, KeyRound, Search, X } from "lucide-react";
import Link from "next/link";
import { AnimatePresence, MotionConfig } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_SETTINGS, FREE_MODEL } from "@/lib/catalog";
import { createDemoGeneration as demoGeneration, createGenerator } from "@/lib/generators";
import { GenerationError } from "@/lib/batch";
import type { GenerateError, GeneratedImage, Generation, GenerationSettings } from "@/lib/schema";
import { getPromptError as promptError } from "@/lib/schema";
import { Composer } from "./composer";
import { EmptyState, GenerationCard, PendingCard } from "./feed";
import { KeyDialog } from "./key-dialog";
import { Lightbox } from "./lightbox";
import { loadDraft, loadHistory, loadApiKey, saveDraft, saveHistory, saveApiKey } from "./storage";

const REPO_URL = "https://github.com/Khaan25/higgsfield-clone";

interface Banner {
  tone: "demo" | "error";
  title: string;
  detail: string;
  retry?: GenerationSettings;
}

function fallbackBanner(err: GenerateError, settings: GenerationSettings): Banner {
  const why =
    err.kind === "rate_limited"
      ? "The free image provider is rate-limiting us right now."
      : err.kind === "timeout"
        ? "The free image provider timed out."
        : "Live generation isn't available right now.";
  return {
    tone: "demo",
    title: "Showing demo images",
    detail: `${why} These are labelled sample images, not generated from your prompt.${err.retryAfter ? ` Try again in about ${err.retryAfter}s.` : ""}`,
    retry: settings,
  };
}

export function Studio() {
  const [settings, setSettings] = useState<GenerationSettings>(DEFAULT_SETTINGS);
  const [history, setHistory] = useState<Generation[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [pending, setPending] = useState<{ settings: GenerationSettings } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<Banner | null>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<{ gen: Generation; image: GeneratedImage } | null>(null);
  const [apiKey, setApiKey] = useState<{ key: string; remember: boolean } | null>(null);
  const [keyDialog, setKeyDialog] = useState<{ pendingModel?: string } | null>(null);
  const abort = useRef<AbortController | null>(null);
  const promptRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Hydrate from localStorage after mount so server and client render the same first frame.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHistory(loadHistory());
    setApiKey(loadApiKey());
    const draft = loadDraft();
    if (draft) setSettings({ ...DEFAULT_SETTINGS, ...draft });
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveDraft(settings);
  }, [settings, hydrated]);

  const commitHistory = useCallback((next: Generation[]) => setHistory(saveHistory(next)), []);

  const update = (patch: Partial<GenerationSettings>) => {
    if (patch.modelId && patch.modelId !== FREE_MODEL && !apiKey) {
      setKeyDialog({ pendingModel: patch.modelId });
      return;
    }
    setSettings((s) => ({ ...s, ...patch }));
    if ("prompt" in patch) setError(null);
  };

  const focusPrompt = () => {
    promptRef.current = document.getElementById("prompt");
    promptRef.current?.focus();
  };

  const generate = async (s: GenerationSettings = settings) => {
    if (pending) return;
    const err = promptError(s.prompt);
    if (err) {
      setError(err);
      focusPrompt();
      return;
    }
    setError(null);
    setBanner(null);
    setQuery("");
    const controller = new AbortController();
    abort.current = controller;
    setPending({ settings: s });
    window.scrollTo({ top: 0, behavior: "smooth" });

    let result: Generation;
    const generator = createGenerator(s.modelId, { apiKey: apiKey?.key });
    try {
      result = await generator.generate(s, controller.signal);
    } catch (e) {
      if (controller.signal.aborted) return;
      const info: GenerateError = e instanceof GenerationError ? e.info : { kind: "provider_error", message: String(e) };
      if (info.kind === "invalid") {
        setError(info.message);
        return;
      }
      if (generator.onFailure === "report") {
        setBanner({ tone: "error", title: info.kind === "auth" ? "Gemini key problem" : "Gemini couldn't generate this", detail: info.message, retry: { ...s, modelId: FREE_MODEL } });
        return;
      }
      setBanner(fallbackBanner(info, s));
      result = demoGeneration(s, "Demo result: sample images, not generated from this prompt.");
    } finally {
      setPending(null);
      abort.current = null;
    }
    setHistory((h) => saveHistory([result, ...h]));
  };

  const reuse = (gen: Generation) => {
    setSettings({ ...DEFAULT_SETTINGS, ...gen.settings });
    setOpen(null);
    focusPrompt();
  };

  const remove = (id: string) => commitHistory(history.filter((g) => g.id !== id));

  const q = query.trim().toLowerCase();
  const visible = q ? history.filter((g) => g.settings.prompt.toLowerCase().includes(q)) : history;
  const showEmpty = hydrated && !history.length && !pending;

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-dvh flex-col">
        <header className="sticky top-0 z-20 border-b border-line/60 bg-bg/80 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
            <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
              <span className="grid size-7 place-items-center rounded-lg bg-accent text-accent-fg" aria-hidden>
                ✦
              </span>
              Lumen
            </Link>
            <span className="hidden text-xs text-muted sm:inline">AI image studio · inspired by Higgsfield</span>
            <button
              type="button"
              onClick={() => setKeyDialog({})}
              className="ml-auto flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-sm text-muted hover:text-fg"
            >
              <KeyRound className="size-4" aria-hidden />
              <span className="sm:hidden">{apiKey ? "Key" : "Add key"}</span>
              <span className="hidden sm:inline">{apiKey ? "Gemini key" : "Use your Gemini key"}</span>
              {apiKey && <span className="size-1.5 rounded-full bg-emerald-400" aria-label="(saved)" />}
            </button>
            <a href={REPO_URL} target="_blank" rel="noreferrer" aria-label="Source code on GitHub" className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-muted hover:text-fg">
              <Code2 className="size-4" aria-hidden />
              <span className="hidden sm:inline">Source</span>
            </a>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-72 pt-4">
          {banner && (
            <div
              role="status"
              data-testid={banner.tone === "demo" ? "fallback-banner" : "error-banner"}
              className={`mb-4 flex flex-wrap items-start gap-3 rounded-2xl border p-3 text-sm sm:items-center ${banner.tone === "demo" ? "border-accent/30 bg-accent/10" : "border-danger/40 bg-danger/10"}`}
            >
              {banner.tone === "demo" && <span className="rounded-md bg-accent px-1.5 py-0.5 text-xs font-bold uppercase text-accent-fg">Demo</span>}
              <p className="min-w-0 flex-1">
                <strong className="font-semibold">{banner.title}.</strong> <span className="text-fg/80">{banner.detail}</span>
              </p>
              {banner.tone === "error" && (
                <button type="button" onClick={() => setKeyDialog({})} className="rounded-lg border border-line px-3 py-1 text-xs font-semibold hover:bg-surface-2">
                  Update key
                </button>
              )}
              {banner.retry && (
                <button
                  type="button"
                  onClick={() => {
                    setSettings(banner.retry!);
                    generate(banner.retry);
                  }}
                  className="rounded-lg border border-accent/40 px-3 py-1 text-xs font-semibold text-accent hover:bg-accent/10"
                >
                  {banner.tone === "demo" ? "Retry live" : "Use free model instead"}
                </button>
              )}
              <button type="button" onClick={() => setBanner(null)} aria-label="Dismiss notice" className="text-muted hover:text-fg">
                <X className="size-4" />
              </button>
            </div>
          )}

          {showEmpty && <EmptyState onPick={(prompt, aspectRatio) => { update({ prompt, aspectRatio }); focusPrompt(); }} />}

          {history.length > 0 && (
            <div className="mb-4 flex items-center gap-3">
              <h2 className="whitespace-nowrap font-display text-lg font-semibold">Your images</h2>
              <span className="hidden text-xs text-muted sm:inline">{history.length} saved on this device</span>
              <label className="relative ml-auto w-44 sm:w-64">
                <span className="sr-only">Search your images by prompt</span>
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search prompts"
                  className="h-9 w-full rounded-xl border border-line bg-surface pl-8 pr-2 text-sm placeholder:text-muted/70 focus:border-accent/60 focus:outline-none"
                />
              </label>
            </div>
          )}

          <div className="flex flex-col gap-4">
            {pending && <PendingCard settings={pending.settings} />}
            <AnimatePresence initial={false}>
              {visible.map((gen) => (
                <GenerationCard
                  key={gen.id}
                  gen={gen}
                  onOpen={(image) => setOpen({ gen, image })}
                  onReuse={() => reuse(gen)}
                  onDelete={() => remove(gen.id)}
                />
              ))}
            </AnimatePresence>
            {q && !visible.length && (
              <p className="py-10 text-center text-sm text-muted">
                No images match “{query}”.{" "}
                <button type="button" className="text-accent underline-offset-2 hover:underline" onClick={() => setQuery("")}>
                  Clear search
                </button>
              </p>
            )}
          </div>

          {history.length > 1 && !q && (
            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={() => window.confirm("Delete all saved images on this device?") && commitHistory([])}
                className="text-xs text-muted underline-offset-2 hover:text-danger hover:underline"
              >
                Clear all history
              </button>
            </div>
          )}
        </main>

        <div className="fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-bg via-bg/90 to-transparent px-3 pb-3 pt-8 sm:pb-5">
          <div className="mx-auto max-w-3xl">
            <Composer settings={settings} onChange={update} onSubmit={() => generate()} onCancel={() => abort.current?.abort()} busy={!!pending} error={error} hasKey={!!apiKey} />
            <p className="mt-2 text-center text-[11px] text-muted/70">
              {settings.modelId === FREE_MODEL
                ? "Free model by Pollinations. When it is busy you get clearly labelled demo images instead."
                : "Generating with your Gemini key: billed by Google, sent from your browser straight to Google."}
            </p>
          </div>
        </div>

        {keyDialog && (
          <KeyDialog
            current={apiKey}
            onClose={() => setKeyDialog(null)}
            onSave={(key, remember) => {
              saveApiKey(key, remember);
              setApiKey(key ? { key, remember } : null);
              if (key && keyDialog.pendingModel) setSettings((s) => ({ ...s, modelId: keyDialog.pendingModel! }));
              if (!key) setSettings((s) => ({ ...s, modelId: FREE_MODEL }));
            }}
          />
        )}

        {open && (
          <Lightbox
            gen={open.gen}
            image={open.image}
            onClose={() => setOpen(null)}
            onReuse={() => reuse(open.gen)}
            onVary={() => {
              setOpen(null);
              setSettings(open.gen.settings);
              generate(open.gen.settings);
            }}
          />
        )}
      </div>
    </MotionConfig>
  );
}
