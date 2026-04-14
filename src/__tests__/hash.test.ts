import { describe, it, expect } from "vitest";
import { sha256, murmur3, compositeHash } from "../hash";

describe("sha256", () => {
  it("returns consistent 64-char hex string", async () => {
    const result = await sha256("test input");
    expect(result).toHaveLength(64);
    expect(result).toMatch(/^[0-9a-f]{64}$/);
    const result2 = await sha256("test input");
    expect(result2).toBe(result);
  });

  it("returns different hashes for different inputs", async () => {
    const a = await sha256("input a");
    const b = await sha256("input b");
    expect(a).not.toBe(b);
  });
});

describe("murmur3", () => {
  it("returns consistent 32-bit unsigned integer", () => {
    const result = murmur3("test");
    expect(typeof result).toBe("number");
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(0xffffffff);
    expect(murmur3("test")).toBe(result);
  });

  it("different inputs produce different hashes", () => {
    expect(murmur3("a")).not.toBe(murmur3("b"));
  });

  it("respects seed parameter", () => {
    expect(murmur3("test", 0)).not.toBe(murmur3("test", 42));
  });
});

describe("compositeHash", () => {
  it("produces consistent hash regardless of input order", async () => {
    const a = await compositeHash(["hash1", "hash2", "hash3"]);
    const b = await compositeHash(["hash3", "hash1", "hash2"]);
    expect(a).toBe(b);
  });

  it("produces different hash for different components", async () => {
    const a = await compositeHash(["hash1", "hash2"]);
    const b = await compositeHash(["hash1", "hash3"]);
    expect(a).not.toBe(b);
  });
});
