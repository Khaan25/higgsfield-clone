"use client";

import { MotionConfig } from "motion/react";
import { useState } from "react";
import { FREE_MODEL } from "@/lib/catalog";
import type { GeneratedImage, Generation } from "@/lib/schema";
import { Composer } from "./composer";
import { EmptyState } from "./empty-state";
import { StudioHeader } from "./header";
import { HistoryFeed } from "./history-feed";
import { KeyDialog } from "./key-dialog";
import { Lightbox } from "./lightbox";
import { StatusBanner } from "./status-banner";
import { useStudio } from "./use-studio";

/**
 * Studio is the whole app on one page. It only lays out the parts; all state and generation logic
 * lives in useStudio, so this file reads as the page's structure: header, notice, feed, docked composer,
 * and the two dialogs.
 */
export function Studio() {
  const studio = useStudio();
  const [selectedImage, setSelectedImage] = useState<{ generation: Generation; image: GeneratedImage } | null>(null);
  const { history } = studio;
  const isEmpty = history.isHydrated && !history.history.length && !studio.pendingSettings;

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-dvh flex-col">
        <StudioHeader hasApiKey={!!studio.apiKey} onOpenKeyDialog={studio.openKeyDialog} />

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-4 pb-72">
          {studio.notice && (
            <StatusBanner
              notice={studio.notice}
              onRetry={studio.retryFromNotice}
              onUpdateKey={studio.openKeyDialog}
              onDismiss={studio.dismissNotice}
            />
          )}
          {isEmpty && (
            <EmptyState
              onPickExample={(prompt, aspectRatio) => {
                studio.updateSettings({ prompt, aspectRatio });
                document.getElementById("prompt")?.focus();
              }}
            />
          )}
          <HistoryFeed
            history={history.history}
            pendingSettings={studio.pendingSettings}
            onOpenImage={(generation, image) => setSelectedImage({ generation, image })}
            onReuseSettings={studio.reuseSettings}
            onDelete={history.removeGeneration}
            onClearAll={history.clearHistory}
          />
        </main>

        <div className="fixed inset-x-0 bottom-0 z-20 bg-linear-to-t from-background via-background/90 to-transparent px-3 pt-8 pb-3 sm:pb-5">
          <div className="mx-auto max-w-3xl">
            <Composer
              settings={studio.settings}
              onSettingsChange={studio.updateSettings}
              onSubmit={() => studio.generate()}
              onCancel={studio.cancel}
              isGenerating={!!studio.pendingSettings}
              promptError={studio.promptError}
              hasApiKey={!!studio.apiKey}
            />
            <p className="mt-2 text-center text-xs text-muted-foreground">
              {studio.settings.modelId === FREE_MODEL
                ? "Free model by Pollinations. When it is busy you get clearly labelled demo images instead."
                : "Generating with your Gemini key: billed by Google, sent from your browser straight to Google."}
            </p>
          </div>
        </div>

        {studio.keyDialog && <KeyDialog currentKey={studio.apiKey} onSave={studio.saveKey} onClose={studio.closeKeyDialog} />}

        {selectedImage && (
          <Lightbox
            generation={selectedImage.generation}
            image={selectedImage.image}
            onClose={() => setSelectedImage(null)}
            onReuseSettings={() => {
              setSelectedImage(null);
              studio.reuseSettings(selectedImage.generation);
            }}
            onMakeVariations={() => {
              setSelectedImage(null);
              studio.generateVariations(selectedImage.generation);
            }}
          />
        )}
      </div>
    </MotionConfig>
  );
}
