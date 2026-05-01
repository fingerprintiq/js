import type { IncognitoSignal, SignalResult } from "../types";

export async function collectIncognito(): Promise<SignalResult<IncognitoSignal>> {
  const start = performance.now();
  let isPrivate = false;
  let method: string | null = null;

  // Chromium private profiles usually expose a much smaller storage quota.
  try {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      if (estimate.quota && estimate.quota < 200 * 1024 * 1024) {
        isPrivate = true;
        method = "storage_quota";
      }
    }
  } catch { /* ignore */ }

  // Firefox private mode rejects indexedDB.databases().
  if (!isPrivate) {
    try {
      const idb = globalThis.indexedDB as unknown as Record<string, unknown>;
      if (typeof idb?.databases === "function") {
        await (idb.databases as () => Promise<unknown>)();
      }
    } catch {
      isPrivate = true;
      method = "indexeddb_databases";
    }
  }

  // Safari private mode rejects webkitRequestFileSystem.
  if (!isPrivate) {
    try {
      const win = globalThis as unknown as Record<string, unknown>;
      if (typeof win.webkitRequestFileSystem === "function") {
        await new Promise<void>((resolve, reject) => {
          (win.webkitRequestFileSystem as Function)(
            0,
            1,
            () => resolve(),
            () => reject(new Error("filesystem_denied")),
          );
        });
      }
    } catch {
      isPrivate = true;
      method = "webkit_filesystem";
    }
  }

  return {
    value: { isPrivate, method },
    duration: performance.now() - start,
  };
}
