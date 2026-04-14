import { describe, it, expect, vi, beforeEach } from "vitest";
import { collectSvg } from "../../signals/svg";

describe("collectSvg", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns null when SVG text APIs throw", async () => {
    const mockText = {
      setAttribute: vi.fn(),
      getBBox: vi.fn().mockImplementation(() => { throw new Error("unavailable"); }),
      getComputedTextLength: vi.fn().mockImplementation(() => { throw new Error("unavailable"); }),
      getSubStringLength: vi.fn().mockImplementation(() => { throw new Error("unavailable"); }),
      set textContent(_: unknown) {},
    };
    const mockSvg = {
      setAttribute: vi.fn(),
      style: { position: "", left: "", top: "" },
      appendChild: vi.fn(),
    };
    vi.spyOn(document, "createElementNS")
      .mockImplementation((_ns: string, tag: string) => {
        if (tag === "svg") return mockSvg as unknown as Element;
        return mockText as unknown as Element;
      });
    vi.spyOn(document.body, "appendChild").mockReturnValue(mockSvg as unknown as Node);
    vi.spyOn(document.body, "removeChild").mockReturnValue(mockSvg as unknown as Node);

    const result = await collectSvg();
    expect(result).toBeNull();
  });

  it("returns expected shape when SVG APIs are available", async () => {
    let callCount = 0;
    const mockText = {
      setAttribute: vi.fn(),
      getBBox: vi.fn().mockReturnValue({ width: 120.5, height: 20.0 }),
      getComputedTextLength: vi.fn().mockReturnValue(118.3),
      getSubStringLength: vi.fn().mockImplementation(() => {
        callCount++;
        return callCount === 1 ? 55.2 : 45.1;
      }),
      set textContent(_: unknown) {},
    };
    const mockSvg = {
      setAttribute: vi.fn(),
      style: { position: "", left: "", top: "" },
      appendChild: vi.fn(),
    };
    vi.spyOn(document, "createElementNS")
      .mockImplementation((_ns: string, tag: string) => {
        if (tag === "svg") return mockSvg as unknown as Element;
        return mockText as unknown as Element;
      });
    vi.spyOn(document.body, "appendChild").mockReturnValue(mockSvg as unknown as Node);
    vi.spyOn(document.body, "removeChild").mockReturnValue(mockSvg as unknown as Node);

    const result = await collectSvg();
    expect(result).not.toBeNull();
    expect(result!.value.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(result!.value.textLengths.length).toBeGreaterThan(0);
    expect(result!.duration).toBeGreaterThanOrEqual(0);
  });
});
