import { describe, it, expect, vi, beforeEach } from "vitest";
import { collectCssStyle } from "../../signals/cssStyle";

describe("collectCssStyle", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns expected shape with valid hashes", async () => {
    const result = await collectCssStyle();
    expect(result).not.toBeNull();
    expect(typeof result!.value.propertyCount).toBe("number");
    expect(result!.value.propertyCount).toBeGreaterThanOrEqual(0);
    expect(result!.value.systemColorHash).toMatch(/^[0-9a-f]{64}$/);
    expect(result!.value.systemFontHash).toMatch(/^[0-9a-f]{64}$/);
    expect(result!.value.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(result!.duration).toBeGreaterThanOrEqual(0);
  });

  it("produces deterministic hashes", async () => {
    const r1 = await collectCssStyle();
    const r2 = await collectCssStyle();
    expect(r1!.value.hash).toBe(r2!.value.hash);
    expect(r1!.value.systemColorHash).toBe(r2!.value.systemColorHash);
    expect(r1!.value.systemFontHash).toBe(r2!.value.systemFontHash);
  });

  it("returns null when document is unavailable", async () => {
    const origDoc = globalThis.document;
    // @ts-expect-error intentional
    delete globalThis.document;
    const result = await collectCssStyle();
    expect(result).toBeNull();
    globalThis.document = origDoc;
  });
});
