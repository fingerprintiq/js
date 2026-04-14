import type { SignalResult } from "../types";

export interface IncognitoSignal {
  isPrivate: boolean;
  method: string | null;
}

export async function collectIncognito(): Promise<SignalResult<IncognitoSignal>> {
  const start = performance.now();
  let isPrivate = false;
  let method: string | null = null;

  // Method 1: Storage quota estimation
  // Incognito mode typically limits quota to ~120MB vs ~1GB+ in normal mode
  try {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      if (estimate.quota && estimate.quota < 200 * 1024 * 1024) {
        isPrivate = true;
        method = "storage_quota";
      }
    }
  } catch { /* ignore */ }

  // Method 2: Firefox - indexedDB.databases() throws in private mode
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

  // Method 3: Safari/legacy - webkitRequestFileSystem throws in incognito
  if (!isPrivate) {
    try {
      const win = globalThis as unknown as Record<string, unknown>;
      if (typeof win.webkitRequestFileSystem === "function") {
        await new Promise<void>((resolve, reject) => {
          (win.webkitRequestFileSystem as Function)(
            0, // TEMPORARY
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
