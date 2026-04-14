import { describe, it, expect, beforeEach, vi } from "vitest";
import { collectHtmlElement } from "../../signals/htmlElement";

describe("collectHtmlElement", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns expected shape with propertyCount and hash", async () => {
    const result = await collectHtmlElement();
    expect(result).not.toBeNull();
    expect(typeof result!.value.propertyCount).toBe("number");
    expect(result!.value.propertyCount).toBeGreaterThan(0);
    expect(result!.value.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(result!.duration).toBeGreaterThanOrEqual(0);
  });

  it("produces deterministic hash", async () => {
    const r1 = await collectHtmlElement();
    const r2 = await collectHtmlElement();
    expect(r1!.value.hash).toBe(r2!.value.hash);
    expect(r1!.value.propertyCount).toBe(r2!.value.propertyCount);
  });

  it("returns null on error", async () => {
    vi.spyOn(Object, "getPrototypeOf").mockImplementation(() => {
      throw new Error("not allowed");
    });
    const result = await collectHtmlElement();
    expect(result).toBeNull();
  });
});
