import { describe, it, expect, vi, beforeEach } from "vitest";
import { collectScreen } from "../../signals/screen";

describe("collectScreen", () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it("collects screen dimensions", async () => {
    vi.stubGlobal("screen", {
      width: 1920,
      height: 1080,
      availWidth: 1920,
      availHeight: 1040,
      colorDepth: 24,
    });
    vi.stubGlobal("window", { devicePixelRatio: 2 });

    const result = await collectScreen();
    expect(result.value.width).toBe(1920);
    expect(result.value.height).toBe(1080);
    expect(result.value.availWidth).toBe(1920);
    expect(result.value.availHeight).toBe(1040);
    expect(result.value.colorDepth).toBe(24);
    expect(result.value.pixelRatio).toBe(2);
    expect(result.value.isFirefoxRfp).toBe(false);
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });

  it("detects Firefox RFP when width=height=1000 and pixelRatio=1", async () => {
    vi.stubGlobal("screen", {
      width: 1000,
      height: 1000,
      availWidth: 1000,
      availHeight: 1000,
      colorDepth: 24,
    });
    vi.stubGlobal("window", { devicePixelRatio: 1 });

    const result = await collectScreen();
    expect(result.value.isFirefoxRfp).toBe(true);
  });

  it("detects Firefox RFP when width=height=1400 and pixelRatio=1", async () => {
    vi.stubGlobal("screen", {
      width: 1400,
      height: 1400,
      availWidth: 1400,
      availHeight: 1400,
      colorDepth: 24,
    });
    vi.stubGlobal("window", { devicePixelRatio: 1 });

    const result = await collectScreen();
    expect(result.value.isFirefoxRfp).toBe(true);
  });

  it("detects Firefox RFP when width=height=1600 and pixelRatio=1", async () => {
    vi.stubGlobal("screen", {
      width: 1600,
      height: 1600,
      availWidth: 1600,
      availHeight: 1600,
      colorDepth: 24,
    });
    vi.stubGlobal("window", { devicePixelRatio: 1 });

    const result = await collectScreen();
    expect(result.value.isFirefoxRfp).toBe(true);
  });

  it("does not flag RFP when width matches but height differs", async () => {
    vi.stubGlobal("screen", {
      width: 1000,
      height: 800,
      availWidth: 1000,
      availHeight: 800,
      colorDepth: 24,
    });
    vi.stubGlobal("window", { devicePixelRatio: 1 });

    const result = await collectScreen();
    expect(result.value.isFirefoxRfp).toBe(false);
  });

  it("does not flag RFP when width=height=1000 but pixelRatio is not 1", async () => {
    vi.stubGlobal("screen", {
      width: 1000,
      height: 1000,
      availWidth: 1000,
      availHeight: 1000,
      colorDepth: 24,
    });
    vi.stubGlobal("window", { devicePixelRatio: 2 });

    const result = await collectScreen();
    expect(result.value.isFirefoxRfp).toBe(false);
  });

  it("always returns a result (never null)", async () => {
    vi.stubGlobal("screen", {
      width: 1280,
      height: 720,
      availWidth: 1280,
      availHeight: 700,
      colorDepth: 24,
    });
    vi.stubGlobal("window", { devicePixelRatio: 1 });

    const result = await collectScreen();
    expect(result).not.toBeNull();
    expect(result.value).toBeDefined();
  });
});
