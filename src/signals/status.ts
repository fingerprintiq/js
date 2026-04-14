import type { SignalResult, StatusSignal } from "../types";

export async function collectStatus(): Promise<SignalResult<StatusSignal> | null> {
  const start = performance.now();
  try {
    // Timer precision: min delta across 100 consecutive performance.now() calls
    let timingResolution = 0;
    try {
      let minDelta = Infinity;
      let prev = performance.now();
      for (let i = 0; i < 100; i++) {
        const now = performance.now();
        const delta = now - prev;
        if (delta > 0 && delta < minDelta) minDelta = delta;
        prev = now;
      }
      timingResolution = minDelta === Infinity ? 0 : minDelta;
    } catch { /* ignore */ }

    // Max stack size via recursion
    let maxStackSize = 0;
    try {
      const recurse = (depth: number): number => {
        try {
          return recurse(depth + 1);
        } catch {
          return depth;
        }
      };
      maxStackSize = recurse(0);
    } catch { /* ignore */ }

    // Storage quota
    let storageQuotaMB: number | null = null;
    try {
      if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        if (estimate.quota !== undefined) {
          storageQuotaMB = Math.round(estimate.quota / (1024 * 1024));
        }
      }
    } catch { /* ignore */ }

    // Battery
    let battery: { charging: boolean; level: number } | null = null;
    try {
      if ("getBattery" in navigator) {
        const bat = await (navigator as unknown as { getBattery: () => Promise<{ charging: boolean; level: number }> }).getBattery();
        battery = { charging: bat.charging, level: bat.level };
      }
    } catch { /* ignore */ }

    // Heap limit
    let heapLimit: number | null = null;
    try {
      const mem = (performance as unknown as { memory?: { jsHeapSizeLimit: number } }).memory;
      if (mem && mem.jsHeapSizeLimit) {
        heapLimit = mem.jsHeapSizeLimit;
      }
    } catch { /* ignore */ }

    return {
      value: {
        timingResolution,
        maxStackSize,
        storageQuotaMB,
        battery,
        heapLimit,
      },
      duration: performance.now() - start,
    };
  } catch {
    return null;
  }
}
