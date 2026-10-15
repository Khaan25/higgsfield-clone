"use client";

import { useEffect, useRef, useState } from "react";
import { GenerationError } from "@/lib/batch";
import { DEFAULT_SETTINGS, FREE_MODEL } from "@/lib/catalog";
import { createDemoGeneration, createGenerator } from "@/lib/generators";
import { getPromptError, type GenerateError, type Generation, type GenerationSettings } from "@/lib/schema";
import { loadDraft, saveDraft } from "./storage";
import { useApiKey } from "./use-api-key";
import { useHistory } from "./use-history";

/** The notice above the feed after a failed live request. */
export interface StatusNotice {
  /** `demo`: we substituted sample images. `error`: the visitor has to fix something (their Gemini key). */
  tone: "demo" | "error";
  title: string;
  detail: string;
  /** Settings for the banner's retry button: the same request for `demo`, the free model for `error`. */
  retrySettings: GenerationSettings;
}

const DEMO_CARD_NOTICE = "Demo result: sample images, not generated from this prompt.";

/** Explains, in the visitor's terms, why they are looking at demo images instead of their own. */
function createDemoNotice(error: GenerateError, settings: GenerationSettings): StatusNotice {
  const reason =
    error.kind === "rate_limited"
      ? "The free image provider is rate-limiting us right now."
      : error.kind === "timeout"
        ? "The free image provider timed out."
        : error.message || "Live generation isn't available right now.";
  const retryHint = error.retryAfter ? ` Try again in about ${error.retryAfter}s.` : "";
  return {
    tone: "demo",
    title: "Showing demo images",
    detail: `${reason} These are labelled sample images, not generated from your prompt.${retryHint}`,
    retrySettings: settings,
  };
}

function createKeyErrorNotice(error: GenerateError, settings: GenerationSettings): StatusNotice {
  return {
    tone: "error",
    title: error.kind === "auth" ? "Gemini key problem" : "Gemini couldn't generate this",
    detail: error.message,
    retrySettings: { ...settings, modelId: FREE_MODEL },
  };
}

/**
 * useStudio is the studio's state machine: composer settings, one in-flight request, and what happens
 * when it ends.
 *
 * **Flow:** validate the prompt, pick a generator from the factory, generate, then either save the
 * result to history or apply the generator's failure policy. The free model falls back to labelled
 * demo images so the journey never dead-ends; Gemini reports the error so the visitor can fix their key.
 *
 * **Side effects:** persists the composer draft on every change, persists history through useHistory,
 * and lets the visitor cancel the request (Stop) through an AbortController.
 */
export function useStudio() {
  const [settings, setSettings] = useState<GenerationSettings>(DEFAULT_SETTINGS);
  const [pendingSettings, setPendingSettings] = useState<GenerationSettings | null>(null);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [notice, setNotice] = useState<StatusNotice | null>(null);
  // When the visitor picks a Gemini model without a key, remember it until the key dialog is saved.
  const [keyDialog, setKeyDialog] = useState<{ pendingModelId?: string } | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const draftLoadedRef = useRef(false);
  const history = useHistory();
  const { apiKey, updateApiKey } = useApiKey();

  // Declared before the loading effect on purpose: effects run in order, so on mount this sees
  // draftLoadedRef=false and skips, instead of saving the defaults over the stored draft.
  useEffect(() => {
    // Skip the first render so the default settings don't overwrite the saved draft before it loads.
    if (draftLoadedRef.current) saveDraft(settings);
  }, [settings]);

  useEffect(() => {
    const draft = loadDraft();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- storage is only readable after mount
    if (draft) setSettings(draft);
    draftLoadedRef.current = true;
  }, []);

  /** Applies a composer change. Choosing a Gemini model without a key opens the key dialog instead. */
  const updateSettings = (patch: Partial<GenerationSettings>) => {
    if (patch.modelId && patch.modelId !== FREE_MODEL && !apiKey) {
      setKeyDialog({ pendingModelId: patch.modelId });
      return;
    }
    setSettings((current) => ({ ...current, ...patch }));
    if ("prompt" in patch) setPromptError(null);
  };

  /** Runs one generation. Ignored while another is in flight. */
  const generate = async (request: GenerationSettings = settings) => {
    if (pendingSettings) return;
    const error = getPromptError(request.prompt);
    if (error) {
      setPromptError(error);
      document.getElementById("prompt")?.focus();
      return;
    }
    setPromptError(null);
    setNotice(null);
    const controller = new AbortController();
    abortRef.current = controller;
    setPendingSettings(request);
    window.scrollTo({ top: 0, behavior: "smooth" });

    const generator = createGenerator(request.modelId, { apiKey: apiKey?.key });
    let result: Generation;
    try {
      result = await generator.generate(request, controller.signal);
    } catch (e) {
      // Stop pressed: drop the request silently, the visitor chose this.
      if (controller.signal.aborted) return;
      const info: GenerateError = e instanceof GenerationError ? e.info : { kind: "provider_error", message: String(e) };
      if (info.kind === "invalid") {
        setPromptError(info.message);
        return;
      }
      if (generator.onFailure === "report") {
        setNotice(createKeyErrorNotice(info, request));
        return;
      }
      setNotice(createDemoNotice(info, request));
      result = createDemoGeneration(request, DEMO_CARD_NOTICE);
    } finally {
      setPendingSettings(null);
      abortRef.current = null;
    }
    history.addGeneration(result);
  };

  /** Retries from the notice: the same request (demo) or the same prompt on the free model (key error). */
  const retryFromNotice = () => {
    if (!notice) return;
    setSettings(notice.retrySettings);
    generate(notice.retrySettings);
  };

  /** Loads a past generation's settings back into the composer. Older entries get any missing defaults. */
  const reuseSettings = (generation: Generation) => {
    setSettings({ ...DEFAULT_SETTINGS, ...generation.settings });
    document.getElementById("prompt")?.focus();
  };

  /** Generates new variations of a past result with the same settings. */
  const generateVariations = (generation: Generation) => {
    setSettings(generation.settings);
    generate(generation.settings);
  };

  /** Saves or clears the key; a model picked before the key existed is applied once it is saved. */
  const saveKey = (key: string | null, remember: boolean) => {
    updateApiKey(key, remember);
    if (key && keyDialog?.pendingModelId) setSettings((current) => ({ ...current, modelId: keyDialog.pendingModelId! }));
    if (!key) setSettings((current) => ({ ...current, modelId: FREE_MODEL }));
  };

  return {
    settings,
    updateSettings,
    generate,
    cancel: () => abortRef.current?.abort(),
    pendingSettings,
    promptError,
    notice,
    dismissNotice: () => setNotice(null),
    retryFromNotice,
    reuseSettings,
    generateVariations,
    history,
    apiKey,
    keyDialog,
    openKeyDialog: () => setKeyDialog({}),
    closeKeyDialog: () => setKeyDialog(null),
    saveKey,
  };
}
