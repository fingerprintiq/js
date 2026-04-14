import { describe, it, expect, vi, beforeEach } from "vitest";
import { collectWebGPU } from "../../signals/webgpu";

describe("collectWebGPU", () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it("returns adapter info when WebGPU is available", async () => {
    const mockAdapter = {
      info: { vendor: "nvidia", architecture: "ampere", device: "geforce-rtx-3080", description: "NVIDIA GeForce RTX 3080" },
      features: new Set(["texture-compression-bc", "float32-filterable"]),
    };
    Object.defineProperty(globalThis.navigator, "gpu", {
      value: { requestAdapter: vi.fn().mockResolvedValue(mockAdapter) },
      writable: true, configurable: true,
    });

    const result = await collectWebGPU();
    expect(result.value.available).toBe(true);
    expect(result.value.vendor).toBe("nvidia");
    expect(result.value.features).toContain("texture-compression-bc");
  });

  it("returns unavailable when navigator.gpu is missing", async () => {
    Object.defineProperty(globalThis.navigator, "gpu", { value: undefined, writable: true, configurable: true });
    const result = await collectWebGPU();
    expect(result.value.available).toBe(false);
    expect(result.value.vendor).toBe("");
  });

  it("handles adapter request failure gracefully", async () => {
    Object.defineProperty(globalThis.navigator, "gpu", {
      value: { requestAdapter: vi.fn().mockResolvedValue(null) },
      writable: true, configurable: true,
    });
    const result = await collectWebGPU();
    expect(result.value.available).toBe(false);
  });
});
