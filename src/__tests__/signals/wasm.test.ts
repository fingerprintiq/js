import { describe, it, expect, vi, beforeEach } from "vitest";
import { collectWasmTiming } from "../../signals/wasm";

describe("collectWasmTiming", () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it("returns median and stddev of execution timing", async () => {
    const result = await collectWasmTiming();
    expect(result).not.toBeNull();
    expect(typeof result!.value.medianMs).toBe("number");
    expect(result!.value.medianMs).toBeGreaterThanOrEqual(0);
    expect(typeof result!.value.stddevMs).toBe("number");
    expect(result!.value.stddevMs).toBeGreaterThanOrEqual(0);
  });

  it("returns null when WebAssembly is unavailable", async () => {
    const original = globalThis.WebAssembly;
    vi.stubGlobal("WebAssembly", undefined);
    const result = await collectWasmTiming();
    expect(result).toBeNull();
    vi.stubGlobal("WebAssembly", original);
  });
});
