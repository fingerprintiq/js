import { describe, it, expect, vi, beforeEach } from "vitest";
import { collectFonts } from "../../signals/fonts";

describe("collectFonts", () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it("detects available fonts by width comparison", async () => {
    let callCount = 0;
    const mockSpan = {
      style: {} as CSSStyleDeclaration,
      getBoundingClientRect: vi.fn().mockImplementation(() => {
        callCount++;
        const isInstalled = callCount % 7 === 0;
        return { width: isInstalled ? 150.5 : 100.0, height: 20 };
      }),
      remove: vi.fn(),
      textContent: "",
    };
    vi.spyOn(document, "createElement").mockReturnValue(mockSpan as unknown as HTMLElement);
    vi.spyOn(document.body, "appendChild").mockReturnValue(mockSpan as unknown as Node);

    const result = await collectFonts();
    expect(result).not.toBeNull();
    expect(Array.isArray(result!.value.detected)).toBe(true);
    expect(typeof result!.value.count).toBe("number");
    expect(typeof result!.value.isSpoofed).toBe("boolean");
  });
});
