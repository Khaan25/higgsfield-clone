"use client";

import { useCallback, useEffect, useState } from "react";
import { loadApiKey, saveApiKey } from "./storage";

export interface SavedApiKey {
  key: string;
  /** True when the visitor opted to keep the key after the tab closes. */
  remember: boolean;
}

/**
 * useApiKey holds the visitor's own Gemini key for bring-your-own-key generation.
 * The key only ever lives in this browser: sessionStorage by default, localStorage when remembered.
 *
 * @returns apiKey - The saved key, or null when none is set.
 * @returns updateApiKey - Saves a new key, or clears it when passed null.
 */
export function useApiKey() {
  const [apiKey, setApiKey] = useState<SavedApiKey | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- storage is only readable after mount
    setApiKey(loadApiKey());
  }, []);

  const updateApiKey = useCallback((key: string | null, remember: boolean) => {
    saveApiKey(key, remember);
    setApiKey(key ? { key, remember } : null);
  }, []);

  return { apiKey, updateApiKey };
}
