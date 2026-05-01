import { describe, it, expect, vi, beforeEach } from "vitest";
import { collectWindowFeatures } from "../../signals/windowFeatures";

describe("collectWindowFeatures", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns expected shape", async () => {
    const result = await collectWindowFeatures();
    expect(result).not.toBeNull();
    expect(typeof result!.value.propertyCount).toBe("number");
    expect(result!.value.propertyCount).toBeGreaterThan(0);
    expect(typeof result!.value.webkitCount).toBe("number");
    expect(typeof result!.value.mozCount).toBe("number");
    expect(Array.isArray(result!.value.litterKeys)).toBe(true);
    expect(result!.value.litterKeys.length).toBeLessThanOrEqual(50);
    expect(result!.value.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(result!.duration).toBeGreaterThanOrEqual(0);
  });

  it("detects webkit prefixed properties", async () => {
    const originalGetOwnPropertyNames = Object.getOwnPropertyNames.bind(Object);
    vi.spyOn(Object, "getOwnPropertyNames").mockImplementation((obj) => {
      const names = originalGetOwnPropertyNames(obj);
      if (obj === window) {
        return [...names, "webkitRequestAnimationFrame", "webkitURL"];
      }
      return names;
    });

    const result = await collectWindowFeatures();
    expect(result).not.toBeNull();
    expect(result!.value.webkitCount).toBeGreaterThanOrEqual(2);
  });

  it("detects litter keys injected by extensions", async () => {
    // Inject directly onto window so they appear in getOwnPropertyNames
    (globalThis as Record<string, unknown>)["zzz_extensionInjectedThing"] = true;
    (globalThis as Record<string, unknown>)["zzz_someExtensionVar"] = true;

    const result = await collectWindowFeatures();
    expect(result).not.toBeNull();
    expect(result!.value.litterKeys.length).toBeLessThanOrEqual(50);

    delete (globalThis as Record<string, unknown>)["zzz_extensionInjectedThing"];
    delete (globalThis as Record<string, unknown>)["zzz_someExtensionVar"];
  });

  it("caps litter keys at 50", async () => {
    const originalGetOwnPropertyNames = Object.getOwnPropertyNames.bind(Object);
    const extras = Array.from({ length: 60 }, (_, i) => `litterProp${i}`);
    vi.spyOn(Object, "getOwnPropertyNames").mockImplementation((obj) => {
      const names = originalGetOwnPropertyNames(obj);
      if (obj === window) return [...names, ...extras];
      return names;
    });

    const result = await collectWindowFeatures();
    expect(result).not.toBeNull();
    expect(result!.value.litterKeys.length).toBeLessThanOrEqual(50);
  });

  it("produces deterministic hash", async () => {
    const r1 = await collectWindowFeatures();
    const r2 = await collectWindowFeatures();
    expect(r1!.value.hash).toBe(r2!.value.hash);
  });
});
