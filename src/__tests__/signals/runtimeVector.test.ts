import { beforeEach, describe, expect, it } from "vitest";
import { collectRuntimeVector } from "../../signals/runtimeVector";

describe("collectRuntimeVector", () => {
  beforeEach(() => {
    Object.defineProperty(navigator, "hardwareConcurrency", {
      configurable: true,
      value: 8,
    });
    Object.defineProperty(navigator, "deviceMemory", {
      configurable: true,
      value: 8,
    });
    Object.defineProperty(navigator, "connection", {
      configurable: true,
      value: {
        rtt: 50,
        downlink: 10,
        saveData: false,
      },
    });
    Object.defineProperty(performance, "memory", {
      configurable: true,
      value: {
        usedJSHeapSize: 32 * 1024 * 1024,
        totalJSHeapSize: 48 * 1024 * 1024,
        jsHeapSizeLimit: 256 * 1024 * 1024,
      },
    });
    Object.defineProperty(navigator, "storage", {
      configurable: true,
      value: {
        estimate: async () => ({ quota: 512 * 1024 * 1024 }),
      },
    });
  });

  it("collects coarse runtime telemetry", async () => {
    const result = await collectRuntimeVector();

    expect(result).not.toBeNull();
    expect(result?.value.hardwareConcurrency).toBe(8);
    expect(result?.value.jsHeapUsedMB).toBe(32);
    expect(result?.value.storageQuotaMB).toBe(512);
    expect(result?.value.hash).toHaveLength(64);
  });

  it("flags inconsistent heap telemetry", async () => {
    Object.defineProperty(performance, "memory", {
      configurable: true,
      value: {
        usedJSHeapSize: 128 * 1024 * 1024,
        totalJSHeapSize: 64 * 1024 * 1024,
        jsHeapSizeLimit: 32 * 1024 * 1024,
      },
    });

    const result = await collectRuntimeVector();

    expect(result?.value.suspiciousFlags).toContain("heap_used_exceeds_total");
    expect(result?.value.suspiciousFlags).toContain(
      "heap_total_exceeds_limit",
    );
  });
});
