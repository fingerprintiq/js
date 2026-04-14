import { describe, it, expect, vi, beforeEach } from "vitest";
import { collectHeadless } from "../../signals/headless";

describe("collectHeadless", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete (globalThis as Record<string, unknown>).__playwright;
    delete (globalThis as Record<string, unknown>).__puppeteer;
    delete (globalThis as Record<string, unknown>)._selenium;
  });

  it("returns markers array and isHeadless flag", async () => {
    const result = await collectHeadless();
    expect(Array.isArray(result.value.markers)).toBe(true);
    expect(typeof result.value.isHeadless).toBe("boolean");
  });

  it("detects playwright marker", async () => {
    (globalThis as Record<string, unknown>).__playwright = {};
    (globalThis as Record<string, unknown>).__puppeteer = {};
    const result = await collectHeadless();
    expect(result.value.markers).toContain("playwright");
    expect(result.value.markers).toContain("puppeteer");
    expect(result.value.isHeadless).toBe(true);
  });
});
