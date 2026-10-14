"use client";

import { ExternalLink, KeyRound, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { SavedApiKey } from "./use-api-key";

interface KeyDialogProps {
  /** The key saved now, if any; prefills the form and enables "Remove key". */
  currentKey: SavedApiKey | null;

  /** Saves the key (or clears it when passed null) with the visitor's remember choice. */
  onSave: (key: string | null, remember: boolean) => void;

  /** Called when the dialog closes, whether saved or cancelled. */
  onClose: () => void;
}

/**
 * KeyDialog lets a visitor bring their own Gemini key. It explains the cost model (Google bills them
 * directly), the privacy model (the key goes from the browser straight to Google), and how long the key
 * is kept, then does a light format check; Google itself is the real validator on first use.
 */
export function KeyDialog({ currentKey, onSave, onClose }: KeyDialogProps) {
  const [key, setKey] = useState(currentKey?.key ?? "");
  const [remember, setRemember] = useState(currentKey?.remember ?? false);
  const [error, setError] = useState<string | null>(null);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedKey = key.trim();
    if (!trimmedKey) return setError("Paste your Gemini API key first.");
    // Catches pasting the wrong thing (a URL, a sentence) without guessing Google's exact key format.
    if (/\s/.test(trimmedKey) || trimmedKey.length < 20) return setError("That doesn't look like an API key. Copy it again from Google AI Studio.");
    onSave(trimmedKey, remember);
    onClose();
  };

  return (
    <Dialog open onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <form onSubmit={save} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>
              <span className="flex items-center gap-2">
                <KeyRound className="text-primary" aria-hidden /> Use your own Gemini key
              </span>
            </DialogTitle>
            <DialogDescription>
              Unlocks Google&apos;s Nano Banana image models. You pay Google directly at their per-image price. Image models need a key with billing enabled.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field data-invalid={!!error || undefined}>
              <FieldLabel htmlFor="gemini-key">Gemini API key</FieldLabel>
              <Input
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
              />
              {error && <FieldError>{error}</FieldError>}
              <FieldDescription>
                <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1">
                  Get a key in Google AI Studio <ExternalLink className="size-3" aria-hidden />
                </a>
              </FieldDescription>
            </Field>
            <Field orientation="horizontal">
              <Checkbox id="remember-key" checked={remember} onCheckedChange={(checked) => setRemember(checked === true)} />
              <FieldContent>
                <FieldLabel htmlFor="remember-key">Remember on this device</FieldLabel>
                <FieldDescription>Off: the key is forgotten when you close this tab.</FieldDescription>
              </FieldContent>
            </Field>
          </FieldGroup>
          <p className="flex gap-2 rounded-xl bg-muted p-3 text-xs text-muted-foreground">
            <ShieldCheck className="size-4 shrink-0 text-success" aria-hidden />
            Your key goes straight from this browser to Google. It is never sent to Lumen&apos;s server.
          </p>
          <DialogFooter>
            {currentKey && (
              <Button
                type="button"
                variant="ghost"
                className="sm:mr-auto"
                onClick={() => {
                  onSave(null, false);
                  onClose();
                }}
              >
                Remove key
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save key</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
