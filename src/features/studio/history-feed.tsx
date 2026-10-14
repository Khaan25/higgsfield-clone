"use client";

import { Search } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import type { GeneratedImage, Generation, GenerationSettings } from "@/lib/schema";
import { GenerationCard } from "./generation-card";
import { PendingCard } from "./pending-card";

interface HistoryFeedProps {
  /** Saved generations, newest first. */
  history: Generation[];

  /** The request in flight, shown as a placeholder card at the top; null when idle. */
  pendingSettings: GenerationSettings | null;

  /** Opens an image in the lightbox. */
  onOpenImage: (generation: Generation, image: GeneratedImage) => void;

  /** Loads a generation's settings back into the composer. */
  onReuseSettings: (generation: Generation) => void;

  /** Removes one generation. */
  onDelete: (id: string) => void;

  /** Removes every saved generation on this device. */
  onClearAll: () => void;
}

/**
 * HistoryFeed keeps past results in the workspace (Higgsfield sends them to a separate Assets page):
 * a prompt search, the in-flight placeholder, the result cards, and a confirmed "clear all".
 */
export function HistoryFeed({ history, pendingSettings, onOpenImage, onReuseSettings, onDelete, onClearAll }: HistoryFeedProps) {
  const [query, setQuery] = useState("");
  const normalisedQuery = query.trim().toLowerCase();
  const visibleHistory = normalisedQuery ? history.filter((g) => g.settings.prompt.toLowerCase().includes(normalisedQuery)) : history;

  return (
    <section aria-label="Your images">
      {history.length > 0 && (
        <div className="mb-4 flex items-center gap-3">
          <h2 className="font-heading text-lg font-semibold whitespace-nowrap">Your images</h2>
          <span className="hidden text-xs text-muted-foreground sm:inline">{history.length} saved on this device</span>
          <InputGroup className="ml-auto w-44 sm:w-64">
            <InputGroupAddon>
              <Search aria-hidden />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              aria-label="Search your images by prompt"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search prompts"
            />
          </InputGroup>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {pendingSettings && <PendingCard settings={pendingSettings} />}
        <AnimatePresence initial={false}>
          {visibleHistory.map((generation) => (
            <GenerationCard
              key={generation.id}
              generation={generation}
              onOpenImage={(image) => onOpenImage(generation, image)}
              onReuseSettings={() => onReuseSettings(generation)}
              onDelete={() => onDelete(generation.id)}
            />
          ))}
        </AnimatePresence>
        {normalisedQuery && !visibleHistory.length && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No images match “{query}”.{" "}
            <Button variant="link" onClick={() => setQuery("")}>
              Clear search
            </Button>
          </p>
        )}
      </div>

      {history.length > 1 && !normalisedQuery && (
        <div className="mt-8 text-center">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="link" size="sm">
                Clear all history
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete all saved images?</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes {history.length} generations from this device. They are not stored anywhere else, so this can&apos;t be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep them</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={onClearAll}>
                  Delete all
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </section>
  );
}
