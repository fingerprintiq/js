import { describe, it, expect, vi, beforeEach } from "vitest";
import { collectResistance } from "../../signals/resistance";

describe("collectResistance", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns expected shape with numeric timerPrecisionMs", async () => {
    const result = await collectResistance();
    expect(result).not.toBeNull();
    expect(typeof result!.value.timerPrecisionMs).toBe("number");
    expect(result!.value.timerPrecisionMs).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(result!.value.extensions)).toBe(true);
    expect(result!.duration).toBeGreaterThanOrEqual(0);
  });

  it("browser is null or a recognized value in normal environment", async () => {
    const result = await collectResistance();
    const validBrowsers = [null, "brave", "tor", "firefox-rfp"];
    expect(validBrowsers).toContain(result!.value.browser);
  });

  it("detects brave when navigator.brave.isBrave() returns true", async () => {
    const nav = navigator as Navigator & { brave?: { isBrave: () => Promise<boolean> } };
    nav.brave = { isBrave: vi.fn().mockResolvedValue(true) };

    const result = await collectResistance();
    expect(result!.value.browser).toBe("brave");

    delete nav.brave;
  });

  it("extensions array contains only known extension strings", async () => {
    const result = await collectResistance();
    const knownExtensions = ["duckduckgo", "canvas-blocker", "jshelter", "trace"];
    for (const ext of result!.value.extensions) {
      expect(knownExtensions).toContain(ext);
    }
  });

  it("detects canvas-blocker when toDataURL returns different values", async () => {
    let callCount = 0;
    const origCreate = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = origCreate(tag);
      if (tag === "canvas") {
        // Mock getContext to return a minimal context so the canvas block runs
        Object.defineProperty(el, "getContext", {
          value: (type: string) => {
            if (type === "2d") {
              return {
                fillStyle: "",
                fillRect: () => {},
              };
            }
            return null;
          },
          writable: true,
        });
        // Override toDataURL to return different values each call
        Object.defineProperty(el, "toDataURL", {
          value: () => `data:image/png;base64,farbled-${++callCount}`,
          writable: true,
        });
      }
      return el;
    });

    const result = await collectResistance();
    expect(result).not.toBeNull();
    expect(result!.value.extensions).toContain("canvas-blocker");
  });
});
