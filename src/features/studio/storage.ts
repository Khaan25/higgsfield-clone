import { draftSchema, generationSchema, type Generation, type GenerationSettings } from "@/lib/schema";

/**
 * Browser persistence for the studio. localStorage is untrusted input (older app versions, manual edits,
 * other tabs), so every read is validated with zod and anything unreadable is dropped rather than rendered.
 * Every access is wrapped in try/catch because storage can be disabled (private mode, blocked cookies);
 * the app keeps working in memory when it is.
 */

const DRAFT_KEY = "lumen:draft";
const HISTORY_KEY = "lumen:history";
const API_KEY_KEY = "lumen:gemini-key";

function readJson(storage: Storage, key: string): unknown {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Restores the composer draft; each field falls back to its default if it is missing or invalid. */
export function loadDraft(): GenerationSettings | null {
  const raw = readJson(localStorage, DRAFT_KEY);
  if (!raw) return null;
  const parsed = draftSchema.safeParse(raw);
  return parsed.success ? (parsed.data as GenerationSettings) : null;
}

/**
 * Restores saved generations, keeping only entries that still match the current schema.
 * Entries saved before the model picker existed have no `modelId`; the schema fills in "free".
 */
export function loadHistory(): Generation[] {
  const raw = readJson(localStorage, HISTORY_KEY);
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((entry) => {
    const parsed = generationSchema.safeParse(entry);
    return parsed.success ? [parsed.data] : [];
  });
}

export function saveDraft(settings: GenerationSettings) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(settings));
  } catch {
    // Storage unavailable: the draft just won't survive a reload.
  }
}

/**
 * Persists history and returns what was actually kept.
 * Live images are stored inline as data URLs, so when the quota is full the oldest generations are
 * evicted until the write fits; the caller should render the returned list so screen and storage agree.
 */
// ponytail: localStorage caps history at ~5MB (~40 images); move images to IndexedDB if people need more.
export function saveHistory(history: Generation[]): Generation[] {
  let kept = history;
  while (true) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(kept));
      return kept;
    } catch (e) {
      // Storage blocked (private mode etc.): keep everything in memory, just don't persist.
      const isQuotaError = e instanceof DOMException && e.name === "QuotaExceededError";
      if (!isQuotaError || !kept.length) return history;
      kept = kept.slice(0, -1);
    }
  }
}

/**
 * The visitor's own Gemini key. It lives in sessionStorage by default (gone when the tab closes)
 * and in localStorage only if they ticked "Remember on this device".
 */
export function loadApiKey(): { key: string; remember: boolean } | null {
  try {
    const remembered = localStorage.getItem(API_KEY_KEY);
    if (remembered) return { key: remembered, remember: true };
    const sessionKey = sessionStorage.getItem(API_KEY_KEY);
    return sessionKey ? { key: sessionKey, remember: false } : null;
  } catch {
    return null;
  }
}

/** Saves or clears the key. Both stores are cleared first so a key never lingers in the one not chosen. */
export function saveApiKey(key: string | null, remember: boolean) {
  try {
    localStorage.removeItem(API_KEY_KEY);
    sessionStorage.removeItem(API_KEY_KEY);
    if (key) (remember ? localStorage : sessionStorage).setItem(API_KEY_KEY, key);
  } catch {
    // Storage blocked: the key lives in memory for this page only.
  }
}
