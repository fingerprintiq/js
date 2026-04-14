import { describe, it, expect, vi, beforeEach } from "vitest";
import { collectMedia } from "../../signals/media";

function mockMatchMedia(activeQueries: string[]) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: activeQueries.includes(query),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

describe("collectMedia", () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it("detects dark mode", async () => {
    mockMatchMedia(["(prefers-color-scheme: dark)"]);

    const result = await collectMedia();
    expect(result.value.colorScheme).toBe("dark");
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });

  it("detects light mode", async () => {
    mockMatchMedia(["(prefers-color-scheme: light)"]);

    const result = await collectMedia();
    expect(result.value.colorScheme).toBe("light");
  });

  it("detects fine pointer", async () => {
    mockMatchMedia(["(pointer: fine)"]);

    const result = await collectMedia();
    expect(result.value.pointer).toBe("fine");
  });

  it("detects coarse pointer", async () => {
    mockMatchMedia(["(pointer: coarse)"]);

    const result = await collectMedia();
    expect(result.value.pointer).toBe("coarse");
  });

  it("detects forced colors", async () => {
    mockMatchMedia(["(forced-colors: active)"]);

    const result = await collectMedia();
    expect(result.value.forcedColors).toBe(true);
  });

  it("detects reduced motion", async () => {
    mockMatchMedia(["(prefers-reduced-motion: reduce)"]);

    const result = await collectMedia();
    expect(result.value.reducedMotion).toBe(true);
  });

  it("detects p3 color gamut", async () => {
    mockMatchMedia(["(color-gamut: p3)"]);

    const result = await collectMedia();
    expect(result.value.colorGamut).toBe("p3");
  });

  it("detects hover capability", async () => {
    mockMatchMedia(["(hover: hover)"]);

    const result = await collectMedia();
    expect(result.value.hover).toBe("hover");
  });

  it("detects standalone display mode", async () => {
    mockMatchMedia(["(display-mode: standalone)"]);

    const result = await collectMedia();
    expect(result.value.displayMode).toBe("standalone");
  });

  it("returns default values when no queries match", async () => {
    mockMatchMedia([]);

    const result = await collectMedia();
    expect(result.value.colorScheme).toBe("no-preference");
    expect(result.value.forcedColors).toBe(false);
    expect(result.value.reducedMotion).toBe(false);
  });

  it("always returns a result (never null)", async () => {
    mockMatchMedia([]);

    const result = await collectMedia();
    expect(result).not.toBeNull();
    expect(result.value).toBeDefined();
  });
});
