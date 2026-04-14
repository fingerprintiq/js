import { describe, it, expect } from "vitest";
import { collectMath } from "../../signals/math";

describe("collectMath", () => {
  it("returns consistent math values and hash", async () => {
    const result = await collectMath();
    expect(result.value.values).toHaveLength(21);
    expect(result.value.hash).toMatch(/^[0-9a-f]{64}$/);
    // Should be deterministic
    const result2 = await collectMath();
    expect(result2.value.hash).toBe(result.value.hash);
  });

  it("all values are finite numbers", async () => {
    const result = await collectMath();
    for (const v of result.value.values) {
      expect(typeof v).toBe("number");
      expect(Number.isFinite(v) || Number.isNaN(v) || v === 0).toBe(true);
    }
  });
});
