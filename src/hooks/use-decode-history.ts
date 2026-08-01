"use client";

import { useCallback, useSyncExternalStore } from "react";

export interface HistoryEntry {
  vin: string;
  title: string;
  decodedAt: number;
}

const STORAGE_KEY = "vin-decoder:history";
const CHANGE_EVENT = "vin-decoder:history-changed";
const MAX_ENTRIES = 20;
const EMPTY: HistoryEntry[] = [];

// useSyncExternalStore needs a referentially stable snapshot — cache the
// parsed array against the raw string.
let cachedRaw: string | null = null;
let cachedEntries: HistoryEntry[] = EMPTY;

function getSnapshot(): HistoryEntry[] {
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return EMPTY;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    if (!raw) {
      cachedEntries = EMPTY;
    } else {
      try {
        const parsed = JSON.parse(raw);
        cachedEntries = Array.isArray(parsed) ? parsed : EMPTY;
      } catch {
        cachedEntries = EMPTY;
      }
    }
  }
  return cachedEntries;
}

function subscribe(onChange: () => void): () => void {
  // "storage" covers other tabs; the custom event covers this one.
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function notifyChanged(): void {
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function saveToHistory(entry: Omit<HistoryEntry, "decodedAt">): void {
  try {
    const rest = getSnapshot().filter((e) => e.vin !== entry.vin);
    const next = [{ ...entry, decodedAt: Date.now() }, ...rest].slice(0, MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    notifyChanged();
  } catch {
    // Private browsing / quota — history is best-effort.
  }
}

export function useDecodeHistory() {
  const entries = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);

  const clear = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      notifyChanged();
    } catch {
      // best-effort
    }
  }, []);

  return { entries, clear };
}
