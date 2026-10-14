"use client";

import { useCallback, useEffect, useState } from "react";
import type { Generation } from "@/lib/schema";
import { loadHistory, saveHistory } from "./storage";

/**
 * useHistory owns the visitor's saved generations on this device.
 * It hydrates from localStorage after mount (so the server and first client render match) and writes
 * through on every change; the list it exposes is whatever storage actually kept after quota eviction.
 *
 * @returns history - Saved generations, newest first.
 * @returns isHydrated - False until saved history has been read; used to avoid flashing the empty state.
 * @returns addGeneration / removeGeneration / clearHistory - Mutations that persist immediately.
 */
export function useHistory() {
  const [history, setHistory] = useState<Generation[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Reading storage must wait for the browser; this one-time sync is the intended use of the effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHistory(loadHistory());
    setIsHydrated(true);
  }, []);

  const addGeneration = useCallback((generation: Generation) => setHistory((current) => saveHistory([generation, ...current])), []);
  const removeGeneration = useCallback((id: string) => setHistory((current) => saveHistory(current.filter((g) => g.id !== id))), []);
  const clearHistory = useCallback(() => setHistory(saveHistory([])), []);

  return { history, isHydrated, addGeneration, removeGeneration, clearHistory };
}
