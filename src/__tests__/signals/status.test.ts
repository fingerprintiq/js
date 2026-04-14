import { describe, it, expect, vi, beforeEach } from "vitest";
import { collectStatus } from "../../signals/status";

describe("collectStatus", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Reset navigator.storage mock
    delete (navigator as unknown as Record<string, unknown>).storage;
  });

  it("returns expected shape", async () => {
    const result = await collectStatus();
    expect(result).not.toBeNull();
    expect(typeof result!.value.timingResolution).toBe("number");
    expect(typeof result!.value.maxStackSize).toBe("number");
    expect(result!.value.maxStackSize).toBeGreaterThan(0);
    // storageQuotaMB, battery, heapLimit can be null
    expect(result!.value.storageQuotaMB === null || typeof result!.value.storageQuotaMB === "number").toBe(true);
    expect(result!.value.battery === null || typeof result!.value.battery === "object").toBe(true);
    expect(result!.value.heapLimit === null || typeof result!.value.heapLimit === "number").toBe(true);
    expect(result!.duration).toBeGreaterThanOrEqual(0);
  });

  it("reads storage quota when navigator.storage.estimate is available", async () => {
    Object.defineProperty(navigator, "storage", {
      value: {
        estimate: vi.fn().mockResolvedValue({ quota: 10 * 1024 * 1024 * 1024 }),
      },
      configurable: true,
    });

    const result = await collectStatus();
    expect(result).not.toBeNull();
    expect(result!.value.storageQuotaMB).toBe(10240);
  });

  it("reads battery when getBattery is available", async () => {
    Object.defineProperty(navigator, "getBattery", {
      value: vi.fn().mockResolvedValue({ charging: true, level: 0.85 }),
      configurable: true,
      writable: true,
    });

    const result = await collectStatus();
    expect(result).not.toBeNull();
    expect(result!.value.battery).toEqual({ charging: true, level: 0.85 });
  });

  it("reads heap limit when performance.memory is available", async () => {
    Object.defineProperty(performance, "memory", {
      value: { jsHeapSizeLimit: 4294705152 },
      configurable: true,
    });

    const result = await collectStatus();
    expect(result).not.toBeNull();
    expect(result!.value.heapLimit).toBe(4294705152);
  });
});
