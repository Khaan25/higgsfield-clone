"use client";

import { ChevronDown, Cpu, Minus, Palette, Plus, Sparkles, Square } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { ASPECTS, COUNT_MAX, FREE_MODEL, GEMINI_MODELS, PROMPT_MAX, STYLES } from "@/lib/catalog";
import type { AspectRatio, GenerationSettings } from "@/lib/schema";
import { cn } from "@/lib/utils";
import { ASPECT_ICON_CLASS } from "./aspect";

interface SettingOption {
  id: string;
  label: string;
  /** Trade-off or use case shown under the label, so the visitor knows why they'd pick it. */
  hint: string;
  icon?: ReactNode;
}

interface SettingMenuProps {
  /** Accessible name prefix; the trigger reads as "<label>: <current option>". */
  label: string;

  /** Heading inside the open menu. */
  heading: string;

  /** Currently selected option id. */
  value: string;

  /** Options, in display order. */
  options: SettingOption[];

  /** Called with the chosen option id. */
  onValueChange: (id: string) => void;

  /** Icon shown in the trigger before the current option. */
  icon: ReactNode;
}

/**
 * SettingMenu is one pill in the composer: a single-choice menu where every option explains itself.
 * Built on Radix DropdownMenu for focus management, typeahead and Escape / outside-click closing.
 */
function SettingMenu({ label, heading, value, options, onValueChange, icon }: SettingMenuProps) {
  const current = options.find((o) => o.id === value);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="lg" aria-label={`${label}: ${current?.label}`}>
          {icon}
          {current?.label}
          <ChevronDown data-icon="inline-end" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-72">
        <DropdownMenuLabel>{heading}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={value} onValueChange={onValueChange}>
          {options.map((option) => (
            <DropdownMenuRadioItem key={option.id} value={option.id}>
              {option.icon}
              <span className="flex flex-col">
                <span>{option.label}</span>
                <span className="text-xs text-muted-foreground">{option.hint}</span>
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Outline of an aspect ratio, so the menu shows shapes rather than just numbers. */
function AspectIcon({ ratio }: { ratio: AspectRatio }) {
  return (
    <span className="grid size-4 place-items-center" aria-hidden>
      <span className={cn("rounded-xs border-2 border-current", ASPECT_ICON_CLASS[ratio])} />
    </span>
  );
}

interface ComposerProps {
  /** Current composer values. */
  settings: GenerationSettings;

  /** Applies a partial change (prompt, model, style, aspect ratio or count). */
  onSettingsChange: (patch: Partial<GenerationSettings>) => void;

  /** Starts a generation with the current settings. */
  onSubmit: () => void;

  /** Stops the generation in flight. */
  onCancel: () => void;

  /** True while a request is in flight; swaps Generate for Stop. */
  isGenerating: boolean;

  /** Prompt validation message, shown under the prompt box. */
  promptError: string | null;

  /** Whether a Gemini key is saved; Gemini options say "add your key" when it isn't. */
  hasApiKey: boolean;
}

/**
 * Composer is the docked prompt box: the prompt with a live character count, the model / style /
 * aspect-ratio menus, the image count stepper, and Generate (or Stop while a request runs).
 * Enter submits and Shift+Enter adds a new line.
 */
export function Composer({ settings, onSettingsChange, onSubmit, onCancel, isGenerating, promptError, hasApiKey }: ComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const promptLength = settings.prompt.trim().length;
  const isOverLimit = promptLength > PROMPT_MAX;

  // Grow with the prompt up to about six lines, then scroll.
  useEffect(() => {
    const el = textareaRef.current;
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
      className="rounded-3xl border bg-card/95 p-3 shadow-2xl backdrop-blur sm:p-4"
      aria-label="Image prompt"
    >
      <label htmlFor="prompt" className="sr-only">
        Describe your image
      </label>
      <Textarea
        id="prompt"
        ref={textareaRef}
        rows={2}
        value={settings.prompt}
        onChange={(e) => onSettingsChange({ prompt: e.target.value })}
        onKeyDown={(e) => {
          // isComposing: don't submit while an IME (e.g. Japanese input) is still composing a word.
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            onSubmit();
          }
        }}
        placeholder="Describe an image… e.g. a lighthouse on a cliff at golden hour"
        aria-invalid={!!promptError || isOverLimit}
        aria-describedby="prompt-help"
        variant="ghost"
      />
      <div id="prompt-help" className="flex min-h-5 items-center justify-between gap-3 px-1 pt-1 text-xs" aria-live="polite">
        <span className="text-destructive">{promptError}</span>
        <span className={cn("tabular-nums", isOverLimit ? "text-destructive" : promptLength > PROMPT_MAX * 0.9 ? "text-primary" : "text-muted-foreground")}>
          {promptLength}/{PROMPT_MAX}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <SettingMenu
          label="Model"
          heading={hasApiKey ? "Model" : "Model · Gemini needs your key"}
          value={settings.modelId}
          onValueChange={(modelId) => onSettingsChange({ modelId })}
          icon={<Cpu data-icon="inline-start" />}
          options={[
            { id: FREE_MODEL, label: "Free · Sana", hint: "No key needed · shared free tier, can be rate-limited" },
            ...GEMINI_MODELS.map((m) => ({ id: m.id, label: m.label, hint: hasApiKey ? m.hint : `${m.hint} · add your Gemini key` })),
          ]}
        />
        <SettingMenu
          label="Style"
          heading="Style · adds to your prompt"
          value={settings.styleId}
          onValueChange={(styleId) => onSettingsChange({ styleId: styleId as GenerationSettings["styleId"] })}
          icon={<Palette data-icon="inline-start" />}
          options={STYLES.map((s) => ({ id: s.id, label: s.label, hint: s.bestFor }))}
        />
        <SettingMenu
          label="Aspect ratio"
          heading="Aspect ratio"
          value={settings.aspectRatio}
          onValueChange={(id) => onSettingsChange({ aspectRatio: id as AspectRatio })}
          icon={<AspectIcon ratio={settings.aspectRatio} />}
          options={ASPECTS.map((a) => ({ id: a.id, label: `${a.id} · ${a.label}`, hint: a.use, icon: <AspectIcon ratio={a.id} /> }))}
        />
        <div className="flex items-center rounded-lg bg-secondary" role="group" aria-label="Number of images">
          <Button type="button" variant="ghost" size="icon-lg" aria-label="Fewer images" disabled={settings.count <= 1} onClick={() => onSettingsChange({ count: settings.count - 1 })}>
            <Minus />
          </Button>
          <span className="w-8 text-center text-sm tabular-nums" aria-live="polite">
            {settings.count}/{COUNT_MAX}
          </span>
          <Button type="button" variant="ghost" size="icon-lg" aria-label="More images" disabled={settings.count >= COUNT_MAX} onClick={() => onSettingsChange({ count: settings.count + 1 })}>
            <Plus />
          </Button>
        </div>

        <div className="ml-auto">
          {isGenerating ? (
            <Button type="button" variant="outline" size="lg" onClick={onCancel}>
              <Square data-icon="inline-start" className="fill-current" /> Stop
            </Button>
          ) : (
            <Button type="submit" size="lg">
              <Sparkles data-icon="inline-start" /> Generate
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
