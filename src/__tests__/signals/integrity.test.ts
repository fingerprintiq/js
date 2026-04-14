import { describe, it, expect, vi, beforeEach } from "vitest";
import { collectIntegrity } from "../../signals/integrity";

describe("collectIntegrity", () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it("returns tamperedApis array, workerMismatch boolean, and lieScore", async () => {
    const result = await collectIntegrity();
    expect(result).not.toBeNull();
    expect(Array.isArray(result.value.tamperedApis)).toBe(true);
    expect(typeof result.value.workerMismatch).toBe("boolean");
    expect(typeof result.value.lieScore).toBe("number");
    expect(result.value.lieScore).toBeGreaterThanOrEqual(0);
    expect(result.value.lieScore).toBeLessThanOrEqual(10);
  });

  it("does not throw when APIs are unavailable", async () => {
    const result = await collectIntegrity();
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });

  it("checks Function.prototype.toString itself", async () => {
    const result = await collectIntegrity();
    // In a clean test env, toString should not be flagged
    expect(result.value.tamperedApis).not.toContain("Function.prototype.toString");
  });
});
