import { describe, it, expect, beforeEach, vi } from "vitest";
import { collectStorage } from "../../signals/storage";

describe("collectStorage", () => {
  beforeEach(() => {
    try { localStorage.removeItem("fiq_vid"); } catch { /* ignore */ }
    try { sessionStorage.removeItem("fiq_vid"); } catch { /* ignore */ }
    vi.restoreAllMocks();
  });

  it("detects localStorage as a boolean", async () => {
    const result = await collectStorage();
    expect(result).not.toBeNull();
    expect(typeof result.value.localStorage).toBe("boolean");
  });

  it("detects sessionStorage as a boolean", async () => {
    const result = await collectStorage();
    expect(typeof result.value.sessionStorage).toBe("boolean");
  });

  it("detects indexedDb as a boolean", async () => {
    const result = await collectStorage();
    expect(typeof result.value.indexedDb).toBe("boolean");
  });

  it("detects cookie as a boolean", async () => {
    const result = await collectStorage();
    expect(typeof result.value.cookie).toBe("boolean");
  });

  it("returns survivingMechanisms as an array", async () => {
    const result = await collectStorage();
    expect(Array.isArray(result.value.survivingMechanisms)).toBe(true);
  });

  it("reports localStorage as surviving when fiq_vid exists in localStorage", async () => {
    const store: Record<string, string> = { fiq_vid: "test-visitor-id" };
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => { store[key] = value; },
      removeItem: (key: string) => { delete store[key]; },
    });
    const result = await collectStorage();
    expect(result.value.survivingMechanisms).toContain("localStorage");
  });

  it("reports sessionStorage as surviving when fiq_vid exists in sessionStorage", async () => {
    sessionStorage.setItem("fiq_vid", "test-visitor-id");
    const result = await collectStorage();
    expect(result.value.survivingMechanisms).toContain("sessionStorage");
  });

  it("does not report localStorage as surviving when fiq_vid is absent", async () => {
    const result = await collectStorage();
    expect(result.value.survivingMechanisms).not.toContain("localStorage");
  });

  it("does not report sessionStorage as surviving when fiq_vid is absent", async () => {
    const result = await collectStorage();
    expect(result.value.survivingMechanisms).not.toContain("sessionStorage");
  });

  it("reports both localStorage and sessionStorage surviving when both have fiq_vid", async () => {
    const lsStore: Record<string, string> = { fiq_vid: "visitor-a" };
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => lsStore[key] ?? null,
      setItem: (key: string, value: string) => { lsStore[key] = value; },
      removeItem: (key: string) => { delete lsStore[key]; },
    });
    sessionStorage.setItem("fiq_vid", "visitor-b");
    const result = await collectStorage();
    expect(result.value.survivingMechanisms).toContain("localStorage");
    expect(result.value.survivingMechanisms).toContain("sessionStorage");
  });

  it("includes duration in result", async () => {
    const result = await collectStorage();
    expect(typeof result.duration).toBe("number");
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });

  it("always returns a result (never null)", async () => {
    const result = await collectStorage();
    expect(result).not.toBeNull();
    expect(result).toBeDefined();
  });
});
