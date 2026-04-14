import { describe, expect, it, vi, afterEach } from "vitest";
import { collectUaClientHints } from "../../signals/uaClientHints";

describe("collectUaClientHints", () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, "userAgentData");
    vi.restoreAllMocks();
  });

  it("returns unavailable when userAgentData is missing", async () => {
    const result = await collectUaClientHints();
    expect(result).not.toBeNull();
    expect(result!.value.available).toBe(false);
    expect(result!.value.hash).toBeNull();
  });

  it("collects low and high entropy hints when available", async () => {
    Object.defineProperty(navigator, "userAgentData", {
      configurable: true,
      value: {
        brands: [
          { brand: "Chromium", version: "136" },
          { brand: "Google Chrome", version: "136" },
        ],
        mobile: false,
        platform: "macOS",
        getHighEntropyValues: async (hints: string[]) => {
          expect(hints).toContain("fullVersionList");
          return {
            architecture: "arm",
            bitness: "64",
            formFactors: ["Desktop"],
            fullVersionList: [
              { brand: "Google Chrome", version: "136.0.0.0" },
              { brand: "Chromium", version: "136.0.0.0" },
            ],
            model: "",
            platformVersion: "15.4.0",
            wow64: false,
          };
        },
      },
    });

    const result = await collectUaClientHints();
    expect(result).not.toBeNull();
    expect(result!.value.available).toBe(true);
    expect(result!.value.platform).toBe("macOS");
    expect(result!.value.architecture).toBe("arm");
    expect(result!.value.fullVersionList).toHaveLength(2);
    expect(result!.value.hash).toMatch(/^[0-9a-f]{64}$/);
  });
});
