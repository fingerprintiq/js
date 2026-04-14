import type { RuntimeVectorSignal, SignalResult } from "../types";
import { sha256 } from "../hash";

function roundNumber(value: number | null | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Number(value.toFixed(2));
}

function bucketedMemoryMb(value: number | null): number | null {
  if (value === null) return null;
  return Math.round(value / 64) * 64;
}

export async function collectRuntimeVector(): Promise<
  SignalResult<RuntimeVectorSignal> | null
> {
  const start = performance.now();

  try {
    const nav = navigator as Navigator & Record<string, unknown>;
    const perf = performance as Performance & {
      memory?: {
        usedJSHeapSize?: number;
        totalJSHeapSize?: number;
        jsHeapSizeLimit?: number;
      };
    };
    const connection = (nav.connection ?? null) as
      | {
          rtt?: number;
          downlink?: number;
          saveData?: boolean;
        }
      | null;

    let timingResolutionMs: number | null = null;
    try {
      let minDelta = Infinity;
      let previous = performance.now();
      for (let i = 0; i < 64; i += 1) {
        const current = performance.now();
        const delta = current - previous;
        if (delta > 0 && delta < minDelta) {
          minDelta = delta;
        }
        previous = current;
      }
      timingResolutionMs = minDelta === Infinity ? null : roundNumber(minDelta);
    } catch {
      timingResolutionMs = null;
    }

    let maxStackSize: number | null = null;
    try {
      const recurse = (depth: number): number => {
        try {
          return recurse(depth + 1);
        } catch {
          return depth;
        }
      };
      maxStackSize = recurse(0);
    } catch {
      maxStackSize = null;
    }

    let storageQuotaMB: number | null = null;
    try {
      const estimate = await navigator.storage?.estimate?.();
      if (typeof estimate?.quota === "number") {
        storageQuotaMB = Math.round(estimate.quota / (1024 * 1024));
      }
    } catch {
      storageQuotaMB = null;
    }

    const value: RuntimeVectorSignal = {
      hardwareConcurrency:
        typeof nav.hardwareConcurrency === "number"
          ? nav.hardwareConcurrency
          : 0,
      deviceMemory:
        typeof (nav as Record<string, unknown>).deviceMemory === "number"
          ? ((nav as Record<string, unknown>).deviceMemory as number)
          : null,
      timingResolutionMs,
      maxStackSize,
      storageQuotaMB,
      jsHeapUsedMB:
        typeof perf.memory?.usedJSHeapSize === "number"
          ? roundNumber(perf.memory.usedJSHeapSize / (1024 * 1024))
          : null,
      jsHeapTotalMB:
        typeof perf.memory?.totalJSHeapSize === "number"
          ? roundNumber(perf.memory.totalJSHeapSize / (1024 * 1024))
          : null,
      jsHeapLimitMB:
        typeof perf.memory?.jsHeapSizeLimit === "number"
          ? roundNumber(perf.memory.jsHeapSizeLimit / (1024 * 1024))
          : null,
      networkRttMs:
        typeof connection?.rtt === "number" ? roundNumber(connection.rtt) : null,
      downlinkMbps:
        typeof connection?.downlink === "number"
          ? roundNumber(connection.downlink)
          : null,
      saveData:
        typeof connection?.saveData === "boolean" ? connection.saveData : null,
      suspiciousFlags: [],
      hash: "",
    };

    if (value.hardwareConcurrency <= 0) {
      value.suspiciousFlags.push("invalid_hardware_concurrency");
    }
    if (
      value.deviceMemory !== null &&
      ![0.25, 0.5, 1, 2, 4, 8, 16, 32].includes(value.deviceMemory)
    ) {
      value.suspiciousFlags.push("unexpected_device_memory_bucket");
    }
    if (
      value.jsHeapUsedMB !== null &&
      value.jsHeapTotalMB !== null &&
      value.jsHeapUsedMB > value.jsHeapTotalMB
    ) {
      value.suspiciousFlags.push("heap_used_exceeds_total");
    }
    if (
      value.jsHeapTotalMB !== null &&
      value.jsHeapLimitMB !== null &&
      value.jsHeapTotalMB > value.jsHeapLimitMB
    ) {
      value.suspiciousFlags.push("heap_total_exceeds_limit");
    }
    if (value.networkRttMs !== null && value.networkRttMs < 0) {
      value.suspiciousFlags.push("negative_network_rtt");
    }

    const hashInput = [
      `hardwareConcurrency:${value.hardwareConcurrency}`,
      `deviceMemory:${String(value.deviceMemory ?? "")}`,
      `timingResolutionMs:${String(value.timingResolutionMs ?? "")}`,
      `maxStackSize:${String(value.maxStackSize ?? "")}`,
      `storageQuotaMB:${String(value.storageQuotaMB ?? "")}`,
      `heapLimitBucket:${String(bucketedMemoryMb(value.jsHeapLimitMB))}`,
      `networkRttMs:${String(value.networkRttMs ?? "")}`,
      `downlinkMbps:${String(value.downlinkMbps ?? "")}`,
      `saveData:${String(value.saveData ?? "")}`,
      `flags:${value.suspiciousFlags.join(",")}`,
    ];
    value.hash = await sha256(hashInput.join("|"));

    return {
      value,
      duration: performance.now() - start,
    };
  } catch {
    return null;
  }
}
