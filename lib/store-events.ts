/**
 * A single notification channel for our localStorage-backed stores.
 *
 * The browser's `storage` event only fires in *other* tabs, so same-tab writes
 * have to announce themselves. Draft and project stores share this registry, so
 * one write wakes every subscriber and each re-reads its own snapshot.
 */

const listeners = new Set<() => void>();

export function notifyStorageChanged(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeToStorage(listener: () => void): () => void {
  listeners.add(listener);
  if (typeof window !== "undefined") {
    window.addEventListener("storage", listener);
  }
  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", listener);
    }
  };
}

/** Reads a raw key with every failure mode swallowed; callers validate. */
export function readRawKey(key: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
