import { describe, it, expect, vi, beforeEach } from "vitest";
import { collectCanvas } from "../../signals/canvas";

describe("collectCanvas", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns hash and farbling status when canvas is available", async () => {
    const mockContext = {
      fillStyle: "",
      font: "",
      textBaseline: "",
      fillRect: vi.fn(),
      fillText: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      closePath: vi.fn(),
      clearRect: vi.fn(),
      globalCompositeOperation: "source-over",
      createLinearGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
    };
    const mockCanvas = {
      getContext: vi.fn().mockReturnValue(mockContext),
      toDataURL: vi.fn().mockReturnValue("data:image/png;base64,consistent-output"),
      width: 300,
      height: 150,
    };
    vi.spyOn(document, "createElement").mockReturnValue(mockCanvas as unknown as HTMLElement);

    const result = await collectCanvas();
    expect(result).not.toBeNull();
    expect(result!.value.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(result!.value.isFarbled).toBe(false);
    expect(result!.duration).toBeGreaterThanOrEqual(0);
  });

  it("returns null when canvas context is unavailable", async () => {
    const mockCanvas = {
      getContext: vi.fn().mockReturnValue(null),
      width: 300,
      height: 150,
    };
    vi.spyOn(document, "createElement").mockReturnValue(mockCanvas as unknown as HTMLElement);

    const result = await collectCanvas();
    expect(result).toBeNull();
  });

  it("detects farbling when multiple renders differ", async () => {
    let callCount = 0;
    const mockContext = {
      fillStyle: "",
      font: "",
      textBaseline: "",
      fillRect: vi.fn(),
      fillText: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      closePath: vi.fn(),
      clearRect: vi.fn(),
      globalCompositeOperation: "source-over",
      createLinearGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
    };
    const mockCanvas = {
      getContext: vi.fn().mockReturnValue(mockContext),
      toDataURL: vi.fn().mockImplementation(() => {
        callCount++;
        return `data:image/png;base64,output-${callCount}`;
      }),
      width: 300,
      height: 150,
    };
    vi.spyOn(document, "createElement").mockReturnValue(mockCanvas as unknown as HTMLElement);

    const result = await collectCanvas();
    expect(result).not.toBeNull();
    expect(result!.value.isFarbled).toBe(true);
  });
});
