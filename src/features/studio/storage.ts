import type { Generation, GenerationSettings } from "@/lib/types";

const DRAFT_KEY = "lumen:draft";
const HISTORY_KEY = "lumen:history";

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export const loadDraft = () => read<GenerationSettings>(DRAFT_KEY);
export const loadHistory = () => read<Generation[]>(HISTORY_KEY) ?? [];

export function saveDraft(s: GenerationSettings) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(s));
  } catch {
    /* storage unavailable: the draft just won't survive a reload */
  }
}

/** Live images are stored inline as data URLs, so a full quota evicts the oldest generations until the write fits. */
// ponytail: localStorage caps history at ~5MB (~40 images); move images to IndexedDB if people need more.
export function saveHistory(history: Generation[]): Generation[] {
  let kept = history;
  while (true) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(kept));
      return kept;
    } catch (e) {
      // Storage blocked (private mode etc.): keep everything in memory, just don't persist.
      if (!(e instanceof DOMException && e.name === "QuotaExceededError") || !kept.length) return history;
      kept = kept.slice(0, -1);
    }
  }
}
