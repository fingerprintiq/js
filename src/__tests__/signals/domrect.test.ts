import { describe, it, expect, vi, beforeEach } from "vitest";
import { collectDOMRect } from "../../signals/domrect";

describe("collectDOMRect", () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it("returns hashes and rect count", async () => {
    const mockElement = {
      textContent: "",
      style: {} as CSSStyleDeclaration,
      setAttribute: vi.fn(),
      getBoundingClientRect: vi.fn().mockReturnValue({
        x: 0, y: 0, width: 150.5, height: 20.3,
        top: 0, right: 150.5, bottom: 20.3, left: 0,
      }),
      remove: vi.fn(),
      appendChild: vi.fn(),
    };
    vi.spyOn(document, "createElement").mockReturnValue(mockElement as unknown as HTMLElement);
    vi.spyOn(document.body, "appendChild").mockReturnValue(mockElement as unknown as Node);

    const result = await collectDOMRect();
    expect(result).not.toBeNull();
    expect(result!.value.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(result!.value.emojiHash).toMatch(/^[0-9a-f]{64}$/);
    expect(result!.value.rectCount).toBe(4);
  });
});
